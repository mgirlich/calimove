<script setup lang="ts">
import { computed } from 'vue'

import { useLog } from '../composables/useLog'
import { useNextFlow } from '../composables/useNextFlow'
import flowsData from '../data/flows.json'
import workoutsData from '../data/workouts.json'
import type { Flow, Workout } from '../types/data'
import { middleWorkout, workoutTimeLabel } from '../utils/workout'

const workouts = workoutsData as Workout[]
const flows = flowsData as Flow[]
const flowMap = new Map(flows.map((f) => [f.flow_id, f]))

const log = useLog()
const nextFlow = useNextFlow()

const nextWorkout = computed(() => {
  if (!nextFlow.value) return null
  const flowWorkouts = workouts.filter((w) => w.flow_id === nextFlow.value!.flow_id)
  return middleWorkout(flowWorkouts) ?? null
})

// Weekday chart: Mon–Sun order (indices 1–6, then 0)
const orderedWeekdayStats = computed(() => {
  if (log.value.weekdayStats.length === 0) return []
  return [1, 2, 3, 4, 5, 6, 0].map((i) => log.value.weekdayStats[i]!)
})

const maxWeekdayCount = computed(() => Math.max(...log.value.weekdayStats.map((s) => s.count), 1))

const recentExecutions = computed(() => log.value.executions.toReversed())

function flowLabel(flowId: number) {
  const f = flowMap.get(flowId)
  return f ? `Level ${f.level} · Flow ${f.name}` : `Flow ${flowId}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <UContainer class="page-content space-y-10 max-w-2xl">
    <!-- Next workout -->
    <section>
      <p class="section-heading">Your next workout</p>

      <UCard v-if="nextFlow && nextWorkout">
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm text-muted mb-1">
              Level {{ nextFlow.level }} · Flow {{ nextFlow.name }}
            </p>
            <p class="text-xl font-semibold">{{ nextFlow.exercises.length }} exercises</p>
            <p class="text-sm text-muted mt-1">
              {{ nextWorkout.n_sets }} set{{ nextWorkout.n_sets !== 1 ? 's' : '' }} ·
              {{ nextWorkout.n_reps }} rep{{ nextWorkout.n_reps !== 1 ? 's' : '' }} · ~{{
                workoutTimeLabel(nextWorkout).total
              }}
            </p>
          </div>

          <UButton
            :to="`/flows/${nextFlow.flow_id}`"
            size="lg"
            trailing-icon="i-lucide-arrow-right"
            class="shrink-0"
          >
            Start
          </UButton>
        </div>
      </UCard>
    </section>

    <!-- Stats -->
    <section>
      <p class="section-heading">Stats</p>

      <div class="grid grid-cols-3 gap-4">
        <UCard>
          <p class="stat-value">{{ log.streaks.current }}</p>
          <p class="stat-label">Streak</p>
        </UCard>

        <UCard>
          <p class="stat-value">{{ log.streaks.max }}</p>
          <p class="stat-label">Best streak</p>
        </UCard>

        <UCard>
          <p class="stat-value">{{ log.streaks.total }}</p>
          <p class="stat-label">Total</p>
        </UCard>
      </div>
    </section>

    <!-- Weekday distribution -->
    <section v-if="orderedWeekdayStats.length > 0">
      <p class="section-heading">By day of week</p>

      <UCard>
        <div class="grid grid-cols-7 gap-1">
          <div
            v-for="s in orderedWeekdayStats"
            :key="s.day"
            class="flex flex-col items-center gap-2"
          >
            <div class="h-16 w-full flex flex-col justify-end">
              <div
                class="w-full rounded-t-sm bg-primary transition-all"
                :class="s.count === 0 ? 'opacity-20' : ''"
                :style="{
                  height: s.count === 0 ? '2px' : `${(s.count / maxWeekdayCount) * 100}%`,
                }"
              />
            </div>
            <p class="text-xs text-muted">{{ s.label }}</p>
          </div>
        </div>
      </UCard>
    </section>

    <!-- Recent workouts -->
    <section>
      <p class="section-heading">Recent workouts</p>

      <UCard v-if="log.loading">
        <p class="text-sm text-muted">Loading…</p>
      </UCard>

      <UCard v-else-if="recentExecutions.length === 0">
        <p class="text-sm text-muted">No workouts logged yet.</p>
      </UCard>

      <UCard v-else>
        <ul class="divide-y divide-(--ui-border)">
          <li
            v-for="e in recentExecutions"
            :key="e.execution_id"
            class="flex items-center justify-between py-2 first:pt-0 last:pb-0"
          >
            <span class="text-sm font-medium">{{ flowLabel(e.flow_id) }}</span>
            <span class="text-sm text-muted">{{ formatDate(e.finished_at) }}</span>
          </li>
        </ul>
      </UCard>
    </section>
  </UContainer>
</template>
