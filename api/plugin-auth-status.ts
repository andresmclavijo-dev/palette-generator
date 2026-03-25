import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function setCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const sessionId = (req.query.session as string) || ''
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session ID' })
  }

  // POST: Popup stores the token after OAuth completes
  if (req.method === 'POST') {
    const { token, user } = req.body ?? {}
    if (!token || !user) {
      return res.status(400).json({ error: 'Missing token or user' })
    }

    const { error } = await supabase
      .from('plugin_auth_sessions')
      .upsert({
        session_id: sessionId,
        token,
        user_data: user,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      })

    if (error) {
      console.error('[plugin-auth-status] POST error:', error)
      return res.status(500).json({ error: 'Failed to store token' })
    }

    return res.status(200).json({ ok: true })
  }

  // GET: Plugin polls for the token
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('plugin_auth_sessions')
      .select('token, user_data')
      .eq('session_id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return res.status(200).json({ status: 'pending' })
    }

    // One-time use — delete after reading
    await supabase
      .from('plugin_auth_sessions')
      .delete()
      .eq('session_id', sessionId)

    return res.status(200).json({
      status: 'complete',
      token: data.token,
      user: data.user_data,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
