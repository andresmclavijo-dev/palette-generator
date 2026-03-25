import type { VercelRequest, VercelResponse } from '@vercel/node'
import sharp from 'sharp'

// Brand colors used as default palette
const DEFAULT_COLORS = ['6C47FF', 'FF6B6B', '4ECDC4', 'FFE66D', '2D6A4F']

const WIDTH = 1200
const HEIGHT = 630
const PADDING = 48
const SWATCH_TOP = 60
const SWATCH_HEIGHT = 380
const SWATCH_RADIUS = 20
const HEX_FONT_SIZE = 16
const BRAND_VIOLET = '#6C47FF'

function parseColors(param: string | undefined | null): string[] {
  if (!param) return DEFAULT_COLORS
  const parts = param.split('-')
  if (parts.length < 3 || parts.length > 8) return DEFAULT_COLORS
  const valid = parts.every(p => /^[0-9a-fA-F]{6}$/.test(p))
  if (!valid) return DEFAULT_COLORS
  return parts
}

/** Simple luminance check — returns true if color is light */
function isLight(hex: string): boolean {
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 0.6
}

function buildSvg(colors: string[]): string {
  const n = colors.length
  const gap = 8
  const totalGaps = (n - 1) * gap
  const swatchAreaWidth = WIDTH - PADDING * 2
  const barWidth = (swatchAreaWidth - totalGaps) / n

  let swatches = ''

  for (let i = 0; i < n; i++) {
    const x = PADDING + i * (barWidth + gap)
    const hex = colors[i]
    const textColor = isLight(hex) ? '#1a1a2e' : '#ffffff'

    // Round corners on first and last bars
    const rx = i === 0 || i === n - 1 ? SWATCH_RADIUS : 0

    if (i === 0) {
      // First bar: round left corners
      swatches += `<rect x="${x}" y="${SWATCH_TOP}" width="${barWidth}" height="${SWATCH_HEIGHT}" fill="#${hex}" rx="${rx}" />`
      // Cover right corners
      swatches += `<rect x="${x + barWidth - rx}" y="${SWATCH_TOP}" width="${rx}" height="${SWATCH_HEIGHT}" fill="#${hex}" />`
    } else if (i === n - 1) {
      // Last bar: round right corners
      swatches += `<rect x="${x}" y="${SWATCH_TOP}" width="${barWidth}" height="${SWATCH_HEIGHT}" fill="#${hex}" rx="${rx}" />`
      // Cover left corners
      swatches += `<rect x="${x}" y="${SWATCH_TOP}" width="${rx}" height="${SWATCH_HEIGHT}" fill="#${hex}" />`
    } else {
      swatches += `<rect x="${x}" y="${SWATCH_TOP}" width="${barWidth}" height="${SWATCH_HEIGHT}" fill="#${hex}" />`
    }

    // Hex label centered below swatch
    const labelY = SWATCH_TOP + SWATCH_HEIGHT + 32
    swatches += `<text x="${x + barWidth / 2}" y="${labelY}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${HEX_FONT_SIZE}" font-weight="600" fill="#666">#${hex.toUpperCase()}</text>`

    // "Aa" contrast preview inside swatch
    const aaY = SWATCH_TOP + SWATCH_HEIGHT / 2 + 8
    swatches += `<text x="${x + barWidth / 2}" y="${aaY}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${barWidth > 120 ? 42 : 32}" font-weight="800" fill="${textColor}" opacity="0.85">Aa</text>`
  }

  // Brand watermark bottom-right
  const brandX = WIDTH - PADDING
  const brandY = HEIGHT - 40
  const taglineY = HEIGHT - 22

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#EEEEEC" />
  ${swatches}
  <text x="${brandX}" y="${brandY}" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="700" fill="${BRAND_VIOLET}">Paletta</text>
  <text x="${brandX}" y="${taglineY}" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#999">usepaletta.io</text>
</svg>`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const p = req.query.p as string | undefined
    const colors = parseColors(p)
    const svg = buildSvg(colors)

    const png = await sharp(Buffer.from(svg))
      .png({ quality: 90 })
      .toBuffer()

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, s-maxage=604800, stale-while-revalidate=86400')
    res.status(200).end(png)
  } catch (err) {
    console.error('[api/og] Error generating OG image:', err)
    // Return a 1x1 transparent PNG as fallback
    const fallback = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    res.setHeader('Content-Type', 'image/png')
    res.status(200).end(fallback)
  }
}
