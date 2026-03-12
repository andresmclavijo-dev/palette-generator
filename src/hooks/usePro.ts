import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// Check once at module load so it survives re-renders
const hadPaymentSuccess = window.location.search.includes('payment=success')

export function usePro() {
  const { user, loading: authLoading } = useAuth()
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
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
    if (authLoading) return
    paymentHandled.current = true

    // Strip the query param
    window.history.replaceState(null, '', window.location.pathname)

    if (user) {
      // Signed in: force Pro immediately, then verify
      console.log('[usePro] payment=success detected, forcing Pro for user', user.id)
      setIsPro(true)
      setLoading(false)

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
  }, [user, authLoading])

  // Auto-dismiss payment modal once user signs in (usePro will re-fetch and pick up is_pro)
  useEffect(() => {
    if (user && showPaymentModal) setShowPaymentModal(false)
  }, [user, showPaymentModal])

  return { isPro, loading, showPaymentModal, setShowPaymentModal }
}
