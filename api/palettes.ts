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

// ── In-memory rate limiting (resets on cold start) ───────────────
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
function verifyPluginToken(authHeader: string | undefined): { userId: string; isPro: boolean } | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  try {
    const token = authHeader.replace('Bearer ', '')
    const payload = JSON.parse(Buffer.from(token, 'base64').toString()) as {
      userId?: string
      isPro?: boolean
      exp?: number
    }
    if (!payload.userId || !payload.exp || payload.exp < Date.now()) return null
    return { userId: payload.userId, isPro: payload.isPro || false }
  } catch {
    return null
  }
}

const FREE_PALETTE_LIMIT = 3

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
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

  // ── GET: List palettes ─────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('saved_palettes')
      .select('id, name, colors, created_at')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[palettes] GET error:', error)
      return res.status(500).json({ error: 'Failed to load palettes' })
    }

    return res.status(200).json({ palettes: data || [] })
  }

  // ── POST: Save palette ─────────────────────────────────────────
  if (req.method === 'POST') {
    const { name, colors } = req.body ?? {}

    if (!name || !Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({ error: 'Missing name or colors' })
    }

    // Pro gating: check palette count for free users
    if (!auth.isPro) {
      const { count, error: countError } = await supabase
        .from('saved_palettes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', auth.userId)

      if (countError) {
        console.error('[palettes] count error:', countError)
        return res.status(500).json({ error: 'Failed to check palette count' })
      }

      if ((count ?? 0) >= FREE_PALETTE_LIMIT) {
        return res.status(403).json({ error: 'FREE_LIMIT', message: 'Upgrade to Pro for unlimited palettes' })
      }
    }

    // Colors arrive as hex strings from the plugin
    const hexColors: string[] = colors.map((c: string | { hex: string }) =>
      typeof c === 'string' ? c : c.hex
    )

    const { data, error } = await supabase
      .from('saved_palettes')
      .insert({
        user_id: auth.userId,
        name,
        colors: hexColors,
      })
      .select('id, name, colors, created_at')
      .single()

    if (error) {
      console.error('[palettes] POST error:', error)
      return res.status(500).json({ error: 'Failed to save palette' })
    }

    return res.status(201).json({ palette: data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
