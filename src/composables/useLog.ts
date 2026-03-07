import { ref, watchEffect } from 'vue'

import { db } from '../lib/supabase'
import type { Execution } from '../types/data'
import type { StreakInfo, WeekdayStats } from '../utils/stats'
import { computeStreaks, computeWeekdayStats } from '../utils/stats'

import { useAuth } from './useAuth'

export interface LogState {
  executions: Execution[]
  streaks: StreakInfo
  weekdayStats: WeekdayStats[]
  loading: boolean
  error: string | null
}

export function useLog() {
  const { user } = useAuth()

  const state = ref<LogState>({
    executions: [],
    streaks: { current: 0, max: 0, total: 0 },
    weekdayStats: [],
    loading: false,
    error: null,
  })

  watchEffect(async () => {
    if (!user.value) {
      state.value = {
        executions: [],
        streaks: { current: 0, max: 0, total: 0 },
        weekdayStats: [],
        loading: false,
        error: null,
      }
      return
    }

    state.value.loading = true
    state.value.error = null

    const { data, error } = await db
      .from('executions')
      .select('*')
      .order('finished_at', { ascending: true })
      .returns<Execution[]>()

    if (error) {
      state.value.loading = false
      state.value.error = error.message
      return
    }

    const executions = data ?? []
    state.value = {
      executions,
      streaks: computeStreaks(executions),
      weekdayStats: computeWeekdayStats(executions),
      loading: false,
      error: null,
    }
  })

  return state
}
