import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function setCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization' })
    }

    const accessToken = authHeader.replace('Bearer ', '')

    // Verify the Supabase session using service role client
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    // Get Pro status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .single()

    // Create a base64-encoded token with 7-day expiry
    // Good enough for MVP — upgrade to HMAC-signed JWT in Sprint 3
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      isPro: profile?.is_pro || false,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000),
      iat: Date.now(),
    }

    const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64')

    return res.status(200).json({ token })
  } catch (err) {
    console.error('[API_ERROR]', {
      route: '/api/plugin-token',
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
