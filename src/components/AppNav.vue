<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { orientation = 'horizontal' } = defineProps<{
  orientation?: 'horizontal' | 'vertical'
}>()

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Home',
    icon: 'i-lucide-home',
    to: '/',
    active: route.path === '/',
  },
  {
    label: 'Exercises',
    icon: 'i-lucide-dumbbell',
    to: '/exercises',
    active: route.path.startsWith('/exercises'),
  },
  {
    label: 'Flows',
    icon: 'i-lucide-list',
    to: '/flows',
    active: route.path.startsWith('/flows'),
  },
])
</script>

<template>
  <UNavigationMenu :items="items" :orientation="orientation" />
</template>
