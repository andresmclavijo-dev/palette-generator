import { useEffect, useRef, useState } from 'react'
import chroma from 'chroma-js'
import { usePro } from '../../hooks/usePro'
import { BRAND_VIOLET } from '../../lib/tokens'
import { analytics } from '../../lib/posthog'
export const AI_MAX_FREE = 3

function todayKey() {
  return `paletta_ai_uses_${new Date().toISOString().slice(0, 10)}`
}

export function getAiUsageToday(): number {
  try {
    const val = localStorage.getItem(todayKey())
    return val ? parseInt(val, 10) || 0 : 0
  } catch { return 0 }
}

function incrementUsage() {
  try {
    const key = todayKey()
    const current = getAiUsageToday()
    localStorage.setItem(key, String(current + 1))
  } catch { /* silent */ }
}

export function getAiRemaining(): number {
  return Math.max(0, AI_MAX_FREE - getAiUsageToday())
}

interface AiPromptProps {
  open: boolean
  onClose: () => void
  onPalette: (hexes: string[]) => void
  onFallback: () => void
  onProGate: () => void
  onUsageChange?: () => void
  onError?: (message: string) => void
  colorCount: number
}

export default function AiPrompt({ open, onClose, onPalette, onFallback, onProGate, onUsageChange, onError, colorCount }: AiPromptProps) {
  const { isPro } = usePro()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [usageCount, setUsageCount] = useState(getAiUsageToday)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const remaining = Math.max(0, AI_MAX_FREE - usageCount)
  const exhausted = !isPro && remaining <= 0

  // Refresh usage count and focus textarea when modal opens
  useEffect(() => {
    if (open) {
      setUsageCount(getAiUsageToday())
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open])

  const handleUpgradeOrGenerate = () => {
    if (exhausted) {
      analytics.track('pro_gate_hit', { feature: 'ai_palette', source: 'toolbar' })
      onClose()
      onProGate()
      return
    }
    handleGenerate()
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return

    // Increment usage BEFORE the API call so it counts regardless of success/failure
    if (!isPro) {
      incrementUsage()
      setUsageCount(getAiUsageToday())
      onUsageChange?.()
    }

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

    setLoading(true)
    try {
      // Try server-side API route first (has IP rate limiting)
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), colorCount, isPro }),
      })

      // Handle rate limit — show Pro upgrade
      if (res.status === 429) {
        analytics.track('pro_gate_hit', { feature: 'ai_palette', source: 'toolbar' })
        onClose()
        onProGate()
        return
      }

      let hexes: string[]

      if (res.ok) {
        const data = await res.json()
        hexes = data.colors
      } else if (apiKey) {
        // Fallback to direct API call if server route fails
        const directRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 150,
            temperature: 0,
            messages: [{ role: 'user', content: `You are a color palette API. Return ONLY a JSON array of hex strings, nothing else.\n\nSTRICT RULES:\n- Return exactly ${colorCount} hex colors\n- Every color MUST visually match: "${prompt.trim()}"\n- "dark" = ALL hex values must have lightness below 35%. Examples: #1a1a2e, #0d1117, #2d1b69\n- "pastel" = ALL colors soft, desaturated, light (lightness above 75%)\n- "neon" = ALL colors vibrant, fully saturated, electric\n- "warm" = reds, oranges, yellows only\n- "cool" = blues, teals, purples only\n- NEVER include colors that contradict the description\n- Output raw JSON array only — no text, no markdown, no explanation\n\nDESCRIPTION: "${prompt.trim()}"\nOUTPUT: ["#hex1","#hex2",...${colorCount} items]` }],
          }),
        })

        if (!directRes.ok) throw new Error('API error')
        const directData = await directRes.json()
        const text = directData.content?.[0]?.text || ''
        const match = text.match(/\[.*\]/)
        if (!match) throw new Error('No JSON array in response')
        hexes = JSON.parse(match[0])
      } else {
        throw new Error('No API available')
      }

      if (!Array.isArray(hexes) || hexes.length < 3 || !hexes.every((h: string) => /^#[0-9a-fA-F]{6}$/.test(h))) {
        throw new Error('Invalid hex array')
      }

      // Post-processing: enforce keyword constraints with chroma-js
      const desc = prompt.trim().toLowerCase()
      hexes = hexes.map(hex => {
        try {
          let c = chroma(hex)
          const [h, s, l] = c.hsl()

          if (desc.includes('dark')) {
            if (l > 0.32) c = chroma.hsl(h, Math.min(s + 0.1, 0.75), 0.20 + Math.random() * 0.10)
          } else if (desc.includes('pastel')) {
            if (l < 0.75 || s > 0.40) c = chroma.hsl(h, 0.30 + Math.random() * 0.15, 0.80 + Math.random() * 0.08)
          } else if (desc.includes('neon')) {
            if (s < 0.85 || l < 0.45 || l > 0.65) c = chroma.hsl(h, 0.95, 0.52 + Math.random() * 0.08)
          } else if (desc.includes('warm')) {
            const wh = (h > 65 && h < 330) ? (h > 180 ? 25 + Math.random() * 20 : 40 + Math.random() * 20) : h
            c = chroma.hsl(wh, Math.max(s, 0.55), l)
          } else if (desc.includes('cool') || desc.includes('cold')) {
            const ch = (h < 155 || h > 285) ? 190 + Math.random() * 60 : h
            c = chroma.hsl(ch, Math.max(s, 0.45), l)
          }

          return c.hex()
        } catch {
          return hex
        }
      })

      onPalette(hexes.slice(0, colorCount))
      setPrompt('')
      onClose()
    } catch {
      onFallback()
      onClose()
      onError?.('AI is currently over capacity. Try again in a moment!')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-[400px] max-w-[90vw] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all z-10"
          aria-label="Close AI prompt"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="px-6 pt-7 pb-2">
          <h2 className="text-[18px] font-bold text-gray-900">Generate with AI</h2>
        </div>

        <div className="px-6 pb-4">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleUpgradeOrGenerate() }
              e.stopPropagation()
            }}
            placeholder={exhausted ? 'Upgrade to Pro for unlimited AI palettes' : 'Describe a palette\u2026 e.g. Warm Mediterranean cafe at sunset'}
            disabled={exhausted}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-300 resize-none disabled:opacity-50"
          />
        </div>

        <div className="px-6 pb-5">
          {exhausted ? (
            <button
              onClick={handleUpgradeOrGenerate}
              className="w-full h-10 rounded-full text-white text-[14px] font-medium transition-all active:scale-95 flex items-center justify-center gap-3 bg-brand-violet hover:bg-brand-violet-hover"
            >
              Unlock unlimited AI ✨
            </button>
          ) : (
            <button
              onClick={handleUpgradeOrGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full h-10 rounded-full text-white text-[14px] font-medium transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-3 bg-brand-violet hover:bg-brand-violet-hover"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              ) : (
                <>
                  <span>✨</span>
                  Generate
                </>
              )}
            </button>
          )}

          {/* Usage label */}
          {isPro ? (
            <p className="text-center text-[12px] font-medium mt-2.5" style={{ color: BRAND_VIOLET }}>
              ✦ Unlimited prompts
            </p>
          ) : !exhausted ? (
            <p className="text-center text-[11px] text-gray-400 mt-2.5">
              {remaining} AI generation{remaining !== 1 ? 's' : ''} left today
            </p>
          ) : (
            <p className="text-center text-[11px] text-gray-400 mt-2.5">
              No AI generations left today
            </p>
          )}
        </div>
      </div>

    </div>
  )
}
