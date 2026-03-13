import { readFileSync, readdirSync } from 'fs'

import { createClient } from '@supabase/supabase-js'

// Node --env-file can include literal quotes if the value is quoted in the file
const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.trim().replace(/^["']|["']$/g, '')
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^["']|["']$/g, '')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const BUCKET = 'exercise-audio'
const VOICE = 'Adam'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const files = readdirSync(`./audio/${VOICE}`).filter((f) => f.endsWith('.mp3'))
console.log(`Uploading ${files.length} files to ${BUCKET}/${VOICE}/...\n`)

for (const file of files) {
  const data = readFileSync(`./audio/${VOICE}/${file}`)
  const { error } = await supabase.storage.from(BUCKET).upload(`${VOICE}/${file}`, data, {
    contentType: 'audio/mpeg',
    upsert: true,
  })
  if (error) {
    console.error(`❌ Failed ${file}:`, error.message)
  } else {
    console.log(`✅ ${file}`)
  }
}

console.log('\nDone!')
