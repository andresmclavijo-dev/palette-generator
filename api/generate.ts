import type { VercelRequest, VercelResponse } from '@vercel/node'

// In-memory IP rate limiter (resets on cold start — good enough for abuse prevention)
const ipRateLimit = new Map<string, { count: number; date: string }>()
const FREE_DAILY_LIMIT = 3

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, colorCount, isPro } = req.body ?? {}

  if (!prompt || typeof prompt !== 'string' || !colorCount) {
    return res.status(400).json({ error: 'Missing prompt or colorCount' })
  }

  // IP rate limiting for non-Pro users
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || (req.headers['x-real-ip'] as string)
    || 'unknown'

  const today = new Date().toISOString().split('T')[0]

  if (!isPro) {
    const record = ipRateLimit.get(ip)
    const currentCount = record?.date === today ? record.count : 0
    if (currentCount >= FREE_DAILY_LIMIT) {
      return res.status(429).json({ error: 'Daily AI limit reached. Upgrade to Pro for unlimited.' })
    }
    ipRateLimit.set(ip, { count: currentCount + 1, date: today })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY
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

    return res.status(200).json({ colors: colors.slice(0, colorCount) })
  } catch {
    return res.status(502).json({ error: 'AI unavailable' })
  }
}
