import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

const DEFAULT_COLORS = ['#6C47FF', '#FF6B6B', '#4ECDC4', '#FFE66D', '#2D6A4F']
const BG = '#1A1A2E'

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function textColor(hex: string): string {
  return luminance(hex) > 0.4 ? '#1A1A2E' : '#FFFFFF'
}

export default function handler(req: Request) {
  const { searchParams } = new URL(req.url)
  const palette = searchParams.get('p')

  const colors = palette
    ? palette
        .split('-')
        .slice(0, 8)
        .map((c) => `#${c.replace('#', '')}`)
        .filter((c) => /^#[0-9A-Fa-f]{6}$/.test(c))
    : DEFAULT_COLORS

  if (colors.length === 0) colors.push(...DEFAULT_COLORS)

  const groupWidth = 740
  const barHeight = 280
  const gap = 4
  const totalGaps = (colors.length - 1) * gap
  const barWidth = Math.floor((groupWidth - totalGaps) / colors.length)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: BG,
        }}
      >
        {/* Color bars container */}
        <div
          style={{
            display: 'flex',
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 40,
          }}
        >
          {colors.map((color, i) => (
            <div
              key={i}
              style={{
                width: barWidth,
                height: barHeight,
                backgroundColor: color,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: 16,
                marginLeft: i > 0 ? gap : 0,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: textColor(color),
                  opacity: 0.85,
                  letterSpacing: '0.02em',
                }}
              >
                {color.toUpperCase()}
              </span>
            </div>
          ))}
        </div>

        {/* Branding */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: '#FFFFFF',
              marginBottom: 8,
            }}
          >
            Paletta
          </span>
          <span
            style={{
              fontSize: 20,
              color: '#9CA3AF',
            }}
          >
            AI Color Palette Generator
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    }
  )
}
