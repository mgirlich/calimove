<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

import { useAuth } from './composables/useAuth'

const { user, signOut } = useAuth()
const router = useRouter()
const route = useRoute()

const navLinks = [
  { to: '/', label: 'Home', icon: 'i-lucide-home' },
  { to: '/exercises', label: 'Exercises', icon: 'i-lucide-dumbbell' },
  { to: '/flows', label: 'Flows', icon: 'i-lucide-list' },
]

function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

async function handleSignOut() {
  await signOut()
  await router.push('/login')
}
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <RouterLink to="/" class="font-semibold text-lg">Calimove</RouterLink>
      </template>

      <nav v-if="user" class="flex gap-1">
        <UButton
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          :leading-icon="link.icon"
          variant="ghost"
          :color="isActive(link.to) ? 'primary' : 'neutral'"
        >
          <span class="hidden sm:inline">{{ link.label }}</span>
        </UButton>
      </nav>

      <template #right>
        <UColorModeButton />

        <template v-if="user">
          <span class="text-sm text-muted hidden sm:block">{{ user.email }}</span>
          <UButton color="neutral" variant="ghost" size="sm" @click="handleSignOut">
            Sign out
          </UButton>
        </template>
      </template>
    </UHeader>

    <UMain>
      <RouterView />
    </UMain>
  </UApp>
</template>
