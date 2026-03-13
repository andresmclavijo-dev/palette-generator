import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useProStore } from '../store/proStore'

// Check once at module load so it survives re-renders
const hadPaymentSuccess = window.location.search.includes('payment=success')

export function usePro() {
  const { user, loading: authLoading } = useAuth()
  const { isPro, loading, showPaymentModal, fetched, setIsPro, setLoading, setShowPaymentModal, setFetched } = useProStore()
  const paymentHandled = useRef(false)
  const lastUserId = useRef<string | null>(null)

  // Profile fetch — only when user changes, not on every render
  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setIsPro(false)
      setLoading(false)
      setFetched(false)
      lastUserId.current = null
      return
    }

    // Skip if we already fetched for this user
    if (fetched && lastUserId.current === user.id) {
      return
    }

    lastUserId.current = user.id
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
        setFetched(true)
      })
  }, [user, authLoading, fetched, setIsPro, setLoading, setFetched])

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
