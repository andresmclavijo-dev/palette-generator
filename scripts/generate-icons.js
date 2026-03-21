import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '..', 'public')

function makeSvg(size) {
  const rx = Math.round(size * 0.22)
  const fontSize = Math.round(size * 0.69)
  const textY = Math.round(size * 0.69)
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#6C47FF"/>
  <text x="${size / 2}" y="${textY}" text-anchor="middle" font-family="ui-monospace, 'SF Mono', 'Cascadia Code', monospace" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">P</text>
</svg>`)
}

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
]

for (const { size, name } of sizes) {
  await sharp(makeSvg(size))
    .resize(size, size)
    .png()
    .toFile(resolve(publicDir, name))
  console.log(`Generated: ${name} (${size}x${size})`)
}

console.log('All icons generated!')
