// One-time script to upload exercise images to Supabase Storage.
//
// Prerequisites:
//   1. Create a public bucket named 'exercise-images' in the Supabase dashboard,
//      or let this script create it for you (requires service role key).
//   2. Run:  node --env-file=.env.local scripts/upload-images.mjs
//
// Safe to re-run — uses upsert so existing files are overwritten.

import { readFileSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const imagesDir = resolve(__dirname, '../public/exercise_images')

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)
const BUCKET = 'exercise-images'

// Ensure bucket exists and is public
const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
  public: true,
  allowedMimeTypes: ['image/png'],
})
if (bucketError && bucketError.message !== 'The resource already exists') {
  console.error('Failed to create bucket:', bucketError.message)
  process.exit(1)
}

const files = readdirSync(imagesDir).filter((f) => f.endsWith('.png'))
console.log(`Uploading ${files.length} images to storage bucket "${BUCKET}"…\n`)

let uploaded = 0
let failed = 0

for (const file of files) {
  const data = readFileSync(resolve(imagesDir, file))
  const { error } = await supabase.storage.from(BUCKET).upload(file, data, {
    contentType: 'image/png',
    upsert: true,
  })
  if (error) {
    console.error(`  ✗ ${file}: ${error.message}`)
    failed++
  } else {
    console.log(`  ✓ ${file}`)
    uploaded++
  }
}

console.log(`\nDone. ${uploaded} uploaded, ${failed} failed.`)
