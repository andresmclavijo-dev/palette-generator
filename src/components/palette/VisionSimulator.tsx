import { useState } from 'react'
import { usePro } from '../../hooks/usePro'
import ProBadge from '../ui/ProBadge'
import Tooltip from '../ui/Tooltip'

export type VisionMode = 'normal' | 'deuteranopia' | 'protanopia' | 'tritanopia'

const MODES: { value: VisionMode; label: string }[] = [
  { value: 'normal',       label: 'Normal' },
  { value: 'deuteranopia', label: 'Deuteranopia' },
  { value: 'protanopia',   label: 'Protanopia' },
  { value: 'tritanopia',   label: 'Tritanopia' },
]

interface VisionSimulatorProps {
  mode: VisionMode
  onChange: (mode: VisionMode) => void
  onProGate: () => void
}

export default function VisionSimulator({ mode, onChange, onProGate }: VisionSimulatorProps) {
  const { isPro } = usePro()
  const [dropOpen, setDropOpen] = useState(false)

  const handleClick = () => {
    if (!isPro) { onProGate(); return }
    setDropOpen(o => !o)
  }

  const handleSelect = (v: VisionMode) => {
    onChange(v)
    setDropOpen(false)
  }

  return (
    <div className="relative shrink-0 hidden sm:block">
      <Tooltip text="Simulate color blindness modes">
        <button
          onClick={handleClick}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium transition-all ${
            mode !== 'normal'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>Vision</span>
          <ProBadge />
        </button>
      </Tooltip>

      {/* Dropdown */}
      {dropOpen && (
        <div className="absolute top-full mt-1 right-0 z-50 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1 overflow-hidden">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => handleSelect(m.value)}
              className={`w-full text-left px-4 py-2.5 text-[12px] font-medium transition-colors ${
                mode === m.value
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {m.label}
              {mode === m.value && <span className="float-right">✓</span>}
            </button>
          ))}
        </div>
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
      </defs>
    </svg>
  )
}
