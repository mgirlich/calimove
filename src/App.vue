<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useAuth } from './composables/useAuth'

const { user, signOut } = useAuth()
const router = useRouter()

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
