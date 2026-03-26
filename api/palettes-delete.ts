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

// ── In-memory rate limiting ──────────────────────────────────────
const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT
}

// ── Decode Base64 plugin token ───────────────────────────────────
function verifyPluginToken(authHeader: string | undefined): { userId: string } | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const token = authHeader.replace('Bearer ', '')
    const payload = JSON.parse(Buffer.from(token, 'base64').toString()) as {
      userId?: string
      exp?: number
    }
    if (!payload.userId || !payload.exp || payload.exp < Date.now()) return null
    return { userId: payload.userId }
  } catch {
    return null
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limit
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests' })
  }

  // Auth
  const auth = verifyPluginToken(req.headers.authorization)
  if (!auth) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  const { id } = req.body ?? {}
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing palette id' })
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: 'Invalid palette id' })
  }

  // Verify ownership before delete
  const { data: existing } = await supabase
    .from('saved_palettes')
    .select('id')
    .eq('id', id)
    .eq('user_id', auth.userId)
    .single()

  if (!existing) {
    return res.status(404).json({ error: 'Palette not found' })
  }

  const { error } = await supabase
    .from('saved_palettes')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.userId)

  if (error) {
    console.error('[palettes-delete] error:', error)
    return res.status(500).json({ error: 'Failed to delete palette' })
  }

  return res.status(200).json({ ok: true, id })
}
