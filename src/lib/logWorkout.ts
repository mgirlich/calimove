import workoutsData from '../data/workouts.json'
import type { Workout } from '../types/data'

import { supabase, db } from './supabase'

const workouts = workoutsData as Workout[]

/**
 * Logs a completed workout for the current authenticated user.
 * Throws if the user is not authenticated or the workout is not found.
 */
export async function logWorkout(workoutId: number): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const workout = workouts.find((w) => w.workout_id === workoutId)
  if (!workout) throw new Error(`Workout ${workoutId} not found`)

  const { error } = await db.from('executions').insert({
    workout_id: workoutId,
    flow_id: workout.flow_id,
    user_id: user.id,
  })

  if (error) throw new Error(error.message)
}
