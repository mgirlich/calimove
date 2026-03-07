<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '../composables/useAuth'

const { signIn, resetPassword } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const mode = ref<'signin' | 'reset'>('signin')
const resetSent = ref(false)

async function handleSignIn() {
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

async function handleReset() {
  error.value = null
  loading.value = true
  try {
    await resetPassword(email.value)
    resetSent.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to send reset email'
  } finally {
    loading.value = false
  }
}

function switchMode(m: 'signin' | 'reset') {
  mode.value = m
  error.value = null
  resetSent.value = false
  password.value = ''
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh] p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-xl font-semibold">
          {{ mode === 'signin' ? 'Sign in to Calimove' : 'Reset your password' }}
        </h1>
      </template>

      <!-- Sign in form -->
      <form v-if="mode === 'signin'" class="space-y-4" @submit.prevent="handleSignIn">
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

        <p class="text-center text-sm text-gray-500">
          <button type="button" class="underline hover:text-gray-700" @click="switchMode('reset')">
            Forgot your password?
          </button>
        </p>
      </form>

      <!-- Reset form -->
      <form v-else class="space-y-4" @submit.prevent="handleReset">
        <UAlert
          v-if="resetSent"
          color="success"
          title="Check your email"
          description="We sent you a password reset link."
        />

        <template v-else>
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

          <UAlert v-if="error" color="error" :description="error" />

          <UButton type="submit" block :loading="loading">Send reset link</UButton>
        </template>

        <p class="text-center text-sm text-gray-500">
          <button type="button" class="underline hover:text-gray-700" @click="switchMode('signin')">
            Back to sign in
          </button>
        </p>
      </form>
    </UCard>
  </div>
</template>
