import { useEffect, useRef, useState } from 'react'
import { usePro } from '../../hooks/usePro'
import { useAuth } from '../../hooks/useAuth'

const BRAND = '#1A73E8'
const STORAGE_KEY = 'paletta_ai_uses'
const MAX_FREE = 3

interface AiPromptProps {
  open: boolean
  onClose: () => void
  onPalette: (hexes: string[]) => void
  onFallback: () => void
  onProGate: () => void
  onSignIn: () => void
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getUsageToday(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw)
    if (parsed.date === todayKey()) return parsed.count
    return 0
  } catch { return 0 }
}

function incrementUsage() {
  try {
    const date = todayKey()
    const current = getUsageToday()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date, count: current + 1 }))
  } catch { /* silent */ }
}

export default function AiPrompt({ open, onClose, onPalette, onFallback, onProGate, onSignIn }: AiPromptProps) {
  const { isPro } = usePro()
  const { isSignedIn } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [usageCount, setUsageCount] = useState(getUsageToday)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const remaining = Math.max(0, MAX_FREE - usageCount)
  const exhausted = !isPro && remaining <= 0

  // Focus textarea when modal opens
  useEffect(() => {
    if (open) {
      setUsageCount(getUsageToday())
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [open])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleGenerate = async () => {
    if (exhausted) {
      if (isSignedIn) onProGate()
      else onSignIn()
      return
    }
    if (!prompt.trim() || loading) return

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
          max_tokens: 200,
          system: 'You are a color palette generator. Given a description, return ONLY a JSON array of exactly 5 hex color strings like ["#FF5733","#33FF57","#3357FF","#F333FF","#33FFF3"]. No other text.',
          messages: [{ role: 'user', content: prompt.trim() }],
        }),
      })

      if (!res.ok) throw new Error('API error')

      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const match = text.match(/\[.*\]/)
      if (!match) throw new Error('No JSON array in response')

      const hexes: string[] = JSON.parse(match[0])
      if (!Array.isArray(hexes) || hexes.length < 3 || !hexes.every((h: string) => /^#[0-9a-fA-F]{6}$/.test(h))) {
        throw new Error('Invalid hex array')
      }

      if (!isPro) {
        incrementUsage()
        setUsageCount(getUsageToday())
      }
      onPalette(hexes.slice(0, 5))
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
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate() }
              e.stopPropagation()
            }}
            placeholder={exhausted ? 'Upgrade to Pro for unlimited AI palettes' : 'Describe a palette\u2026 e.g. Warm Mediterranean cafe at sunset'}
            disabled={exhausted}
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-300 resize-none disabled:opacity-50"
          />
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={handleGenerate}
            disabled={loading || (!exhausted && !prompt.trim())}
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

          {/* Usage counter for non-Pro users */}
          {!isPro && (
            <p className="text-center text-[11px] text-gray-400 mt-2.5">
              {exhausted ? (
                <button
                  onClick={() => isSignedIn ? onProGate() : onSignIn()}
                  className="text-blue-500 hover:underline"
                >
                  Upgrade to Pro for unlimited
                </button>
              ) : (
                <>{remaining} of {MAX_FREE} free prompts today</>
              )}
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
