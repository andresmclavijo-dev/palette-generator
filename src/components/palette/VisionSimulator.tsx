import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePro } from '../../hooks/usePro'
import ToolTooltip from '../ui/ToolTooltip'

export type VisionMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'

const MODES: { value: VisionMode; label: string; desc: string; free: boolean }[] = [
  { value: 'normal',        label: 'Normal Vision',  desc: 'Default color rendering',    free: true },
  { value: 'protanopia',    label: 'Protanopia',     desc: 'Red-blind color vision',     free: true },
  { value: 'deuteranopia',  label: 'Deuteranopia',   desc: 'Green-blind color vision',   free: false },
  { value: 'tritanopia',    label: 'Tritanopia',     desc: 'Blue-blind color vision',    free: false },
  { value: 'achromatopsia', label: 'Achromatopsia',  desc: 'Complete color blindness',   free: false },
]

const PRIMARY = '#6C47FF'

interface VisionSimulatorProps {
  mode: VisionMode
  onChange: (mode: VisionMode) => void
  onProGate: () => void
}

export default function VisionSimulator({ mode, onChange, onProGate }: VisionSimulatorProps) {
  const { isPro } = usePro()
  const [dropOpen, setDropOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 })

  const handleClick = () => {
    if (!dropOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    }
    setDropOpen(o => !o)
  }

  const handleSelect = (m: typeof MODES[number]) => {
    if (!m.free && !isPro) {
      setDropOpen(false)
      onProGate()
      return
    }
    onChange(m.value)
  }

  // Close on outside click
  useEffect(() => {
    if (!dropOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || dropRef.current?.contains(target)) return
      setDropOpen(false)
    }
    const raf = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handler)
    })
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousedown', handler)
    }
  }, [dropOpen])

  // Close on Escape
  useEffect(() => {
    if (!dropOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDropOpen(false); btnRef.current?.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dropOpen])

  return (
    <div className="relative shrink-0 hidden sm:block">
      <ToolTooltip description="Simulate color blindness" disabled={dropOpen}>
        <button
          ref={btnRef}
          onClick={handleClick}
          className={`flex items-center gap-1.5 h-10 px-4 rounded-full text-[14px] font-medium transition-all duration-150 ${
            mode !== 'normal'
              ? 'bg-blue-50 text-blue-600'
              : 'hover:bg-surface-secondary text-[#444444]'
          }`}
          aria-label="Accessibility vision simulation"
          aria-haspopup="listbox"
          aria-expanded={dropOpen}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>Accessibility</span>
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            className="transition-transform duration-150"
            style={{ transform: dropOpen ? 'rotate(180deg)' : undefined }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </ToolTooltip>

      {/* Dropdown — portaled to body to escape overflow clipping */}
      {dropOpen && createPortal(
        <div
          ref={dropRef}
          role="listbox"
          aria-label="Vision simulation modes"
          className="bg-white overflow-hidden"
          style={{
            position: 'fixed', top: dropPos.top, right: dropPos.right, zIndex: 9999,
            width: 300, borderRadius: 12,
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          {MODES.map((m, i) => {
            const isActive = mode === m.value
            const needsPro = !m.free && !isPro
            return (
              <button
                key={m.value}
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(m)}
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
                  <div className="flex items-center gap-2 shrink-0">
                    {needsPro && (
                      <span
                        className="text-[10px] font-bold"
                        style={{
                          background: 'rgba(108,71,255,0.1)',
                          color: PRIMARY,
                          padding: '2px 8px',
                          borderRadius: 99,
                        }}
                      >
                        PRO
                      </span>
                    )}
                    {isActive && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
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

// SVG filter definitions — inject once in the DOM
export function VisionFilterDefs() {
  return (
    <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
      <defs>
        <filter id="vision-deuteranopia">
          <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" />
        </filter>
        <filter id="vision-protanopia">
          <feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" />
        </filter>
        <filter id="vision-tritanopia">
          <feColorMatrix type="matrix" values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0" />
        </filter>
        <filter id="vision-achromatopsia">
          <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0" />
        </filter>
      </defs>
    </svg>
  )
}
