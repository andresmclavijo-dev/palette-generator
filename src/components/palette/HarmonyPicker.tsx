import { useCallback, useEffect, useRef, useState } from 'react'
import type { HarmonyMode } from '../../lib/colorEngine'
import ToolTooltip from '../ui/ToolTooltip'

const MODES: { value: HarmonyMode; label: string; tip: string }[] = [
  { value: 'random',        label: 'Random',        tip: 'Generate random color combinations' },
  { value: 'analogous',     label: 'Analogous',     tip: 'Colors next to each other on the color wheel' },
  { value: 'monochromatic', label: 'Monochromatic', tip: 'Shades and tints of a single color' },
  { value: 'complementary', label: 'Complementary', tip: 'Colors opposite on the color wheel' },
  { value: 'triadic',       label: 'Triadic',       tip: 'Three colors equally spaced on the color wheel' },
]

interface HarmonyPickerProps {
  mode: HarmonyMode
  onChange: (mode: HarmonyMode) => void
}

export default function HarmonyPicker({ mode, onChange }: HarmonyPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showFade, setShowFade] = useState(true)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    setShowFade(!atEnd)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    return () => el.removeEventListener('scroll', checkScroll)
  }, [checkScroll])

  return (
    <div className="relative flex-1 min-w-0">
      <div
        ref={scrollRef}
        className="flex items-center gap-1 overflow-x-auto scrollbar-none snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onClick={e => e.stopPropagation()}
      >
        {MODES.map(m => (
          <ToolTooltip key={m.value} description={m.tip}>
            <button
              onClick={() => onChange(m.value)}
              className="px-3 h-10 rounded-full text-[14px] font-medium whitespace-nowrap transition-all duration-150 cursor-pointer select-none shrink-0 snap-start"
              style={{
                background: mode === m.value ? '#6C47FF' : '#f5f5f3',
                color: mode === m.value ? '#FFFFFF' : '#2C2C2A',
              }}
            >
              {m.label}
            </button>
          </ToolTooltip>
        ))}
      </div>
      {/* Right fade gradient — scroll hint */}
      {showFade && (
        <div
          className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none sm:hidden"
          style={{ background: 'linear-gradient(to right, transparent, white)' }}
        />
      )}
    </div>
  )
}
