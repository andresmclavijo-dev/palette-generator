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

const PRIMARY = '#6C47FF'

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
        className="flex items-center gap-1.5 h-10 px-4 rounded-full text-[14px] font-medium transition-all duration-150 hover:bg-surface-secondary"
        style={{ color: '#444444' }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Harmony: ${activeLabel}`}
      >
        <span style={{ color: '#1a1a2e', fontWeight: 700 }}>Harmony:</span>
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
          className="bg-white overflow-hidden"
          style={{
            position: 'fixed', top: dropPos.top, left: dropPos.left, zIndex: 9999,
            width: 300, borderRadius: 12,
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          {MODES.map((m, i) => {
            const isActive = mode === m.value
            return (
              <button
                key={m.value}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(m.value)}
                className="w-full text-left transition-colors duration-150"
                style={{
                  padding: '12px 16px',
                  background: isActive ? 'rgba(108,71,255,0.08)' : undefined,
                  borderTop: i > 0 ? '1px solid #F3F4F6' : undefined,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F9FAFB' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '' }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[14px] font-bold"
                    style={{ color: isActive ? PRIMARY : '#1a1a2e' }}
                  >
                    {m.label}
                  </span>
                  {isActive && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <p className="text-[13px] mt-0.5 leading-snug m-0" style={{ color: '#6B7280' }}>{m.desc}</p>
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
    <div>
      {MODES.map((m, i) => {
        const isActive = mode === m.value
        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className="w-full text-left rounded-xl transition-colors duration-150 hover:bg-gray-50 active:bg-gray-100"
            style={{
              padding: '12px 16px',
              background: isActive ? 'rgba(108,71,255,0.08)' : undefined,
              borderTop: i > 0 ? '1px solid #F3F4F6' : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[14px] font-bold"
                style={{ color: isActive ? PRIMARY : '#1a1a2e' }}
              >
                {m.label}
              </span>
              {isActive && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <p className="text-[13px] mt-0.5 leading-snug m-0" style={{ color: '#6B7280' }}>{m.desc}</p>
          </button>
        )
      })}
    </div>
  )
}
