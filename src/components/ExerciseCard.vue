<script setup lang="ts">
import type { FlowBase } from '../types/data'

const { exerciseId, name, lectureId, modLectureId, flows } = defineProps<{
  exerciseId: number
  name: string
  lectureId: number
  modLectureId: number | null
  flows: FlowBase[]
}>()

const BASE_URL = 'https://www.calimove.com/courses/1467532/lectures'
</script>

<template>
  <UCard
    class="h-full flex flex-col overflow-hidden"
    :ui="{ body: 'p-0 sm:p-0 flex flex-col flex-1' }"
  >
    <img
      :src="`/exercise_images/exercise_${exerciseId}.png`"
      :alt="name"
      class="w-full aspect-square object-cover"
    />
    <div class="p-3 flex flex-col gap-2 flex-1">
      <p class="font-medium text-sm leading-tight line-clamp-2">{{ name }}</p>
      <div class="flex flex-wrap gap-2 text-xs">
        <UButton
          :to="`${BASE_URL}/${lectureId}`"
          target="_blank"
          variant="soft"
          size="xs"
          icon="i-lucide-play"
        >
          Video
        </UButton>
        <UButton
          v-if="modLectureId"
          :to="`${BASE_URL}/${modLectureId}`"
          target="_blank"
          variant="soft"
          size="xs"
          color="neutral"
          icon="i-lucide-settings-2"
        >
          Mods
        </UButton>
      </div>
      <div v-if="flows.length" class="flex flex-wrap gap-1 mt-auto">
        <UBadge
          v-for="flow in flows"
          :key="flow.flow_id"
          variant="subtle"
          color="neutral"
          size="sm"
        >
          {{ flow.level }}{{ flow.name }}
        </UBadge>
      </div>
    </div>
  </UCard>
</template>
