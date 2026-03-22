import { useRef, useState } from 'react'
import { usePro } from '../../hooks/usePro'
import ToolTooltip from '../ui/ToolTooltip'
import { extractColorsFromFile } from '../../lib/kMeans'
import { analytics } from '../../lib/posthog'

interface ImagePaletteProps {
  onPalette: (hexes: string[]) => void
  onProGate: () => void
}

export default function ImagePalette({ onPalette, onProGate }: ImagePaletteProps) {
  const { isPro } = usePro()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (isPro) {
      fileRef.current?.click()
      return
    }
    // All non-Pro users (signed-in or anonymous) → Pro upgrade modal
    analytics.track('pro_gate_hit', { feature: 'image_extraction', source: 'toolbar' })
    onProGate()
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setLoading(true)
    try {
      const colors = await extractColorsFromFile(file)
      onPalette(colors.slice(0, 5))
    } catch {
      setToast("Couldn't read image \u2014 try another.")
      setTimeout(() => setToast(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative shrink-0 hidden sm:block">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <ToolTooltip description="Extract a color palette from any image">
        <button
          onClick={handleClick}
          disabled={loading}
          className="flex items-center gap-3 h-10 px-4 rounded-full text-[14px] font-medium hover:bg-surface hover:text-foreground transition-all disabled:opacity-50"
          style={{ color: 'hsl(var(--muted-foreground))' }}
          aria-label="Extract colors from image (Pro)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>{loading ? 'Analyzing\u2026' : 'Image'}</span>
        </button>
      </ToolTooltip>

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-lg bg-gray-900/90 text-white text-[12px] font-medium whitespace-nowrap shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
