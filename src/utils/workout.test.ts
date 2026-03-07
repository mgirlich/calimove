import { describe, expect, it } from 'vitest'

import type { Workout } from '../types/data'

import { formatMinutes, middleWorkout, timeActive, timeBreak, totalTime } from './workout'

const workout = (overrides: Partial<Workout> = {}): Workout => ({
  workout_id: 1,
  lecture_id: 1,
  flow_id: 1,
  n_sets: 1,
  n_reps: 1,
  durations: [30, 30, 30],
  ...overrides,
})

describe('timeActive', () => {
  it('sums durations × sets × reps', () => {
    expect(timeActive(workout({ n_sets: 2, n_reps: 3, durations: [10, 20] }))).toBe(180)
  })
})

describe('timeBreak', () => {
  it('1 set × 1 rep × 3 exercises: (3-1)×15+16 = 46', () => {
    expect(timeBreak(workout({ durations: [30, 30, 30] }))).toBe(46)
  })

  it('2 sets × 1 rep × 2 exercises: (4-1)×15+16 = 61', () => {
    expect(timeBreak(workout({ n_sets: 2, n_reps: 1, durations: [30, 30] }))).toBe(61)
  })
})

describe('totalTime', () => {
  it('equals timeActive + timeBreak', () => {
    const w = workout({ n_sets: 2, n_reps: 2, durations: [40, 40, 40] })
    expect(totalTime(w)).toBe(timeActive(w) + timeBreak(w))
  })
})

describe('middleWorkout', () => {
  it('returns undefined for empty list', () => {
    expect(middleWorkout([])).toBeUndefined()
  })

  it('returns the only item for a single-item list', () => {
    const w = workout()
    expect(middleWorkout([w])).toBe(w)
  })

  it('returns the middle item by total time', () => {
    const short = workout({ workout_id: 1, n_sets: 1, durations: [30] })
    const mid = workout({ workout_id: 2, n_sets: 2, durations: [30] })
    const long = workout({ workout_id: 3, n_sets: 3, durations: [30] })
    expect(middleWorkout([long, short, mid])?.workout_id).toBe(2)
  })
})

describe('formatMinutes', () => {
  it('rounds up to nearest minute', () => {
    expect(formatMinutes(60)).toBe('1 min')
    expect(formatMinutes(61)).toBe('2 min')
    expect(formatMinutes(1800)).toBe('30 min')
  })
})
