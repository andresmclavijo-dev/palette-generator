/**
 * Plugin Auth Page — opened in a popup by the Figma plugin.
 * Handles Google OAuth via Supabase, then POSTs the token to
 * /api/plugin-auth-status so the plugin can poll for it.
 * (postMessage can't reach Figma plugin iframes.)
 *
 * Session ID is stored in sessionStorage to survive the OAuth redirect,
 * since query params can be lost through the Google → Supabase round-trip.
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SESSION_STORAGE_KEY = 'paletta_plugin_session_id'

interface PluginUser {
  id: string
  email: string
  isPro: boolean
}

export default function PluginAuth() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    handleAuth()
  }, [])

  async function handleAuth() {
    try {
      const params = new URLSearchParams(window.location.search)
      let sessionId = params.get('session')

      // If no session ID in URL, try recovering from sessionStorage
      // (OAuth redirect strips query params)
      if (!sessionId) {
        sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
      }

      if (!sessionId) {
        setErrorMessage('No session ID found. Please try again from the plugin.')
        setStatus('error')
        return
      }

      // Check if we already have a Supabase session (post-OAuth redirect)
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error

      if (session) {
        await sendTokenToPlugin(session, sessionId)
        return
      }

      // No session — store session ID and kick off Google OAuth
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId)

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/plugin`,
          queryParams: { prompt: 'select_account' },
        },
      })
      if (signInError) throw signInError
    } catch (err) {
      console.error('Plugin auth error:', err)
      setErrorMessage('Something went wrong. Please try again from the plugin.')
      setStatus('error')
    }
  }

  async function sendTokenToPlugin(
    session: { access_token: string; user: { id: string; email?: string } },
    sessionId: string,
  ) {
    try {
      // Generate plugin token
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

      // POST to polling endpoint — plugin will pick this up
      const statusRes = await fetch(`/api/plugin-auth-status?session=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, user }),
      })
      if (!statusRes.ok) throw new Error('Failed to store token for plugin')

      // Clean up sessionStorage
      sessionStorage.removeItem(SESSION_STORAGE_KEY)

      setStatus('success')

      setTimeout(() => {
        try { window.close() } catch { /* may not work in all browsers */ }
      }, 2000)
    } catch (err) {
      console.error('Token generation error:', err)
      setErrorMessage('Failed to connect your account. Please try again from the plugin.')
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
          <div
            role="status"
            aria-label="Signing in"
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: '3px solid #E5E5E5', borderTopColor: '#6C47FF',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '16px',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
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
            {errorMessage || 'Something went wrong. Please try again from the plugin.'}
          </p>
          <button
            onClick={() => window.close()}
            aria-label="Close window"
            type="button"
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
