import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { HarmonyMode } from '../../lib/colorEngine'

const MODES: { value: HarmonyMode; label: string; desc: string }[] = [
  { value: 'random',        label: 'Random',        desc: 'No rules, pure exploration' },
  { value: 'analogous',     label: 'Analogous',     desc: 'Colors next to each other on the wheel' },
  { value: 'monochromatic', label: 'Monochromatic', desc: 'Shades of a single hue' },
  { value: 'complementary', label: 'Complementary', desc: 'Opposite sides of the wheel' },
  { value: 'triadic',       label: 'Triadic',       desc: 'Three evenly spaced colors' },
]

interface HarmonyPickerProps {
  mode: HarmonyMode
  onChange: (mode: HarmonyMode) => void
}

export default function HarmonyPicker({ mode, onChange }: HarmonyPickerProps) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 })

  const activeLabel = MODES.find(m => m.value === mode)?.label ?? 'Random'

  const handleToggle = useCallback(() => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen(o => !o)
  }, [open])

  const handleSelect = useCallback((v: HarmonyMode) => {
    onChange(v)
    setOpen(false)
  }, [onChange])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || dropRef.current?.contains(target)) return
      setOpen(false)
    }
    const raf = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handler)
    })
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousedown', handler)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="flex items-center gap-1.5 h-10 px-3 rounded-full text-[14px] font-medium transition-all hover:bg-surface-secondary"
        style={{ color: '#444444' }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Harmony: ${activeLabel}`}
      >
        <span style={{ color: '#555555', fontWeight: 700 }}>Harmony:</span>
        <span>{activeLabel}</span>
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className="transition-transform duration-150"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          role="listbox"
          aria-label="Harmony modes"
          className="bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 overflow-hidden"
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, zIndex: 9999, width: 280 }}
        >
          {MODES.map(m => {
            const isActive = mode === m.value
            return (
              <button
                key={m.value}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(m.value)}
                className={`w-full text-left px-4 py-2.5 transition-colors ${
                  isActive ? 'bg-violet-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[13px] font-semibold ${isActive ? 'text-violet-700' : 'text-gray-800'}`}>
                    {m.label}
                  </span>
                  {isActive && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6C47FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug m-0">{m.desc}</p>
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}

/** List variant for mobile drawer — shows all options inline */
export function HarmonyPickerList({ mode, onChange }: HarmonyPickerProps) {
  return (
    <div className="space-y-0.5">
      {MODES.map(m => {
        const isActive = mode === m.value
        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors ${
              isActive ? 'bg-violet-50' : 'hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[13px] font-semibold ${isActive ? 'text-violet-700' : 'text-gray-800'}`}>
                {m.label}
              </span>
              {isActive && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6C47FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug m-0">{m.desc}</p>
          </button>
        )
      })}
    </div>
  )
}
