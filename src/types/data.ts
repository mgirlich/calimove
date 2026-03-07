// Domain types for static data imported from src/data/*.json.
// These are the app's working types — separate from the raw DB types.

export interface FlowBase {
  flow_id: number
  level: number
  name: string // 'A' | 'B' | 'C' | 'D'
}

export interface ExerciseBase {
  exercise_id: number
  lecture_id: number
  name: string
  mod_lecture_id: number | null
}

export interface Exercise extends ExerciseBase {
  flows: FlowBase[]
}

export interface Flow extends FlowBase {
  exercises: ExerciseBase[]
}

export interface Workout {
  workout_id: number
  lecture_id: number
  flow_id: number
  n_sets: number
  n_reps: number
  durations: number[] // one per exercise in the flow, in seconds
}

// Exercise with its active duration — used during practice
export interface WorkoutExercise extends ExerciseBase {
  duration: number
}

// Execution row from Supabase (calimove.executions)
export interface Execution {
  execution_id: string // uuid
  workout_id: number | null
  flow_id: number
  user_id: string // uuid
  finished_at: string // ISO 8601
}
