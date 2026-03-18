import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useProStore } from '../store/proStore'
import { showToast } from '../utils/toast'
import { analytics } from '../lib/posthog'

// Check once at module load so it survives re-renders
const searchParams = new URLSearchParams(window.location.search)
const hadPaymentSuccess = searchParams.has('payment') && searchParams.get('payment') === 'success'
const hadCheckoutSuccess = searchParams.has('checkout') && searchParams.get('checkout') === 'success'
const hadCheckoutCancelled = searchParams.has('checkout') && searchParams.get('checkout') === 'cancelled'
const hadAnySuccess = hadPaymentSuccess || hadCheckoutSuccess

// Developer override — ?dev_pro=1 or localStorage paletta_dev_pro=1
// Only works when Vite's DEV flag is true (npm run dev). Completely ignored in production builds.
const devProOverride = (() => {
  if (!import.meta.env.DEV) return false
  const params = new URLSearchParams(window.location.search)
  return params.get('dev_pro') === '1' ||
    localStorage.getItem('paletta_dev_pro') === '1'
})()

// Set dev override in the Zustand store immediately at module load
if (devProOverride) {
  useProStore.getState().setIsPro(true)
  useProStore.getState().setLoading(false)
  useProStore.getState().setFetched(true)
  console.warn('\u26a0\ufe0f Dev Pro mode active \u2014 never works in production.')
}

export function usePro() {
  const { user, loading: authLoading } = useAuth()
  const { isPro, loading, showPaymentModal, fetched, setIsPro, setLoading, setShowPaymentModal, setFetched } = useProStore()
  const paymentHandled = useRef(false)
  const cancelHandled = useRef(false)
  const lastFetchedUserId = useRef<string | null>(null)

  const userId = user?.id ?? null

  // Profile fetch — only when user ID changes, not on every render
  useEffect(() => {
    // Dev override already handled at module load — skip all fetching
    if (devProOverride) return

    if (authLoading) return

    if (!userId) {
      setIsPro(false)
      setLoading(false)
      setFetched(false)
      lastFetchedUserId.current = null
      return
    }

    // Skip if already fetched for this user
    if (fetched && lastFetchedUserId.current === userId) return
    lastFetchedUserId.current = userId

    let cancelled = false
    setLoading(true)
    supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        if (import.meta.env.DEV) console.log('[usePro] profile fetch:', { userId, is_pro: data?.is_pro })
        setIsPro(data?.is_pro === true)
        setLoading(false)
        setFetched(true)
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authLoading])

  // Handle checkout cancelled
  useEffect(() => {
    if (!hadCheckoutCancelled || cancelHandled.current) return
    cancelHandled.current = true
    window.history.replaceState(null, '', window.location.pathname)
    showToast('Checkout cancelled')
    analytics.track('checkout_cancelled')
  }, [])

  // Handle post-payment redirect (both legacy payment=success and new checkout=success)
  useEffect(() => {
    if (!hadAnySuccess || paymentHandled.current) return
    if (authLoading) return
    paymentHandled.current = true

    // Strip the query param
    window.history.replaceState(null, '', window.location.pathname)

    if (user) {
      // Signed in: force Pro immediately, then verify
      if (import.meta.env.DEV) console.log('[usePro] checkout success detected, forcing Pro for user', user.id)
      setIsPro(true)
      setLoading(false)
      setFetched(true)
      showToast('Welcome to Pro!')
      analytics.track('checkout_completed')

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

        if (import.meta.env.DEV) console.log('[usePro] post-payment profile re-fetch:', { uid, is_pro: data?.is_pro })
        if (data?.is_pro) setIsPro(true)
      }
      refresh()
    } else {
      // Not signed in: show the payment success modal
      if (import.meta.env.DEV) console.log('[usePro] checkout success but no user — showing sign-in modal')
      setShowPaymentModal(true)
    }
  }, [user, authLoading, setIsPro, setLoading, setFetched, setShowPaymentModal])

  // Auto-dismiss payment modal once user signs in
  useEffect(() => {
    if (user && showPaymentModal) setShowPaymentModal(false)
  }, [user, showPaymentModal, setShowPaymentModal])

  return { isPro, loading, showPaymentModal, setShowPaymentModal }
}
