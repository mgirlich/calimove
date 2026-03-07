import { describe, expect, it } from 'vitest'

import type { Execution } from '../types/data'

import { computeStreaks, computeWeekdayStats } from './stats'

function makeExecution(date: string, flowId = 1): Execution {
  return {
    execution_id: crypto.randomUUID(),
    workout_id: 1,
    flow_id: flowId,
    user_id: 'user-1',
    finished_at: `${date}T10:00:00Z`,
  }
}

describe('computeStreaks', () => {
  it('returns zeros for empty list', () => {
    expect(computeStreaks([])).toEqual({ current: 0, max: 0, total: 0 })
  })

  it('counts total workouts including duplicates on same day', () => {
    const executions = [makeExecution('2024-01-01'), makeExecution('2024-01-01')]
    const result = computeStreaks(executions)
    expect(result.total).toBe(2)
  })

  it('computes max streak across a gap', () => {
    const executions = [
      makeExecution('2024-01-01'),
      makeExecution('2024-01-02'),
      makeExecution('2024-01-03'),
      makeExecution('2024-01-05'), // gap
      makeExecution('2024-01-06'),
    ]
    expect(computeStreaks(executions).max).toBe(3)
  })

  it('max streak is 1 for a single workout', () => {
    expect(computeStreaks([makeExecution('2024-01-01')]).max).toBe(1)
  })

  it('current streak is 0 when last workout was more than 1 day ago', () => {
    const oldDate = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10)
    const executions = [makeExecution(oldDate)]
    expect(computeStreaks(executions).current).toBe(0)
  })

  it('current streak includes yesterday', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
    const dayBefore = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10)
    const executions = [makeExecution(dayBefore), makeExecution(yesterday)]
    expect(computeStreaks(executions).current).toBe(2)
  })
})

describe('computeWeekdayStats', () => {
  it('returns 7 entries', () => {
    expect(computeWeekdayStats([])).toHaveLength(7)
  })

  it('all ratios are 0 when no executions', () => {
    const stats = computeWeekdayStats([])
    expect(stats.every((s) => s.ratio === 0)).toBe(true)
  })

  it('a day with all workouts has ratio 7 (7× the expected 1/7)', () => {
    // All workouts on a Sunday (day 0)
    const executions = [
      makeExecution('2024-01-07'), // Sunday
      makeExecution('2024-01-07'),
      makeExecution('2024-01-07'),
    ]
    const stats = computeWeekdayStats(executions)
    expect(stats[0].ratio).toBeCloseTo(7)
    expect(stats[0].count).toBe(3)
    // All other days: ratio 0
    expect(stats.slice(1).every((s) => s.ratio === 0)).toBe(true)
  })

  it('assigns correct labels', () => {
    const stats = computeWeekdayStats([])
    expect(stats.map((s) => s.label)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
  })
})
