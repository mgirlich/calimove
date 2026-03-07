<script setup lang="ts">
import { computed, ref } from 'vue'

import ExerciseCard from '../components/ExerciseCard.vue'
import exercisesData from '../data/exercises.json'
import type { Exercise } from '../types/data'

const exercises = exercisesData as Exercise[]

const search = ref<string>('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return exercises
  return exercises.filter((e) => e.name.toLowerCase().includes(q))
})
</script>

<template>
  <UContainer class="page-content space-y-6">
    <div class="flex items-center gap-4">
      <UInput
        v-model="search"
        placeholder="Search exercises…"
        icon="i-lucide-search"
        class="flex-1"
      />
      <p class="text-sm text-muted whitespace-nowrap">
        {{ filtered.length }} / {{ exercises.length }}
      </p>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <ExerciseCard
        v-for="exercise in filtered"
        :key="exercise.exercise_id"
        :exercise-id="exercise.exercise_id"
        :name="exercise.name"
        :lecture-id="exercise.lecture_id"
        :mod-lecture-id="exercise.mod_lecture_id"
        :flows="exercise.flows"
      />
    </div>

    <p v-if="filtered.length === 0" class="text-center text-muted py-12">
      No exercises match "{{ search }}"
    </p>
  </UContainer>
</template>
