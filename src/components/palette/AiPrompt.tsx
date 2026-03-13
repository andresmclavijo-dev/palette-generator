import { useEffect, useRef, useState } from 'react'
import { usePro } from '../../hooks/usePro'

const BRAND = '#1A73E8'
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
  colorCount: number
}

export default function AiPrompt({ open, onClose, onPalette, onFallback, onProGate, onUsageChange, colorCount }: AiPromptProps) {
  const { isPro } = usePro()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
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

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleUpgradeOrGenerate = () => {
    if (exhausted) {
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
    if (!apiKey) {
      showToast('AI unavailable \u2014 using random')
      onFallback()
      onClose()
      return
    }

    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
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

      if (!res.ok) throw new Error('API error')

      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const match = text.match(/\[.*\]/)
      if (!match) throw new Error('No JSON array in response')

      let hexes: string[] = JSON.parse(match[0])
      if (!Array.isArray(hexes) || hexes.length < 3 || !hexes.every((h: string) => /^#[0-9a-fA-F]{6}$/.test(h))) {
        throw new Error('Invalid hex array')
      }

      // Post-processing: darken colors if prompt asked for "dark"
      if (prompt.trim().toLowerCase().includes('dark')) {
        hexes = hexes.map(hex => {
          const r = parseInt(hex.slice(1, 3), 16)
          const g = parseInt(hex.slice(3, 5), 16)
          const b = parseInt(hex.slice(5, 7), 16)
          const lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255
          if (lightness > 0.4) {
            const scale = 0.3
            const dr = Math.round(r * scale)
            const dg = Math.round(g * scale)
            const db = Math.round(b * scale)
            return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`
          }
          return hex
        })
      }

      onPalette(hexes.slice(0, colorCount))
      setPrompt('')
      onClose()
    } catch {
      showToast('AI unavailable \u2014 using random')
      onFallback()
      onClose()
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
              className="w-full h-11 rounded-full text-white text-[14px] font-semibold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: BRAND }}
            >
              Upgrade for unlimited ✨
            </button>
          ) : (
            <button
              onClick={handleUpgradeOrGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full h-11 rounded-full text-white text-[14px] font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: BRAND }}
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

          {/* Usage counter for non-Pro users */}
          {!isPro && !exhausted && (
            <p className="text-center text-[11px] text-gray-400 mt-2.5">
              {remaining} of {AI_MAX_FREE} free prompts today
            </p>
          )}
          {exhausted && (
            <p className="text-center text-[11px] text-gray-400 mt-2.5">
              You've used your {AI_MAX_FREE} free prompts today
            </p>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-lg bg-gray-900/90 text-white text-[12px] font-medium whitespace-nowrap shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
