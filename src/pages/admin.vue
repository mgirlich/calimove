<script setup lang="ts">
import { createClient } from '@supabase/supabase-js'
import { ref } from 'vue'

// The admin client uses the service role key to invite users.
// This is intentional for a personal/owner-only tool — the admin page
// is protected behind authentication and only accessible to trusted users.
const adminClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
)

const email = ref('')
const loading = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

async function inviteUser() {
  error.value = null
  message.value = null
  loading.value = true
  try {
    const { error: err } = await adminClient.auth.admin.inviteUserByEmail(email.value)
    if (err) throw err
    message.value = `Invitation sent to ${email.value}`
    email.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to send invitation'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UContainer class="py-8 max-w-md">
    <h1 class="text-2xl font-semibold mb-6">Admin — Invite user</h1>

    <UCard>
      <form class="space-y-4" @submit.prevent="inviteUser">
        <UFormField label="Email address" name="email">
          <UInput
            v-model="email"
            type="email"
            placeholder="user@example.com"
            required
            class="w-full"
          />
        </UFormField>

        <UAlert v-if="error" color="error" :description="error" />
        <UAlert v-if="message" color="success" :description="message" />

        <UButton type="submit" :loading="loading">Send invitation</UButton>
      </form>
    </UCard>
  </UContainer>
</template>
