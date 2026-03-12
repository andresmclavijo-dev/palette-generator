import { useEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { parseHex } from '../../lib/colorEngine'

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 640

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
  const [color, setColor] = useState(hex)
  const [draft, setDraft] = useState(hex.replace('#', ''))
  const [copied, setCopied] = useState(false)
  const [visible, setVisible] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const skipNotify = useRef(true)

  // Animate in on mobile
  useEffect(() => {
    if (IS_MOBILE) requestAnimationFrame(() => setVisible(true))
  }, [])

  // Sync draft text when picker color changes
  useEffect(() => {
    setDraft(color.replace('#', ''))
  }, [color])

  // Notify parent — skip initial render
  useEffect(() => {
    if (skipNotify.current) { skipNotify.current = false; return }
    try { onChange(color) } catch { /* silent */ }
  }, [color, onChange])

  // Close on outside mousedown — uses contains() check
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 10)
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Real-time hex input sync
  const handleDraftChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
    setDraft(cleaned)
    if (cleaned.length === 6) {
      const parsed = parseHex(cleaned)
      if (parsed) setColor(parsed.toLowerCase())
    }
  }

  const commitHex = () => {
    const parsed = parseHex(draft)
    if (!parsed) return
    setColor(parsed.toLowerCase())
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await copyToClipboard(color)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { /* silent */ }
  }

  const pickerContent = (
    <>
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

      {/* Color preview */}
      <div
        className="mx-4 mt-4 rounded-xl h-16 border border-gray-100"
        style={{ backgroundColor: color }}
      />

      {/* react-colorful hex picker — no HSL conversion needed */}
      <div className="mx-4 mt-3 react-colorful-wrapper">
        <HexColorPicker color={color} onChange={setColor} />
      </div>

      {/* Hex input + copy */}
      <div className="flex items-center gap-2 mx-4 mt-3 mb-4">
        <div className="flex-1 flex items-center gap-1 px-3 h-9 rounded-lg bg-gray-50 border border-gray-200">
          <span className="text-[12px] text-gray-400 font-mono">#</span>
          <input
            value={draft}
            onChange={e => handleDraftChange(e.target.value)}
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
    </>
  )

  // Mobile — fixed bottom sheet
  if (IS_MOBILE) {
    return (
      <div
        className="fixed inset-0 z-[60]"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm sheet-backdrop" />
        <div
          ref={pickerRef}
          className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl overflow-hidden"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
            transform: visible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 200ms ease-out',
          }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
          {pickerContent}
        </div>
      </div>
    )
  }

  // Desktop — floating card
  return (
    <div
      ref={pickerRef}
      className="relative w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      {pickerContent}
    </div>
  )
}
