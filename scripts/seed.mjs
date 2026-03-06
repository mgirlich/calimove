// One-time script to seed Supabase from the extracted SQLite data.
//
// Prerequisites:
//   1. Run:  bash scripts/extract.sh /path/to/calimove-mobility.sqlite
//   2. Copy .env.example to .env.local and fill in values
//   3. Apply the SQL migration in the Supabase dashboard or via: supabase db push
//   4. Run:  node --env-file=.env.local scripts/seed.mjs
//
// OWNER_USER_ID is optional. When set, the 11 existing executions are migrated
// and assigned to that user. Create your Supabase account first, then copy
// the UUID from: Supabase dashboard → Authentication → Users.

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OWNER_USER_ID } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: 'calimove' },
})

function readData(name) {
  const path = resolve(__dirname, 'data', `${name}.json`)
  if (!existsSync(path)) {
    console.error(`Missing: ${path}`)
    console.error('Run:  bash scripts/extract.sh /path/to/calimove-mobility.sqlite')
    process.exit(1)
  }
  return JSON.parse(readFileSync(path, 'utf-8'))
}

async function upsert(table, rows) {
  const { error } = await supabase.from(table).upsert(rows)
  if (error) throw new Error(`${table}: ${error.message}`)
  console.log(`  ✓ ${rows.length} rows → ${table}`)
}

async function seed() {
  console.log('Seeding static data...')

  await upsert('exercises', readData('exercises'))
  await upsert('flows', readData('flows'))
  await upsert('flow_exercises', readData('flow_exercises'))

  // Convert durations from semicolon string to integer array
  const workoutsRaw = readData('workouts')
  const workouts = workoutsRaw.map(({ durations, ...rest }) => ({
    ...rest,
    durations: durations.split(';').map(Number),
  }))
  await upsert('workouts', workouts)

  if (!OWNER_USER_ID) {
    console.log('\nSkipping execution migration (OWNER_USER_ID not set).')
    console.log('Set it in .env.local to migrate existing workout history.')
    return
  }

  console.log('\nMigrating execution history...')

  const seededWorkoutIds = new Set(workouts.map((w) => w.workout_id))
  const executionsRaw = readData('executions')

  const executions = executionsRaw.map(({ workout_id, flow_id, finished_at }) => ({
    // 3 old executions referenced skip=1 workouts that were not seeded;
    // workout_id is set to null for those, but flow_id is always preserved.
    workout_id: seededWorkoutIds.has(workout_id) ? workout_id : null,
    flow_id,
    user_id: OWNER_USER_ID,
    finished_at,
  }))

  const { error } = await supabase.from('executions').insert(executions)
  if (error) throw new Error(`executions: ${error.message}`)
  console.log(`  ✓ ${executions.length} rows → executions`)
}

seed()
  .then(() => console.log('\nDone.'))
  .catch((err) => {
    console.error('\nSeed failed:', err.message)
    process.exit(1)
  })
