<script setup lang="ts">
import flowsData from '../../data/flows.json'
import type { Flow } from '../../types/data'

const flows = flowsData as Flow[]
</script>

<template>
  <UContainer class="page-content space-y-10 max-w-2xl">
    <section v-for="flow in flows" :key="flow.flow_id" class="space-y-3">
      <RouterLink :to="`/flows/${flow.flow_id}`" class="block">
        <p class="section-heading hover:text-primary transition-colors">
          Level {{ flow.level }} · Flow {{ flow.name }}
        </p>
      </RouterLink>

      <ol class="space-y-1">
        <li
          v-for="(exercise, i) in flow.exercises"
          :key="exercise.exercise_id"
          class="flex items-center gap-3 text-sm py-1 border-b border-default last:border-0"
        >
          <span class="text-muted tabular-nums w-5 shrink-0 text-right">{{ i + 1 }}</span>
          <span>{{ exercise.name }}</span>
        </li>
      </ol>
    </section>
  </UContainer>
</template>
