import type { Workout } from '../types/data'

const SECONDS_REST = 15 // between reps/exercises/sets
const SECONDS_OVERHEAD = 16 // 8s initial + 3s finish + 5s buffer

/** Total active exercise time in seconds. */
export function timeActive(workout: Workout): number {
  return workout.n_sets * workout.n_reps * workout.durations.reduce((a, b) => a + b, 0)
}

/**
 * Total rest time in seconds.
 * 16s = 8s initial + 3s finish + 5s buffer; 15s per break between reps/exercises/sets.
 */
export function timeBreak(workout: Workout): number {
  return (
    (workout.n_sets * workout.n_reps * workout.durations.length - 1) * SECONDS_REST +
    SECONDS_OVERHEAD
  )
}

/** Total workout duration in seconds. */
export function totalTime(workout: Workout): number {
  return timeActive(workout) + timeBreak(workout)
}

/**
 * Returns the middle workout by total duration from a sorted list.
 * Used to pre-select the default variant on the flow detail page.
 */
export function middleWorkout(workouts: Workout[]): Workout | undefined {
  if (workouts.length === 0) return undefined
  const sorted = workouts.toSorted((a, b) => totalTime(a) - totalTime(b))
  return sorted[Math.floor(sorted.length / 2)]
}

/** Formats a duration in seconds as "X min". */
export function formatMinutes(seconds: number): string {
  return `${Math.ceil(seconds / 60)} min`
}
