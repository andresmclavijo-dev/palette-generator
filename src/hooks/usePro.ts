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

  return { isPro, loading }
}
