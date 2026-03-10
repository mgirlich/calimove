import { assertEquals } from 'jsr:@std/assert'
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

import { handleInvite } from './index.ts'

function makeRequest(
  options: { authHeader?: string; body?: unknown; method?: string } = {},
): Request {
  return new Request('http://localhost/invite-user', {
    method: options.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.authHeader ? { Authorization: options.authHeader } : {}),
    },
    body: JSON.stringify(options.body ?? { email: 'new@example.com' }),
  })
}

function makeAdmin(
  overrides: Partial<{
    getUser: (jwt: string) => unknown
    inviteUserByEmail: (email: string) => unknown
  }> = {},
): SupabaseClient {
  return {
    auth: {
      getUser:
        overrides.getUser ??
        ((_jwt: string) =>
          Promise.resolve({ data: { user: { app_metadata: { is_admin: true } } }, error: null })),
      admin: {
        inviteUserByEmail:
          overrides.inviteUserByEmail ?? ((_email: string) => Promise.resolve({ error: null })),
      },
    },
  } as unknown as SupabaseClient
}

Deno.test('returns 401 when Authorization header is missing', async () => {
  const res = await handleInvite(makeRequest({ authHeader: undefined }), makeAdmin())
  assertEquals(res.status, 401)
  assertEquals(await res.json(), { error: 'Missing authorization header' })
})

Deno.test('returns 401 when JWT is invalid', async () => {
  const admin = makeAdmin({
    getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Invalid JWT') }),
  })
  const res = await handleInvite(makeRequest({ authHeader: 'Bearer bad-token' }), admin)
  assertEquals(res.status, 401)
  assertEquals(await res.json(), { error: 'Unauthorized' })
})

Deno.test('returns 403 when user is not admin', async () => {
  const admin = makeAdmin({
    getUser: () =>
      Promise.resolve({ data: { user: { app_metadata: { is_admin: false } } }, error: null }),
  })
  const res = await handleInvite(makeRequest({ authHeader: 'Bearer valid-token' }), admin)
  assertEquals(res.status, 403)
  assertEquals(await res.json(), { error: 'Forbidden' })
})

Deno.test('returns 400 when email is missing from body', async () => {
  const res = await handleInvite(
    makeRequest({ authHeader: 'Bearer valid-token', body: {} }),
    makeAdmin(),
  )
  assertEquals(res.status, 400)
  assertEquals(await res.json(), { error: 'Missing email' })
})

Deno.test('returns 400 when Supabase invite fails', async () => {
  const admin = makeAdmin({
    inviteUserByEmail: () =>
      Promise.resolve({
        error: { message: 'A user with this email address has already been registered' },
      }),
  })
  const res = await handleInvite(makeRequest({ authHeader: 'Bearer valid-token' }), admin)
  assertEquals(res.status, 400)
  assertEquals(await res.json(), {
    error: 'A user with this email address has already been registered',
  })
})

Deno.test('returns 200 on success', async () => {
  const res = await handleInvite(makeRequest({ authHeader: 'Bearer valid-token' }), makeAdmin())
  assertEquals(res.status, 200)
  assertEquals(await res.json(), { success: true })
})
