<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '../composables/useAuth'

const { user, updatePassword } = useAuth()
const router = useRouter()

const password = ref('')
const confirm = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

const mismatch = computed(() => confirm.value.length > 0 && password.value !== confirm.value)

async function handleSubmit() {
  if (mismatch.value) return
  error.value = null
  loading.value = true
  try {
    await updatePassword(password.value)
    await router.push('/')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to update password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh] p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-xl font-semibold">Set your password</h1>
      </template>

      <div v-if="!user" class="space-y-4">
        <UAlert
          color="warning"
          title="Session expired"
          description="Your reset link has expired. Please request a new one."
        />
        <UButton block variant="outline" to="/login">Back to sign in</UButton>
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <UFormField label="New password" name="password">
          <UInput
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Confirm password"
          name="confirm"
          :error="mismatch ? 'Passwords do not match' : undefined"
        >
          <UInput
            v-model="confirm"
            type="password"
            autocomplete="new-password"
            required
            class="w-full"
          />
        </UFormField>

        <UAlert v-if="error" color="error" :description="error" />

        <UButton type="submit" block :loading="loading" :disabled="mismatch">
          Set password
        </UButton>
      </form>
    </UCard>
  </div>
</template>
