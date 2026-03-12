import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function usePro() {
  const { user } = useAuth()
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
        setIsPro(data?.is_pro === true)
        setLoading(false)
      })
  }, [user])

  // Handle post-payment redirect: refresh session and re-check Pro status
  useEffect(() => {
    if (!window.location.search.includes('payment=success')) return

    // Strip the query param immediately
    window.history.replaceState(null, '', window.location.pathname)

    const refresh = async () => {
      // Refresh auth session in case user just signed up via Stripe
      await supabase.auth.getSession()

      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id ?? user?.id
      if (!uid) return

      const { data } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', uid)
        .single()

      if (data?.is_pro) setIsPro(true)
    }

    refresh()
  }, [user])

  return { isPro, loading }
}
