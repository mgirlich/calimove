import { createClient } from '@supabase/supabase-js'

// The calimove schema is not yet reflected in database.generated.ts
// (needs `pnpm db:types` after the migration is applied and the schema is exposed).
// All calimove queries go through `db` and results are cast to domain types.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export const db = supabase.schema('calimove')

export function exerciseImageUrl(exerciseId: number): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/exercise-images/exercise_${exerciseId}.png`
}

export function exerciseAudioUrl(exerciseId: number, voice = 'Adam'): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/exercise-audio/${voice}/${exerciseId}.mp3`
}
