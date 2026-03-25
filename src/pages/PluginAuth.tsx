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
import { supabase } from '@/lib/supabase'

const SESSION_STORAGE_KEY = 'paletta_plugin_session_id'

export default function PluginAuth() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    handleAuth()
  }, [])

  async function handleAuth() {
    try {
      // Step 1: Get session ID from URL or sessionStorage
      const urlParams = new URLSearchParams(window.location.search)
      let sessionId = urlParams.get('session')

      if (!sessionId) {
        sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
      }

      console.log('[PluginAuth] sessionId:', sessionId)
      console.log('[PluginAuth] URL:', window.location.href)

      if (!sessionId) {
        setErrorMsg('No session ID. Please close this window and try again from the plugin.')
        setStatus('error')
        return
      }

      // Store session ID so it survives the OAuth redirect
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId)

      // Step 2: Check for existing Supabase session (post-OAuth redirect)
      const { data, error: sessionError } = await supabase.auth.getSession()

      console.log('[PluginAuth] getSession result:', {
        hasSession: !!data?.session,
        error: sessionError?.message,
        userEmail: data?.session?.user?.email,
      })

      if (sessionError) {
        console.error('[PluginAuth] getSession error:', sessionError)
        // Don't throw — try to sign in fresh
      }

      if (data?.session) {
        console.log('[PluginAuth] Session found, generating token...')
        await sendTokenToPlugin(data.session, sessionId)
        return
      }

      // Step 3: No session — start Google OAuth
      console.log('[PluginAuth] No session, starting OAuth...')

      const redirectUrl = window.location.origin + '/auth/plugin?session=' + encodeURIComponent(sessionId)
      console.log('[PluginAuth] redirectTo:', redirectUrl)

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: { prompt: 'select_account' },
        },
      })

      if (signInError) {
        console.error('[PluginAuth] signInWithOAuth error:', signInError)
        throw signInError
      }

      // Browser redirects to Google — this code won't execute
    } catch (err: unknown) {
      console.error('[PluginAuth] handleAuth error:', err)
      const message = err instanceof Error ? err.message : 'Unknown error during sign in'
      setErrorMsg(message)
      setDebugInfo(JSON.stringify(err, null, 2))
      setStatus('error')
    }
  }

  async function sendTokenToPlugin(
    session: { access_token: string; user: { id: string; email?: string } },
    sessionId: string,
  ) {
    try {
      console.log('[PluginAuth] sendTokenToPlugin called')
      console.log('[PluginAuth] User:', session.user?.email)
      console.log('[PluginAuth] SessionId:', sessionId)

      // Step 1: Generate plugin token
      const tokenResponse = await fetch('/api/plugin-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token,
        },
      })

      console.log('[PluginAuth] plugin-token response status:', tokenResponse.status)

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text()
        console.error('[PluginAuth] plugin-token error body:', errText)
        throw new Error('Token generation failed (' + tokenResponse.status + '): ' + errText)
      }

      const tokenData = await tokenResponse.json() as { token: string }
      const token = tokenData.token

      if (!token) {
        throw new Error('No token in response')
      }

      console.log('[PluginAuth] Got token, length:', token.length)

      // Step 2: Get Pro status
      let isPro = false
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_pro')
          .eq('id', session.user.id)
          .single()
        isPro = profile?.is_pro || false
        console.log('[PluginAuth] isPro:', isPro)
      } catch (profileErr) {
        console.warn('[PluginAuth] Profile lookup failed, defaulting to free:', profileErr)
      }

      const user = {
        id: session.user.id,
        email: session.user.email || '',
        isPro,
      }

      // Step 3: POST to polling endpoint
      const statusUrl = '/api/plugin-auth-status?session=' + encodeURIComponent(sessionId)
      console.log('[PluginAuth] Posting to:', statusUrl)

      const statusResponse = await fetch(statusUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, user }),
      })

      console.log('[PluginAuth] plugin-auth-status response status:', statusResponse.status)

      if (!statusResponse.ok) {
        const errText = await statusResponse.text()
        console.error('[PluginAuth] plugin-auth-status error:', errText)
        throw new Error('Failed to store token (' + statusResponse.status + '): ' + errText)
      }

      // Success!
      console.log('[PluginAuth] Auth complete! Token stored for plugin to poll.')
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      setStatus('success')

      setTimeout(() => {
        try { window.close() } catch { /* may not work in all browsers */ }
      }, 3000)
    } catch (err: unknown) {
      console.error('[PluginAuth] sendTokenToPlugin error:', err)
      const message = err instanceof Error ? err.message : 'Failed to connect your account'
      setErrorMsg(message)
      setDebugInfo(JSON.stringify(err, null, 2))
      setStatus('error')
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif',
      background: '#FAFAF8', padding: '24px', textAlign: 'center',
    }}>
      {status === 'loading' && (
        <>
          <div
            role="status"
            aria-label="Signing in"
            style={{
              width: '40px', height: '40px', border: '3px solid #E5E7EB',
              borderTopColor: '#6C47FF', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', marginBottom: '16px',
            }}
          />
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#1a1a2e' }}>
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
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#1a1a2e' }}>
            Connected!
          </div>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Return to Figma — the plugin will update automatically.
          </p>
          <p style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
            This window will close automatically...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#EF4444' }}>
            Sign in failed
          </div>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px', maxWidth: '360px' }}>
            {errorMsg || 'Something went wrong. Please try again from the plugin.'}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                sessionStorage.removeItem(SESSION_STORAGE_KEY)
                window.location.reload()
              }}
              type="button"
              aria-label="Try again"
              style={{
                padding: '10px 24px', borderRadius: '8px',
                background: '#6C47FF', color: 'white', border: 'none',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <button
              onClick={() => { try { window.close() } catch { /* noop */ } }}
              type="button"
              aria-label="Close window"
              style={{
                padding: '10px 24px', borderRadius: '8px',
                background: 'transparent', color: '#666', border: '1px solid #E5E7EB',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
          {debugInfo && (
            <pre style={{
              marginTop: '24px', padding: '12px', background: '#F3F4F6',
              borderRadius: '8px', fontSize: '10px', color: '#666',
              textAlign: 'left', maxWidth: '400px', overflow: 'auto',
              maxHeight: '100px',
            }}>
              {debugInfo}
            </pre>
          )}
        </>
      )}
    </div>
  )
}
