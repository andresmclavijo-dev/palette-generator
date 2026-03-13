import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useProStore } from '../store/proStore'

// Check once at module load so it survives re-renders
const hadPaymentSuccess = window.location.search.includes('payment=success')

// Developer override — ?dev_pro=1 or localStorage paletta_dev_pro=1
const devProOverride = (() => {
  const params = new URLSearchParams(window.location.search)
  const devOverride =
    params.get('dev_pro') === '1' ||
    localStorage.getItem('paletta_dev_pro') === '1'
  const isDevEnvironment =
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('vercel.app') ||
    window.location.hostname.includes('usepaletta.io')
  return devOverride && isDevEnvironment
})()

export function usePro() {
  const { user, loading: authLoading } = useAuth()
  const { isPro, loading, showPaymentModal, setIsPro, setLoading, setShowPaymentModal, setFetched } = useProStore()
  const paymentHandled = useRef(false)
  const devHandled = useRef(false)

  const userId = user?.id ?? null

  // Profile fetch — only when user ID changes, not on every render
  useEffect(() => {
    if (devProOverride) {
      if (devHandled.current) return
      devHandled.current = true
      setIsPro(true)
      setLoading(false)
      setFetched(true)
      console.log('[dev] Pro mode enabled via URL param')
      return
    }

    if (authLoading) return

    if (!userId) {
      setIsPro(false)
      setLoading(false)
      setFetched(false)
      return
    }

    let cancelled = false
    setLoading(true)
    supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        console.log('[usePro] profile fetch:', { userId, is_pro: data?.is_pro })
        setIsPro(data?.is_pro === true)
        setLoading(false)
        setFetched(true)
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authLoading])

  // Handle post-payment redirect
  useEffect(() => {
    if (!hadPaymentSuccess || paymentHandled.current) return
    if (authLoading) return
    paymentHandled.current = true

    // Strip the query param
    window.history.replaceState(null, '', window.location.pathname)

    if (user) {
      // Signed in: force Pro immediately, then verify
      console.log('[usePro] payment=success detected, forcing Pro for user', user.id)
      setIsPro(true)
      setLoading(false)
      setFetched(true)

      const refresh = async () => {
        await supabase.auth.refreshSession()
        const { data: { session } } = await supabase.auth.getSession()
        const uid = session?.user?.id ?? user?.id
        if (!uid) return

        const { data } = await supabase
          .from('profiles')
          .select('is_pro')
          .eq('id', uid)
          .single()

        console.log('[usePro] post-payment profile re-fetch:', { uid, is_pro: data?.is_pro })
        if (data?.is_pro) setIsPro(true)
      }
      refresh()
    } else {
      // Not signed in: show the payment success modal
      console.log('[usePro] payment=success but no user — showing sign-in modal')
      setShowPaymentModal(true)
    }
  }, [user, authLoading, setIsPro, setLoading, setFetched, setShowPaymentModal])

  // Auto-dismiss payment modal once user signs in
  useEffect(() => {
    if (user && showPaymentModal) setShowPaymentModal(false)
  }, [user, showPaymentModal, setShowPaymentModal])

  return { isPro, loading, showPaymentModal, setShowPaymentModal }
}
