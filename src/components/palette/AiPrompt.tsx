import { useState } from 'react'
import ProBadge from '../ui/ProBadge'

const BRAND = '#1A73E8'
const STORAGE_KEY = 'paletta-ai-uses'
const MAX_FREE = 3

interface AiPromptProps {
  onPalette: (hexes: string[]) => void
  onFallback: () => void
  onProGate: () => void
}

function getUsageCount(): number {
  try { return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) } catch { return 0 }
}
function incrementUsage() {
  try { localStorage.setItem(STORAGE_KEY, String(getUsageCount() + 1)) } catch { /* silent */ }
}

export default function AiPrompt({ onPalette, onFallback, onProGate }: AiPromptProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const usage = getUsageCount()
  const exhausted = usage >= MAX_FREE

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleGenerate = async () => {
    if (exhausted) { onProGate(); return }
    if (!prompt.trim() || loading) return

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      showToast('AI unavailable — using random')
      onFallback()
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

      incrementUsage()
      onPalette(hexes.slice(0, 5))
      setPrompt('')
    } catch {
      showToast('AI unavailable — using random')
      onFallback()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2 w-full" onClick={e => e.stopPropagation()}>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); e.stopPropagation() }}
          placeholder={exhausted ? 'Upgrade to Pro for unlimited AI palettes' : 'Describe a palette… e.g. Warm Mediterranean cafe'}
          disabled={exhausted}
          className="flex-1 min-w-0 h-8 px-3 rounded-full bg-gray-50 border border-gray-200 text-[12px] text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-300 disabled:opacity-50"
        />
        <div className="relative shrink-0">
          <button
            onClick={handleGenerate}
            disabled={loading || (!exhausted && !prompt.trim())}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full text-white text-[12px] font-medium transition-all disabled:opacity-40"
            style={{ backgroundColor: BRAND }}
          >
            {loading ? (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            ) : (
              <span>✨</span>
            )}
            <span className="hidden sm:inline">Generate</span>
          </button>
          <span className="absolute -top-1.5 -right-1.5">
            <ProBadge />
          </span>
        </div>
      </div>

      {/* Usage indicator */}
      {exhausted && (
        <button
          onClick={onProGate}
          className="text-[10px] text-blue-500 whitespace-nowrap shrink-0 hover:underline"
        >
          Upgrade to Pro
        </button>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-lg bg-gray-900/90 text-white text-[12px] font-medium whitespace-nowrap shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
