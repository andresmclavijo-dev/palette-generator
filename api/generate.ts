import type { VercelRequest, VercelResponse } from '@vercel/node'

// ─── Per-minute rate limiter (abuse prevention) ───
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 15
const RATE_WINDOW = 60 * 1000

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  // Clean up expired entries when map gets large
  if (rateLimitMap.size > 10000) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetTime) rateLimitMap.delete(key)
    }
  }

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT - 1 }
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT - entry.count }
}

// ─── Daily free-tier limiter ───
const ipDailyLimit = new Map<string, { count: number; date: string }>()
const FREE_DAILY_LIMIT = 3

// ─── In-memory prompt cache (resets on cold start) ───
const promptCache = new Map<string, { colors: string[]; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Resolve client IP
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown'

  // Per-minute rate limiting (all users)
  const { allowed, remaining } = checkRateLimit(ip)
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT.toString())
  res.setHeader('X-RateLimit-Remaining', remaining.toString())

  if (!allowed) {
    return res.status(429).json({ error: 'Slow down — too many requests. Try again in a minute.' })
  }

  const { prompt, colorCount, isPro } = req.body ?? {}

  if (!prompt || typeof prompt !== 'string' || !colorCount) {
    return res.status(400).json({ error: 'Missing prompt or colorCount' })
  }

  if (prompt.length > 500) {
    return res.status(400).json({ error: 'Prompt too long (max 500 characters)' })
  }

  // Check prompt cache (before daily limit so cached hits don't count)
  const cacheKey = `${prompt.trim().toLowerCase()}::${colorCount}`
  const cached = promptCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.status(200).json({ colors: cached.colors })
  }

  // Daily free-tier limiting (non-Pro only)
  const today = new Date().toISOString().split('T')[0]

  if (!isPro) {
    const record = ipDailyLimit.get(ip)
    const currentCount = record?.date === today ? record.count : 0
    if (currentCount >= FREE_DAILY_LIMIT) {
      return res.status(429).json({ error: 'Daily AI limit reached. Upgrade to Pro for unlimited.' })
    }
    ipDailyLimit.set(ip, { count: currentCount + 1, date: today })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI unavailable' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        temperature: 0,
        messages: [{
          role: 'user',
          content: `You are a color palette API. Return ONLY a JSON array of hex strings, nothing else.\n\nSTRICT RULES:\n- Return exactly ${colorCount} hex colors\n- Every color MUST visually match: "${prompt}"\n- "dark" = ALL hex values must have lightness below 35%. Examples: #1a1a2e, #0d1117, #2d1b69\n- "pastel" = ALL colors soft, desaturated, light (lightness above 75%)\n- "neon" = ALL colors vibrant, fully saturated, electric\n- "warm" = reds, oranges, yellows only\n- "cool" = blues, teals, purples only\n- NEVER include colors that contradict the description\n- Output raw JSON array only — no text, no markdown, no explanation\n\nDESCRIPTION: "${prompt}"\nOUTPUT: ["#hex1","#hex2",...${colorCount} items]`,
        }],
      }),
    })

    if (!response.ok) {
      return res.status(502).json({ error: 'API error' })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    const match = text.match(/\[.*\]/)
    if (!match) {
      return res.status(502).json({ error: 'Invalid response from AI' })
    }

    const colors: string[] = JSON.parse(match[0])
    if (!Array.isArray(colors) || colors.length < 3 || !colors.every((h: string) => /^#[0-9a-fA-F]{6}$/.test(h))) {
      return res.status(502).json({ error: 'Invalid hex array from AI' })
    }

    // Store in cache
    const sliced = colors.slice(0, colorCount)
    promptCache.set(cacheKey, { colors: sliced, timestamp: Date.now() })

    return res.status(200).json({ colors: sliced })
  } catch {
    return res.status(502).json({ error: 'AI unavailable' })
  }
}
