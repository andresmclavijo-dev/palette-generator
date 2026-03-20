import { useEffect, useRef, useState } from 'react'
import chroma from 'chroma-js'
import { usePro } from '../../hooks/usePro'
import { BRAND_VIOLET } from '../../lib/tokens'
import { analytics } from '../../lib/posthog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../ui/dialog'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const remaining = Math.max(0, AI_MAX_FREE - usageCount)
  const exhausted = !isPro && remaining <= 0

  // Refresh usage count and focus textarea when modal opens
  useEffect(() => {
    if (open) {
      setUsageCount(getAiUsageToday())
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Visual Viewport API — adjust dialog when mobile keyboard opens
  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => {
      const offset = window.innerHeight - vv.height
      document.documentElement.style.setProperty('--kb-offset', `${offset}px`)
    }
    vv.addEventListener('resize', handleResize)
    return () => {
      vv.removeEventListener('resize', handleResize)
      document.documentElement.style.setProperty('--kb-offset', '0px')
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

    setLoading(true)
    try {
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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Something went wrong' }))
        throw new Error(errorData.error || 'Couldn\'t generate palette')
      }

      const data = await res.json()
      let hexes: string[] = data.colors

      if (!Array.isArray(hexes) || hexes.length < 3 || !hexes.every((h: string) => /^#[0-9a-fA-F]{6}$/.test(h))) {
        throw new Error('Invalid palette response')
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
    } catch (err) {
      onFallback()
      onClose()
      onError?.(err instanceof Error && err.message !== 'Invalid palette response'
        ? err.message
        : 'Couldn\'t generate palette. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const AI_PRESETS = ['Warm sunset', 'Ocean breeze', 'Forest canopy', 'Neon cyber', 'Pastel dream', 'Earthy tones']

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-md"
        aria-describedby={undefined}
        style={{ transform: 'translate(-50%, -50%) translateY(calc(var(--kb-offset, 0px) / -2))' }}
      >
        <DialogHeader>
          <DialogTitle>AI palette</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* Input + Generate button (inline) */}
          <div className="flex gap-2">
            <label htmlFor="ai-prompt-input" className="sr-only">AI prompt</label>
            <input
              id="ai-prompt-input"
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && prompt.trim()) { e.preventDefault(); handleUpgradeOrGenerate() }
                e.stopPropagation()
              }}
              placeholder={exhausted ? 'Upgrade to Pro for unlimited AI' : 'Describe a mood or theme\u2026'}
              disabled={exhausted}
              className="flex-1 h-9 px-3 rounded-button border border-border text-sm outline-none transition-all disabled:opacity-50"
              style={{ color: '#1a1a2e' }}
              onFocus={e => { e.currentTarget.style.borderColor = BRAND_VIOLET; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,71,255,0.15)' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
            />
            {exhausted ? (
              <button
                onClick={handleUpgradeOrGenerate}
                className="h-9 px-4 rounded-button text-white text-sm font-medium transition-all hover:opacity-90 shrink-0"
                style={{ backgroundColor: BRAND_VIOLET }}
              >
                Unlock Pro
              </button>
            ) : (
              <button
                onClick={handleUpgradeOrGenerate}
                disabled={loading || !prompt.trim()}
                className="h-9 px-4 rounded-button text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40 shrink-0 flex items-center gap-1.5"
                style={{ backgroundColor: BRAND_VIOLET }}
              >
                {loading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                ) : 'Generate'}
              </button>
            )}
          </div>

          {/* Preset tags */}
          <div className="flex flex-wrap gap-1.5">
            {AI_PRESETS.map(chip => (
              <button
                key={chip}
                onClick={e => {
                  e.stopPropagation()
                  setPrompt(chip)
                  inputRef.current?.focus()
                }}
                className="px-2.5 py-1 text-xs font-medium transition-all hover:bg-gray-200"
                style={{ borderRadius: 6, backgroundColor: '#f3f4f6', color: '#374151' }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Usage counter */}
          <p className="text-xs m-0" style={{ color: '#9ca3af' }}>
            {isPro ? '✦ Unlimited prompts' : exhausted ? 'No AI generations left today' : `${remaining}/day free · Unlimited with Pro`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
