import { useEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'

const IS_MOBILE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

interface ColorPickerProps {
  hex: string
  onChange: (hex: string) => void
  onClose: () => void
}

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
  }
  return fallbackCopy(text)
}

function fallbackCopy(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      resolve()
    } catch (err) { reject(err) }
  })
}

export default function ColorPicker({ hex, onChange, onClose }: ColorPickerProps) {
  const [color, setColor] = useState(hex.startsWith('#') ? hex : '#' + hex)
  const [copied, setCopied] = useState(false)
  const [visible, setVisible] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  const skipFirst = useRef(true)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // Sync internal color when hex prop changes (e.g. opened on a different swatch)
  useEffect(() => {
    const normalized = hex.startsWith('#') ? hex : '#' + hex
    if (normalized.toLowerCase() !== color.toLowerCase()) {
      skipFirst.current = true // don't notify parent of their own change
      setColor(normalized)
    }
  }, [hex]) // eslint-disable-line react-hooks/exhaustive-deps

  // Animate in on mobile
  useEffect(() => {
    if (IS_MOBILE) requestAnimationFrame(() => setVisible(true))
  }, [])

  // Notify parent, skip mount
  useEffect(() => {
    if (skipFirst.current) { skipFirst.current = false; return }
    try { onChangeRef.current(color) } catch { /* silent */ }
  }, [color]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click (desktop)
  useEffect(() => {
    if (IS_MOBILE) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) onClose()
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 10)
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await copyToClipboard(color)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { /* silent */ }
  }

  const displayHex = color.replace('#', '').toUpperCase()

  // ── MOBILE: native <input type="color"> — zero pointer event issues on iOS ──
  if (IS_MOBILE) {
    return (
      <div className="fixed inset-0 z-[60]" onClick={onClose}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        <div
          ref={pickerRef}
          className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
            transform: visible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 220ms ease-out',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Close */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Color preview — tap target with hidden native input overlay */}
          <div className="mx-4 mt-2 rounded-xl h-20 border border-gray-100 relative cursor-pointer overflow-hidden" style={{ backgroundColor: color }}>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-white/70 text-xs font-medium tracking-wide uppercase" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>Tap to change</span>
            </div>
          </div>

          {/* Hex display + copy */}
          <div className="flex items-center gap-2 mx-4 mt-3 mb-2">
            <div className="flex-1 flex items-center gap-1 px-3 h-10 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-[12px] text-gray-400 font-mono">#</span>
              <span className="flex-1 text-[14px] font-mono uppercase text-gray-800">{displayHex}</span>
            </div>
            <button
              onClick={handleCopy}
              className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 active:bg-gray-100 shrink-0"
            >
              {copied
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              }
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── DESKTOP: react-colorful floating card ──
  return (
    <div
      ref={pickerRef}
      className="relative w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {/* Close */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {/* Preview */}
      <div className="mx-4 mt-4 rounded-xl h-16 border border-gray-100" style={{ backgroundColor: color }} />

      {/* react-colorful — works great on desktop */}
      <div className="mx-4 mt-3 react-colorful-wrapper">
        <HexColorPicker color={color} onChange={setColor} />
      </div>

      {/* Hex input + copy */}
      <div className="flex items-center gap-2 mx-4 mt-3 mb-4">
        <div className="flex-1 flex items-center gap-1 px-3 h-9 rounded-lg bg-gray-50 border border-gray-200">
          <span className="text-[12px] text-gray-400 font-mono">#</span>
          <input
            value={displayHex}
            onChange={e => {
              const cleaned = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
              if (cleaned.length === 6) setColor('#' + cleaned)
            }}
            onKeyDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            maxLength={6}
            className="flex-1 min-w-0 bg-transparent text-[13px] font-mono uppercase outline-none"
          />
        </div>
        <button
          onClick={handleCopy}
          className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
        >
          {copied
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          }
        </button>
      </div>
    </div>
  )
}
