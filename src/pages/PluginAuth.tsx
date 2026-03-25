/**
 * Plugin Auth Page — opened in a popup by the Figma plugin.
 * Handles Google OAuth via Supabase, then sends token + user info
 * back to the plugin opener via postMessage.
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface PluginUser {
  id: string
  email: string
  isPro: boolean
}

export default function PluginAuth() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    handleAuth()
  }, [])

  async function handleAuth() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error

      if (session) {
        await sendTokenToPlugin(session)
        return
      }

      // No session — kick off Google OAuth, redirect back here
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/plugin',
        },
      })
      if (signInError) throw signInError
    } catch (err) {
      console.error('Plugin auth error:', err)
      setStatus('error')
    }
  }

  async function sendTokenToPlugin(session: { access_token: string; user: { id: string; email?: string } }) {
    try {
      const response = await fetch('/api/plugin-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to generate plugin token')

      const { token } = await response.json() as { token: string }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', session.user.id)
        .single()

      const user: PluginUser = {
        id: session.user.id,
        email: session.user.email || '',
        isPro: profile?.is_pro || false,
      }

      setStatus('success')

      // Send to plugin opener via postMessage
      if (window.opener) {
        window.opener.postMessage({ type: 'paletta-auth', token, user }, '*')
        setTimeout(() => window.close(), 1500)
      }
    } catch (err) {
      console.error('Token generation error:', err)
      setStatus('error')
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      fontFamily: 'system-ui, sans-serif', background: '#FAFAF8',
      padding: '24px', textAlign: 'center',
    }}>
      {status === 'loading' && (
        <>
          <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#1a1a2e' }}>
            Signing in...
          </div>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Connecting your Paletta account to Figma
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'rgba(22,163,74,0.1)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px', fontSize: '24px', color: '#16A34A',
          }}>
            &#10003;
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#1a1a2e' }}>
            Connected!
          </div>
          <p style={{ color: '#666', fontSize: '14px' }}>
            You can close this window and return to Figma.
          </p>
          <p style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
            This window will close automatically...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: '#EF4444' }}>
            Sign in failed
          </div>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
            Something went wrong. Please try again from the plugin.
          </p>
          <button
            onClick={() => window.close()}
            aria-label="Close window"
            style={{
              padding: '10px 24px', borderRadius: '8px',
              background: '#6C47FF', color: 'white', border: 'none',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Close window
          </button>
        </>
      )}
    </div>
  )
}
