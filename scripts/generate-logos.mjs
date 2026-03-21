import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '..', 'public')

const logoSvg = readFileSync(resolve(publicDir, 'logo.svg'))

// Generate favicon and app icon PNGs from master SVG
const sizes = [
  { size: 32, name: 'favicon-32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
]

for (const { size, name } of sizes) {
  await sharp(logoSvg, { density: 300 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(resolve(publicDir, name))
  console.log(`Generated: ${name} (${size}x${size})`)
}

// Generate OG image: 1200x630 with #1A1A2E background, logo centered ~300px tall
const logoHeight = 300
const logoResized = await sharp(logoSvg, { density: 300 })
  .resize({ height: logoHeight, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()

const logoMeta = await sharp(logoResized).metadata()
const logoWidth = logoMeta.width

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: { r: 26, g: 26, b: 46, alpha: 255 },
  },
})
  .composite([
    {
      input: logoResized,
      left: Math.round((1200 - logoWidth) / 2),
      top: Math.round((630 - logoHeight) / 2),
    },
  ])
  .png()
  .toFile(resolve(publicDir, 'og-logo.png'))

console.log('Generated: og-logo.png (1200x630)')

// Generate 48x48 PNG then rename to .ico (single-frame ICO)
await sharp(logoSvg, { density: 300 })
  .resize(48, 48)
  .png()
  .toFile(resolve(publicDir, 'favicon.ico'))
console.log('Generated: favicon.ico (48x48)')

// Copy logo.svg as favicon.svg
const { copyFileSync } = await import('fs')
copyFileSync(resolve(publicDir, 'logo.svg'), resolve(publicDir, 'favicon.svg'))
console.log('Copied: logo.svg → favicon.svg')

console.log('\nAll logo assets generated!')
