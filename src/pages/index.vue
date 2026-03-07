<script setup lang="ts">
import { computed } from 'vue'

import { useLog } from '../composables/useLog'
import { useNextFlow } from '../composables/useNextFlow'
import workoutsData from '../data/workouts.json'
import type { Workout } from '../types/data'
import { workoutTimeLabel, middleWorkout } from '../utils/workout'

const workouts = workoutsData as Workout[]

const log = useLog()
const nextFlow = useNextFlow()

const nextWorkout = computed(() => {
  if (!nextFlow.value) return null
  const flowWorkouts = workouts.filter((w) => w.flow_id === nextFlow.value!.flow_id)
  return middleWorkout(flowWorkouts) ?? null
})
</script>

<template>
  <UContainer class="page-content space-y-10 max-w-2xl">
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

    <section>
      <p class="section-heading">Stats</p>

      <div class="grid grid-cols-2 gap-4">
        <UCard>
          <p class="stat-value">{{ log.streaks.current }}</p>
          <p class="stat-label">Day streak</p>
        </UCard>

        <UCard>
          <p class="stat-value">{{ log.streaks.total }}</p>
          <p class="stat-label">Total workouts</p>
        </UCard>
      </div>
    </section>

    <section>
      <p class="section-heading">Explore</p>

      <div class="grid grid-cols-3 gap-4">
        <RouterLink to="/exercises">
          <UCard class="nav-card">
            <div class="nav-card-content">
              <UIcon name="i-lucide-dumbbell" class="nav-card-icon" />
              <p class="nav-card-label">Exercises</p>
            </div>
          </UCard>
        </RouterLink>

        <RouterLink to="/flows">
          <UCard class="nav-card">
            <div class="nav-card-content">
              <UIcon name="i-lucide-list" class="nav-card-icon" />
              <p class="nav-card-label">Flows</p>
            </div>
          </UCard>
        </RouterLink>

        <RouterLink to="/log">
          <UCard class="nav-card">
            <div class="nav-card-content">
              <UIcon name="i-lucide-bar-chart-2" class="nav-card-icon" />
              <p class="nav-card-label">Log</p>
            </div>
          </UCard>
        </RouterLink>
      </div>
    </section>
  </UContainer>
</template>
