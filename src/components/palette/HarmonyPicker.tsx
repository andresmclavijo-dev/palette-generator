import { useCallback, useEffect, useRef, useState } from 'react'
import type { HarmonyMode } from '../../lib/colorEngine'

const MODES: { value: HarmonyMode; label: string }[] = [
  { value: 'random',        label: 'Random'        },
  { value: 'analogous',     label: 'Analogous'     },
  { value: 'monochromatic', label: 'Monochromatic' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'triadic',       label: 'Triadic'       },
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
        className="flex items-center gap-0.5 overflow-x-auto scrollbar-none snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: 'touch' }}
        onClick={e => e.stopPropagation()}
      >
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={`
              px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap
              transition-all duration-150 cursor-pointer select-none shrink-0 snap-start
              ${mode === m.value
                ? 'bg-brand-blue text-white'
                : 'text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]'
              }
            `}
          >
            {m.label}
          </button>
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
