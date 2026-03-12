import { useEffect, useRef, useState } from 'react'
import chroma from 'chroma-js'
import { parseHex } from '../../lib/colorEngine'

interface ColorPickerProps {
  hex: string
  onChange: (hex: string) => void
  onClose: () => void
}

function hexToHsl(hex: string): [number, number, number] {
  try {
    const [h, s, l] = chroma(hex).hsl()
    return [isNaN(h) ? 0 : h, isNaN(s) ? 0 : s, isNaN(l) ? 0.5 : l]
  } catch {
    return [0, 1, 0.5]
  }
}

function hslToHex(h: number, s: number, l: number): string {
  try { return chroma.hsl(h, s, l).hex() }
  catch { return '#000000' }
}

export default function ColorPicker({ hex, onChange, onClose }: ColorPickerProps) {
  const [h, s, l] = hexToHsl(hex)
  const [hue, setHue] = useState(h)
  const [sat, setSat] = useState(s)
  const [lit, setLit] = useState(l)
  const [draft, setDraft] = useState(hex.replace('#', ''))
  const [copied, setCopied] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const skipNotify = useRef(true)

  const currentHex = hslToHex(hue, sat, lit)

  // Sync draft text when sliders change
  useEffect(() => {
    setDraft(currentHex.replace('#', ''))
  }, [currentHex])

  // Notify parent — skip the initial render
  useEffect(() => {
    if (skipNotify.current) { skipNotify.current = false; return }
    try { onChange(currentHex) } catch { /* silent */ }
  }, [currentHex, onChange])

  // Close on outside click
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose()
      }
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

  const commitHex = () => {
    const parsed = parseHex(draft)
    if (!parsed) return
    const [nh, ns, nl] = hexToHsl(parsed)
    setHue(nh); setSat(ns); setLit(nl)
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(currentHex)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { /* silent */ }
  }

  // Background gradient for saturation slider
  const satBg = `linear-gradient(to right, ${hslToHex(hue, 0, lit)}, ${hslToHex(hue, 1, lit)})`
  // Background gradient for lightness slider
  const litBg = `linear-gradient(to right, #000000, ${hslToHex(hue, sat, 0.5)}, #ffffff)`

  return (
    <div
      ref={pickerRef}
      className="relative w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      onPointerDown={e => e.stopPropagation()}
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

      {/* Large color preview */}
      <div
        className="mx-4 mt-4 rounded-xl h-24 border border-gray-100"
        style={{ backgroundColor: currentHex }}
      />

      {/* Hue slider */}
      <div className="mx-4 mt-4">
        <label className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
          <span>Hue</span><span>{Math.round(hue)}°</span>
        </label>
        <input
          type="range" min={0} max={360} step={1}
          value={hue}
          onChange={e => setHue(Number(e.target.value))}
          className="hue-slider w-full h-3 rounded-full appearance-none cursor-pointer"
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* Saturation slider */}
      <div className="mx-4 mt-3">
        <label className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
          <span>Saturation</span><span>{Math.round(sat * 100)}%</span>
        </label>
        <input
          type="range" min={0} max={100} step={1}
          value={Math.round(sat * 100)}
          onChange={e => setSat(Number(e.target.value) / 100)}
          className="w-full h-3 rounded-full appearance-none cursor-pointer color-slider"
          style={{ background: satBg }}
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* Lightness slider */}
      <div className="mx-4 mt-3">
        <label className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
          <span>Lightness</span><span>{Math.round(lit * 100)}%</span>
        </label>
        <input
          type="range" min={0} max={100} step={1}
          value={Math.round(lit * 100)}
          onChange={e => setLit(Number(e.target.value) / 100)}
          className="w-full h-3 rounded-full appearance-none cursor-pointer color-slider"
          style={{ background: litBg }}
          onClick={e => e.stopPropagation()}
        />
      </div>

      {/* Hex input + copy */}
      <div className="flex items-center gap-2 mx-4 mt-3 mb-4">
        <div className="flex-1 flex items-center gap-1 px-3 h-9 rounded-lg bg-gray-50 border border-gray-200">
          <span className="text-[12px] text-gray-400 font-mono">#</span>
          <input
            value={draft}
            onChange={e => setDraft(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6))}
            onBlur={commitHex}
            onKeyDown={e => { if (e.key === 'Enter') commitHex(); e.stopPropagation() }}
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
