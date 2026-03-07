import type { User } from '@supabase/supabase-js'
import { ref } from 'vue'

import { supabase } from '../lib/supabase'

// Module-level ref so all components share the same auth state.
const user = ref<User | null>(null)

// Initialise synchronously from the existing session (avoids flash on reload).
void supabase.auth.getSession().then(({ data }) => {
  user.value = data.session?.user ?? null
  return undefined
})

const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
  user.value = session?.user ?? null
})

// The listener is intentionally long-lived (module scope).
// Call cleanup() only if you need to tear it down manually.
export function cleanupAuthListener() {
  listener.subscription.unsubscribe()
}

export function useAuth() {
  return {
    user,

    async signIn(email: string, password: string) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    },

    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
  }
}
