<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '../composables/useAuth'

const { signIn } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit() {
  error.value = null
  loading.value = true
  try {
    await signIn(email.value, password.value)
    await router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Sign in failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh] p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-xl font-semibold">Sign in to Calimove</h1>
      </template>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <UFormField label="Email" name="email">
          <UInput
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full"
          />
        </UFormField>

        <UAlert v-if="error" color="error" :description="error" />

        <UButton type="submit" block :loading="loading">Sign in</UButton>
      </form>
    </UCard>
  </div>
</template>
