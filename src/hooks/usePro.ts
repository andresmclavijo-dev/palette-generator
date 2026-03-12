import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// Check once at module load so it survives re-renders
const hadPaymentSuccess = window.location.search.includes('payment=success')

export function usePro() {
  const { user, loading: authLoading } = useAuth()
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const paymentHandled = useRef(false)

  // Normal profile fetch
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setIsPro(false)
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        console.log('[usePro] profile fetch:', { userId: user.id, is_pro: data?.is_pro })
        setIsPro(data?.is_pro === true)
        setLoading(false)
      })
  }, [user, authLoading])

  // Handle post-payment redirect
  useEffect(() => {
    if (!hadPaymentSuccess || paymentHandled.current) return
    if (authLoading) return // Wait for auth to settle first
    paymentHandled.current = true

    // Strip the query param
    window.history.replaceState(null, '', window.location.pathname)

    // If user is signed in, force Pro immediately as fallback,
    // then verify with a fresh DB read
    if (user) {
      console.log('[usePro] payment=success detected, forcing Pro for user', user.id)
      setIsPro(true)
      setLoading(false)
    }

    const refresh = async () => {
      // Force session refresh (not cached getSession)
      await supabase.auth.refreshSession()

      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id ?? user?.id
      if (!uid) {
        console.log('[usePro] no user after refresh, keeping forced Pro state')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', uid)
        .single()

      console.log('[usePro] post-payment profile re-fetch:', { uid, is_pro: data?.is_pro })
      if (data?.is_pro) {
        setIsPro(true)
      }
      // Don't set false here — webhook may not have fired yet
    }

    refresh()
  }, [user, authLoading])

  return { isPro, loading }
}
