import { useState } from 'react'
import { readableOn } from '../../lib/colorEngine'

interface ColorSwatchProps {
  hex: string
  index: number
}

export default function ColorSwatch({ hex, index }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false)
  const labelColor = readableOn(hex)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable — silently ignore
    }
  }

  return (
    <div
      className="relative flex-1 flex flex-col justify-end cursor-pointer group transition-all duration-200"
      style={{
        backgroundColor: hex,
        // Subtle brightness lift on hover via filter
      }}
      onClick={handleCopy}
      role="button"
      aria-label={`Copy ${hex}`}
      tabIndex={index}
    >
      {/* Hover overlay — brightness shift */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
      />

      {/* HEX label */}
      <div
        className="relative z-10 flex flex-col items-center gap-1 pb-6 select-none"
        style={{ color: labelColor }}
      >
        <span
          className="text-xs font-mono font-medium tracking-widest uppercase opacity-80 group-hover:opacity-100 transition-opacity"
        >
          {copied ? 'Copied!' : hex.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
