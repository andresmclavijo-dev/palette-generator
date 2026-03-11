import { useRef, useState } from 'react'
import { isNearWhite, parseHex, readableOn } from '../../lib/colorEngine'

interface ColorSwatchProps {
  hex: string
  locked: boolean
  index: number
  onLock: () => void
  onEdit: (hex: string) => void
}

export default function ColorSwatch({ hex, locked, index, onLock, onEdit }: ColorSwatchProps) {
  const [editing, setEditing]   = useState(false)
  const [draft, setDraft]       = useState('')
  const [copied, setCopied]     = useState(false)
  const inputRef                = useRef<HTMLInputElement>(null)

  const labelColor  = readableOn(hex)
  const nearWhite   = isNearWhite(hex)

  // ── Inline edit ──────────────────────────────────────────────
  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDraft(hex.replace('#', ''))
    setEditing(true)
    setTimeout(() => {
      inputRef.current?.select()
    }, 0)
  }

  const commitEdit = () => {
    const parsed = parseHex(draft)
    if (parsed) onEdit(parsed)
    setEditing(false)
  }

  const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') setEditing(false)
    e.stopPropagation() // prevent spacebar from firing regenerate
  }

  // ── Copy ─────────────────────────────────────────────────────
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch { /* silent */ }
  }

  // ── Lock (swatch body click) ──────────────────────────────────
  const handleSwatchClick = () => {
    if (!editing) onLock()
  }

  return (
    <div
      className="relative flex-1 flex flex-col justify-end cursor-pointer group select-none"
      style={{
        backgroundColor: hex,
        // Near-white swatches get an inset border so the edge is visible
        boxShadow: nearWhite ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : undefined,
        // Dimmed when locked — subtle, not dramatic
        filter: locked ? 'brightness(0.92)' : undefined,
        transition: 'filter 0.15s ease',
      }}
      onClick={handleSwatchClick}
      role="button"
      aria-label={locked ? `Unlock ${hex}` : `Lock ${hex}`}
      tabIndex={index}
    >

      {/* Hover brightness lift */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
      />

      {/* Lock indicator — top-center, appears on hover OR when locked */}
      <div
        className={`
          absolute top-5 left-1/2 -translate-x-1/2
          transition-all duration-150
          ${locked
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-90 group-hover:opacity-60 group-hover:scale-100'
          }
        `}
        style={{ color: labelColor }}
      >
        {locked ? <LockIcon /> : <UnlockIcon />}
      </div>

      {/* Bottom label bar */}
      <div
        className="relative z-10 flex items-center justify-center gap-2 pb-5"
        style={{ color: labelColor }}
      >
        {editing ? (
          /* ── Inline hex input ── */
          <div
            className="flex items-center gap-1"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-xs font-mono opacity-60">#</span>
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleInputKey}
              maxLength={6}
              className="
                w-20 bg-transparent border-b border-current
                text-xs font-mono font-medium tracking-widest uppercase text-center
                outline-none caret-current
              "
              style={{ color: labelColor }}
            />
          </div>
        ) : (
          /* ── Hex label + copy ── */
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-mono font-medium tracking-widest uppercase opacity-75 group-hover:opacity-100 transition-opacity"
              onClick={startEdit}
            >
              {hex.toUpperCase()}
            </span>
            <button
              className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity"
              onClick={handleCopy}
              aria-label="Copy hex"
            >
              {copied ? <CheckIcon size={11} color={labelColor} /> : <CopyIcon size={11} color={labelColor} />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Micro icons — inline SVG so no icon lib needed ──────────────

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function UnlockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  )
}

function CopyIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

function CheckIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

