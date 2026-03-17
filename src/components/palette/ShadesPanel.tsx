import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { generateShades, getColorName, readableOn, TAILWIND_SHADE_LABELS } from '../../lib/colorEngine'
import { showToast } from '../../utils/toast'

const IS_COARSE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 640

interface ShadesPanelProps {
  hex: string
  onClose: () => void
}

export default function ShadesPanel({ hex, onClose }: ShadesPanelProps) {
  const shades = generateShades(hex, 10)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const colorName = getColorName(hex)

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleCopy = async (shade: string, i: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(shade)
      setCopiedIndex(i)
      showToast('Copied!')
      setTimeout(() => setCopiedIndex(null), 1200)
    } catch { /* silent */ }
  }

  const shadeRows = shades.map((shade, i) => {
    const labelColor = readableOn(shade)
    const isCopied = copiedIndex === i
    return (
      <div
        key={shade + i}
        className="flex-1 flex items-center justify-between px-4 cursor-pointer group/shade min-h-[40px]"
        style={{ backgroundColor: shade }}
        onClick={(e) => handleCopy(shade, i, e)}
      >
        <span
          className="text-[10px] font-mono tracking-widest opacity-40 group-hover/shade:opacity-70 transition-opacity select-none"
          style={{ color: labelColor }}
        >
          {TAILWIND_SHADE_LABELS[i] ?? (i + 1) * 100}
        </span>
        <span
          className="text-[11px] font-mono tracking-wider opacity-60 group-hover/shade:opacity-100 transition-opacity select-none"
          style={{ color: labelColor }}
        >
          {isCopied ? '✓ Copied' : shade.toUpperCase()}
        </span>
      </div>
    )
  })

  // Mobile: full-screen bottom sheet — portaled to escape vision filter
  if (IS_COARSE || IS_MOBILE) {
    return createPortal(
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm sheet-backdrop" />

        {/* Sheet */}
        <div
          className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            maxHeight: '85vh',
            transform: visible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 200ms ease-out',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-gray-100 shrink-0">
            <div>
              <span className="text-[15px] font-semibold text-gray-800">Shades</span>
              {colorName && (
                <span className="text-[12px] text-gray-400 ml-2">{colorName}</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
              aria-label="Close shades panel"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Color preview strip */}
          <div className="h-12 shrink-0" style={{ backgroundColor: hex }} />

          {/* Shade rows — scrollable */}
          <div className="flex-1 overflow-y-auto flex flex-col" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
            {shadeRows}
          </div>
        </div>
      </div>,
      document.body
    )
  }

  // Desktop: inline overlay (existing behavior)
  return (
    <div className="absolute inset-0 z-20 flex flex-col pb-20" onClick={e => e.stopPropagation()}>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 z-30 w-11 h-11 rounded-full flex items-center justify-center
          bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all duration-150"
        aria-label="Close shades"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      {shadeRows}
    </div>
  )
}
