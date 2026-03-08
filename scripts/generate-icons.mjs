/**
 * Generates PWA icon PNGs (192, 512) from public/icons/favicon-128x128.png using sharp.
 * Run: node scripts/generate-icons.mjs
 */
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const source = resolve(root, 'public/icons/favicon-128x128.png')

const sizes = [192, 512]

for (const size of sizes) {
  const dest = resolve(root, `public/icons/icon-${size}.png`)
  await sharp(source)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(dest)
  console.log(`Generated ${dest}`)
}

console.log('Done.')
