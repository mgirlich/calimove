import type { Execution } from '../types/data'

export interface StreakInfo {
  current: number
  max: number
  total: number
}

export interface WeekdayStats {
  // 0 = Sunday … 6 = Saturday (JS Date convention)
  day: number
  label: string
  count: number
  // ratio vs. expected (1/7). >1 means over-represented, <1 under-represented.
  ratio: number
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Returns unique calendar dates (YYYY-MM-DD) from executions, sorted ascending. */
function uniqueDates(executions: Execution[]): string[] {
  const dates = new Set(executions.map((e) => e.finished_at.slice(0, 10)))
  return [...dates].toSorted()
}

/** Computes current streak, max streak, and total workout count. */
export function computeStreaks(executions: Execution[]): StreakInfo {
  const total = executions.length
  if (total === 0) return { current: 0, max: 0, total: 0 }

  const dates = uniqueDates(executions)

  // Walk forward computing streak lengths
  let maxStreak = 1
  let runLength = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86_400_000)
    if (diffDays === 1) {
      runLength++
      if (runLength > maxStreak) maxStreak = runLength
    } else {
      runLength = 1
    }
  }

  // Current streak: count backwards from today
  const todayStr = new Date().toISOString().slice(0, 10)
  const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  const lastDate = dates.at(-1)!

  let current = 0
  if (lastDate === todayStr || lastDate === yesterdayStr) {
    current = 1
    for (let i = dates.length - 2; i >= 0; i--) {
      const next = new Date(dates[i + 1])
      const curr = new Date(dates[i])
      const diffDays = Math.round((next.getTime() - curr.getTime()) / 86_400_000)
      if (diffDays === 1) {
        current++
      } else {
        break
      }
    }
  }

  return { current, max: maxStreak, total }
}

/** Computes weekday distribution relative to an even 1/7 split. */
export function computeWeekdayStats(executions: Execution[]): WeekdayStats[] {
  const counts = Array.from({ length: 7 }, () => 0)
  for (const e of executions) {
    const day = new Date(e.finished_at).getDay() // 0=Sun … 6=Sat
    counts[day]++
  }

  const total = executions.length
  const expected = 1 / 7

  return counts.map((count, day) => {
    const actual = total > 0 ? count / total : 0
    return {
      day,
      label: DAY_LABELS[day],
      count,
      ratio: total > 0 ? actual / expected : 0,
    }
  })
}
