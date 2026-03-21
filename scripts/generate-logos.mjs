import sharp from 'sharp'
import { readFileSync, copyFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '..', 'public')

const logoSvg = readFileSync(resolve(publicDir, 'logo.svg'))
const BG = { r: 26, g: 26, b: 46 } // #1A1A2E

// Favicon — no padding needed at small sizes
const faviconSizes = [
  { size: 32, name: 'favicon-32.png' },
]

for (const { size, name } of faviconSizes) {
  await sharp(logoSvg, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { ...BG, alpha: 0 } })
    .png()
    .toFile(resolve(publicDir, name))
  console.log(`Generated: ${name} (${size}x${size})`)
}

// App icons — 85% logo on #1A1A2E background for safe zone padding
const appIcons = [
  { canvas: 180, name: 'apple-touch-icon.png' },
  { canvas: 192, name: 'icon-192.png' },
  { canvas: 512, name: 'icon-512.png' },
]

for (const { canvas, name } of appIcons) {
  const logoSize = Math.round(canvas * 0.85)
  const logoBuffer = await sharp(logoSvg, { density: 300 })
    .resize(logoSize, logoSize, { fit: 'contain', background: { ...BG, alpha: 0 } })
    .png()
    .toBuffer()

  await sharp({
    create: { width: canvas, height: canvas, channels: 4, background: { ...BG, alpha: 255 } },
  })
    .composite([{ input: logoBuffer, gravity: 'centre' }])
    .png()
    .toFile(resolve(publicDir, name))
  console.log(`Generated: ${name} (${canvas}x${canvas}, logo ${logoSize}px)`)
}

// OG image: 1200x630 with #1A1A2E background, logo centered ~300px tall
const logoHeight = 300
const logoResized = await sharp(logoSvg, { density: 300 })
  .resize({ height: logoHeight, fit: 'contain', background: { ...BG, alpha: 0 } })
  .png()
  .toBuffer()

const logoMeta = await sharp(logoResized).metadata()
const logoWidth = logoMeta.width

await sharp({
  create: { width: 1200, height: 630, channels: 4, background: { ...BG, alpha: 255 } },
})
  .composite([{
    input: logoResized,
    left: Math.round((1200 - logoWidth) / 2),
    top: Math.round((630 - logoHeight) / 2),
  }])
  .png()
  .toFile(resolve(publicDir, 'og-logo.png'))
console.log('Generated: og-logo.png (1200x630)')

// Favicon ICO — 48x48 PNG renamed to .ico (single-frame)
await sharp(logoSvg, { density: 300 })
  .resize(48, 48)
  .png()
  .toFile(resolve(publicDir, 'favicon.ico'))
console.log('Generated: favicon.ico (48x48)')

// Copy logo.svg as favicon.svg
copyFileSync(resolve(publicDir, 'logo.svg'), resolve(publicDir, 'favicon.svg'))
console.log('Copied: logo.svg → favicon.svg')

console.log('\nAll logo assets generated!')
