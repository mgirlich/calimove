<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import ExerciseCard from '../../components/ExerciseCard.vue'
import flowsData from '../../data/flows.json'
import workoutsData from '../../data/workouts.json'
import type { Flow, Workout } from '../../types/data'
import { middleWorkout, totalTime, workoutTimeLabel } from '../../utils/workout'

const route = useRoute()

const flows = flowsData as Flow[]
const workouts = workoutsData as Workout[]

const flowId = computed(() => Number(route.params.flow_id))
const flow = computed(() => flows.find((f) => f.flow_id === flowId.value))
const flowWorkouts = computed(() =>
  workouts
    .filter((w) => w.flow_id === flowId.value)
    .toSorted((a, b) => totalTime(a) - totalTime(b)),
)

const selectedWorkoutId = ref(middleWorkout(flowWorkouts.value)?.workout_id)
watch(flowWorkouts, (ws) => {
  selectedWorkoutId.value = middleWorkout(ws)?.workout_id
})
</script>

<template>
  <UContainer class="page-content space-y-8 max-w-2xl">
    <div v-if="flow">
      <div class="flex items-center gap-2 mb-6">
        <UButton to="/flows" variant="ghost" icon="i-lucide-arrow-left" size="sm" color="neutral">
          Flows
        </UButton>
      </div>

      <h1 class="text-xl font-semibold mb-6">Level {{ flow.level }} · Flow {{ flow.name }}</h1>

      <!-- Workout variant selector -->
      <section class="space-y-3">
        <p class="section-heading">Choose workout</p>
        <div class="flex flex-wrap gap-2 justify-center">
          <button
            v-for="workout in flowWorkouts"
            :key="workout.workout_id"
            class="flex flex-col items-start gap-0.5 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors"
            :class="
              selectedWorkoutId === workout.workout_id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-default bg-background hover:border-primary/50 hover:bg-primary/5'
            "
            @click="selectedWorkoutId = workout.workout_id"
          >
            <span class="font-semibold text-sm">{{ workoutTimeLabel(workout).total }}</span>
            <span
              class="text-xs"
              :class="selectedWorkoutId === workout.workout_id ? 'text-primary/70' : 'text-muted'"
            >
              {{ workoutTimeLabel(workout).active }} active ·
              {{ workoutTimeLabel(workout).rest }} rest
            </span>
            <span class="text-xs">{{ workout.n_sets }}×{{ workout.n_reps }}</span>
          </button>
        </div>

        <div class="flex justify-center my-2">
          <UButton
            v-if="selectedWorkoutId"
            :to="`/practice/${selectedWorkoutId}`"
            size="lg"
            trailing-icon="i-lucide-play"
          >
            Start Workout
          </UButton>
        </div>
      </section>

      <!-- Exercise list -->
      <section>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div
            v-for="(exercise, i) in flow.exercises"
            :key="exercise.exercise_id"
            class="relative h-full"
          >
            <span
              class="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs font-bold rounded px-1.5 py-0.5"
            >
              {{ i + 1 }}
            </span>
            <ExerciseCard
              :exercise-id="exercise.exercise_id"
              :name="exercise.name"
              :lecture-id="exercise.lecture_id"
              :mod-lecture-id="exercise.mod_lecture_id"
              :flows="[]"
            />
          </div>
        </div>
      </section>
    </div>

    <div v-else class="text-center py-20 text-muted">Flow not found.</div>
  </UContainer>
</template>
