import { useState } from 'react'
import { generateShades, readableOn } from '../../lib/colorEngine'

interface ShadesPanelProps {
  hex: string
  onClose: () => void
}

export default function ShadesPanel({ hex, onClose }: ShadesPanelProps) {
  const shades = generateShades(hex, 10)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = async (shade: string, i: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(shade)
      setCopiedIndex(i)
      setTimeout(() => setCopiedIndex(null), 1200)
    } catch { /* silent */ }
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col" onClick={e => e.stopPropagation()}>

      {/* Close button */}
      <button
        onClick={onClose}
        className="
          absolute top-2 right-2 z-30
          w-11 h-11 rounded-full
          flex items-center justify-center
          bg-black/20 hover:bg-black/40
          text-white/70 hover:text-white
          transition-all duration-150
        "
        aria-label="Close shades"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Shade rows */}
      {shades.map((shade, i) => {
        const labelColor = readableOn(shade)
        const isCopied = copiedIndex === i
        return (
          <div
            key={shade}
            className="flex-1 flex items-center justify-between px-4 cursor-pointer group/shade"
            style={{ backgroundColor: shade }}
            onClick={(e) => handleCopy(shade, i, e)}
          >
            {/* Shade number */}
            <span
              className="text-[10px] font-mono tracking-widest opacity-40 group-hover/shade:opacity-70 transition-opacity select-none"
              style={{ color: labelColor }}
            >
              {(i + 1) * 100}
            </span>

            {/* Hex + copy feedback */}
            <span
              className="text-[11px] font-mono tracking-wider opacity-60 group-hover/shade:opacity-100 transition-opacity select-none"
              style={{ color: labelColor }}
            >
              {isCopied ? '✓ Copied' : shade.toUpperCase()}
            </span>
          </div>
        )
      })}
    </div>
  )
}
