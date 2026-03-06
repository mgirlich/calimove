// Generates static JSON data files from Supabase into src/data/.
// Run once after seeding, or whenever the underlying data changes (rarely).
//
// Prerequisites:
//   - Supabase project seeded (run scripts/seed.mjs first)
//   - "calimove" added to exposed schemas:
//       Supabase dashboard → Settings → API → Exposed schemas
//
// Usage:
//   node --env-file=.env.local scripts/generate-data.mjs

import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data')

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: 'calimove' },
})

async function fetchAll(table) {
  const { data, error } = await db.from(table).select('*')
  if (error) throw new Error(`${table}: ${error.message}`)
  return data
}

function write(filename, data) {
  mkdirSync(OUT, { recursive: true })
  writeFileSync(resolve(OUT, filename), JSON.stringify(data, null, 2) + '\n')
  console.log(`  ✓ src/data/${filename} (${data.length} rows)`)
}

async function generate() {
  const [exercises, flows, flowExercises, workouts] = await Promise.all([
    fetchAll('exercises'),
    fetchAll('flows'),
    fetchAll('flow_exercises'),
    fetchAll('workouts'),
  ])

  // exercises.json — each exercise with its flows, sorted alphabetically
  const exercisesWithFlows = exercises
    .map((exercise) => ({
      ...exercise,
      flows: flowExercises
        .filter((fe) => fe.exercise_id === exercise.exercise_id)
        .map((fe) => flows.find((f) => f.flow_id === fe.flow_id))
        .filter(Boolean)
        .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
  write('exercises.json', exercisesWithFlows)

  // flows.json — each flow with its exercises in position order
  const flowsWithExercises = flows
    .sort((a, b) => a.flow_id - b.flow_id)
    .map((flow) => ({
      ...flow,
      exercises: flowExercises
        .filter((fe) => fe.flow_id === flow.flow_id)
        .sort((a, b) => a.position - b.position)
        .map((fe) => exercises.find((e) => e.exercise_id === fe.exercise_id))
        .filter(Boolean),
    }))
  write('flows.json', flowsWithExercises)

  // workouts.json — flat list, durations already integer[] from Postgres
  const workoutsSorted = workouts.sort((a, b) => a.workout_id - b.workout_id)
  write('workouts.json', workoutsSorted)
}

generate()
  .then(() => {
    console.log('\nDone. Commit src/data/ to the repository.')
    console.log('Then run: pnpm db:types  (to regenerate types with calimove schema)')
  })
  .catch((err) => {
    console.error('\nFailed:', err.message)
    process.exit(1)
  })
