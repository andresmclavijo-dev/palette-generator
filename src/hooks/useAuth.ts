import { useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { showToast } from '../utils/toast'
import { analytics } from '../lib/posthog'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        setSession(s)
        setUser(s?.user ?? null)
        setLoading(false)

        // PostHog identity
        if (event === 'SIGNED_IN' && s?.user) {
          analytics.identify(s.user.id, { email: s.user.email })
        }
        if (event === 'SIGNED_OUT') {
          analytics.reset()
        }

        // Session expired while user was active — attempt silent refresh
        if (event === 'TOKEN_REFRESHED' && !s) {
          supabase.auth.refreshSession().then(({ error }) => {
            if (error) {
              setUser(null)
              setSession(null)
              showToast('Session expired — please sign in again')
            }
          })
        }
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (result.error) {
      const msg = result.error.message?.toLowerCase() ?? ''
      if (msg.includes('cancelled') || msg.includes('canceled') || msg.includes('popup')) {
        showToast('Sign-in was cancelled')
      } else {
        showToast('Sign-in failed — please try again')
      }
    }
    return result
  }

  const signOut = () => supabase.auth.signOut()

  return {
    user,
    session,
    isSignedIn: !!user,
    loading,
    signInWithGoogle,
    signOut,
  }
}
