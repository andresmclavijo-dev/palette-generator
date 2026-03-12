import { useCallback, useEffect, useRef, useState } from 'react'
import chroma from 'chroma-js'
import { parseHex } from '../../lib/colorEngine'

interface ColorPickerProps {
  hex: string
  onChange: (hex: string) => void
  onClose: () => void
}

function safeHsv(hex: string): { h: number; s: number; v: number } {
  try {
    const [h, s, v] = chroma(hex).hsv()
    return { h: isNaN(h) ? 0 : h, s: isNaN(s) ? 0 : s, v: isNaN(v) ? 1 : v }
  } catch {
    return { h: 0, s: 1, v: 1 }
  }
}

function safeHsvToHex(h: number, s: number, v: number): string {
  try {
    return chroma.hsv(
      isNaN(h) ? 0 : h,
      isNaN(s) ? 0 : Math.max(0, Math.min(1, s)),
      isNaN(v) ? 1 : Math.max(0, Math.min(1, v)),
    ).hex()
  } catch {
    return '#000000'
  }
}

export default function ColorPicker({ hex, onChange, onClose }: ColorPickerProps) {
  const initial = safeHsv(hex)

  const [hue, setHue] = useState(initial.h)
  const [sat, setSat] = useState(initial.s)
  const [val, setVal] = useState(initial.v)
  const [draft, setDraft] = useState(hex.replace('#', ''))
  const [copied, setCopied] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const mounted = useRef(false)

  const currentHex = safeHsvToHex(hue, sat, val)

  // Draw SV canvas whenever hue changes
  useEffect(() => {
    try {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const w = canvas.width
      const h = canvas.height
      if (w <= 0 || h <= 0) return

      let baseColor: string
      try { baseColor = chroma.hsv(isNaN(hue) ? 0 : hue, 1, 1).css() }
      catch { baseColor = 'red' }

      const gradH = ctx.createLinearGradient(0, 0, w, 0)
      gradH.addColorStop(0, '#ffffff')
      gradH.addColorStop(1, baseColor)
      ctx.fillStyle = gradH
      ctx.fillRect(0, 0, w, h)

      const gradV = ctx.createLinearGradient(0, 0, 0, h)
      gradV.addColorStop(0, 'rgba(0,0,0,0)')
      gradV.addColorStop(1, 'rgba(0,0,0,1)')
      ctx.fillStyle = gradV
      ctx.fillRect(0, 0, w, h)
    } catch { /* silent */ }
  }, [hue])

  // Sync draft when color changes
  useEffect(() => {
    try { setDraft(currentHex.replace('#', '')) } catch { /* silent */ }
  }, [currentHex])

  // Notify parent on every change — skip initial mount to prevent crash loops
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return }
    try { onChange(currentHex) } catch { /* silent */ }
  }, [currentHex, onChange])

  // SV canvas interaction — guard ref
  const updateFromCanvas = useCallback((clientX: number, clientY: number) => {
    try {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
      setSat(x)
      setVal(1 - y)
    } catch { /* silent */ }
  }, [])

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!canvasRef.current) return
    dragging.current = true
    updateFromCanvas(e.clientX, e.clientY)
  }

  // Document-level pointer tracking for canvas drag
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragging.current) return
      if (!canvasRef.current) return
      try { updateFromCanvas(e.clientX, e.clientY) } catch { /* silent */ }
    }
    const handleUp = () => { dragging.current = false }
    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
    return () => {
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }
  }, [updateFromCanvas])

  // Close on outside click
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      try {
        if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
          onClose()
        }
      } catch { /* silent */ }
    }
    const timer = setTimeout(() => document.addEventListener('pointerdown', handler), 10)
    return () => { clearTimeout(timer); document.removeEventListener('pointerdown', handler) }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleHexCommit = () => {
    try {
      const parsed = parseHex(draft)
      if (!parsed) return
      const hsv = safeHsv(parsed)
      setHue(hsv.h)
      setSat(hsv.s)
      setVal(hsv.v)
    } catch { /* silent */ }
  }

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      // Only allow hex characters
      const cleaned = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
      setDraft(cleaned)
    } catch { /* silent */ }
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(currentHex)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { /* silent */ }
  }

  return (
    <div
      ref={pickerRef}
      className="relative w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
        title="Close"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* SV Canvas */}
      <div className="relative mx-4 mt-4 rounded-xl overflow-hidden" style={{ height: 160 }}>
        <canvas
          ref={canvasRef}
          width={544}
          height={320}
          className="w-full h-full cursor-crosshair"
          style={{ imageRendering: 'auto' }}
          onPointerDown={handleCanvasPointerDown}
        />
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${Math.max(0, Math.min(100, sat * 100))}%`,
            top: `${Math.max(0, Math.min(100, (1 - val) * 100))}%`,
            backgroundColor: currentHex,
          }}
        />
      </div>

      {/* Hue slider */}
      <div className="mx-4 mt-3">
        <input
          type="range"
          min={0}
          max={360}
          value={isNaN(hue) ? 0 : hue}
          onChange={e => {
            try { setHue(Number(e.target.value)) } catch { /* silent */ }
          }}
          className="hue-slider w-full h-3 rounded-full appearance-none cursor-pointer"
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* Preview swatch + hex input + buttons */}
      <div className="flex items-center gap-2 mx-4 mt-3 mb-4">
        <div
          className="w-9 h-9 rounded-lg shrink-0 border border-gray-200"
          style={{ backgroundColor: currentHex }}
        />
        <div className="flex-1 flex items-center gap-1 px-3 h-9 rounded-lg bg-gray-50 border border-gray-200">
          <span className="text-[12px] text-gray-400 font-mono">#</span>
          <input
            value={draft}
            onChange={handleDraftChange}
            onBlur={handleHexCommit}
            onKeyDown={e => {
              try {
                if (e.key === 'Enter') handleHexCommit()
                e.stopPropagation()
              } catch { /* silent */ }
            }}
            maxLength={6}
            className="flex-1 min-w-0 bg-transparent text-[13px] font-mono uppercase outline-none"
            onClick={e => e.stopPropagation()}
          />
        </div>
        <button
          onClick={handleCopy}
          className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
          title="Copy hex"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          )}
        </button>
      </div>
    </div>
  )
}
