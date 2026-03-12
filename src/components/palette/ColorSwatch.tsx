import { useEffect, useRef, useState } from 'react'
import { getColorName, isNearWhite, parseHex, readableOn } from '../../lib/colorEngine'
import ShadesPanel from './ShadesPanel'

const IS_COARSE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

interface ColorSwatchProps {
  hex: string
  locked: boolean
  index: number
  isLast: boolean
  isDragging: boolean
  onLock: () => void
  onEdit: (hex: string) => void
  onDragStart: () => void
}

export default function ColorSwatch({
  hex, locked, index, isLast, isDragging, onLock, onEdit, onDragStart,
}: ColorSwatchProps) {
  const [editing,     setEditing]     = useState(false)
  const [draft,       setDraft]       = useState('')
  const [copied,      setCopied]      = useState(false)
  const [shadesOpen,  setShadesOpen]  = useState(false)
  const [showActions, setShowActions] = useState(false)
  const inputRef  = useRef<HTMLInputElement>(null)
  const swatchRef = useRef<HTMLDivElement>(null)

  const labelColor   = readableOn(hex)
  const nearWhite    = isNearWhite(hex)
  const colorName    = getColorName(hex)
  const labelOpacity = labelColor === '#ffffff' ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.78)'
  const labelMuted   = labelColor === '#ffffff' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.42)'

  // Dismiss action bar on outside tap (mobile)
  useEffect(() => {
    if (!showActions || !IS_COARSE) return
    const handler = (e: PointerEvent) => {
      if (swatchRef.current && !swatchRef.current.contains(e.target as Node)) {
        setShowActions(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [showActions])

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch { /* silent */ }
  }

  const startEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setDraft(hex.replace('#', ''))
    setEditing(true)
    setShowActions(false)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commitEdit = () => {
    const parsed = parseHex(draft)
    if (parsed) onEdit(parsed)
    setEditing(false)
  }

  const handleInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter')  commitEdit()
    if (e.key === 'Escape') setEditing(false)
    e.stopPropagation()
  }

  const handleSwatchClick = () => {
    if (editing || shadesOpen) return
    if (IS_COARSE) {
      if (showActions) {
        onLock()
        setShowActions(false)
      } else {
        setShowActions(true)
      }
    } else {
      onLock()
    }
  }

  const handleDragPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onDragStart()
  }

  const handleOpenShades = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShadesOpen(true)
    setShowActions(false)
  }

  // Action bar visibility
  const barShow = IS_COARSE ? (showActions && !editing && !shadesOpen) : false
  const barHoverClass = !IS_COARSE
    ? 'group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'
    : ''

  return (
    <div
      ref={swatchRef}
      className="relative flex-1 cursor-pointer group select-none overflow-hidden min-w-0 min-h-0"
      style={{
        backgroundColor: hex,
        boxShadow: nearWhite ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : undefined,
        filter: locked ? 'brightness(0.90)' : undefined,
        transition: 'background-color 0.4s cubic-bezier(.4,0,.2,1), filter 0.15s ease',
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 20 : undefined,
      }}
      onClick={handleSwatchClick}
      role="button"
      aria-label={locked ? `Unlock ${hex}` : `Lock ${hex}`}
      tabIndex={index}
    >
      {/* Hover sheen */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
      />

      {/* Shades panel */}
      {shadesOpen && <ShadesPanel hex={hex} onClose={() => setShadesOpen(false)} />}

      {/* Drag handle — left on mobile, right on desktop */}
      {!shadesOpen && (
        <div
          className="absolute top-2 left-2 sm:left-auto sm:right-3 sm:top-3 z-10
            opacity-40 sm:opacity-0 sm:group-hover:opacity-60 sm:hover:!opacity-100
            transition-opacity duration-150 cursor-grab active:cursor-grabbing
            w-11 h-11 flex items-center justify-center rounded-full"
          style={{ color: labelOpacity, touchAction: 'none' }}
          onPointerDown={handleDragPointerDown}
          title="Drag to reorder"
        >
          <GripIcon color="currentColor" />
        </div>
      )}

      {/* Lock icon — top center */}
      {!shadesOpen && (
        <div className={`absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 z-10 transition-all duration-150 ${
          locked
            ? 'opacity-100 scale-100'
            : IS_COARSE
              ? (showActions ? 'opacity-50 scale-100' : 'opacity-0 scale-90')
              : 'opacity-0 scale-90 group-hover:opacity-50 group-hover:scale-100'
        }`}>
          {locked ? <LockIcon color={labelOpacity} /> : <UnlockIcon color={labelMuted} />}
        </div>
      )}

      {/* Bottom: action bar + labels */}
      {!shadesOpen && (
        <div className={`absolute bottom-0 left-0 right-0 flex flex-col items-center gap-[5px] z-10
          ${isLast ? 'pb-[80px] sm:pb-20' : 'pb-4 sm:pb-20'}`}>

          {/* Floating action bar — pill */}
          {!editing && (
            <div
              className={`flex items-center bg-white rounded-full shadow-md overflow-hidden
                transition-all duration-150 mb-1
                ${barShow ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                ${barHoverClass}
              `}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={handleCopy}
                className="flex items-center justify-center w-11 h-11 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                title="Copy hex"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
              <div className="w-px h-5 bg-gray-200" />
              <button
                onClick={handleOpenShades}
                className="flex items-center justify-center w-11 h-11 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                title="View shades"
              >
                <ShadesIcon />
              </button>
              <div className="w-px h-5 bg-gray-200" />
              <button
                onClick={startEdit}
                className="flex items-center justify-center w-11 h-11 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                title="Edit hex"
              >
                <EditIcon />
              </button>
            </div>
          )}

          {/* Color name */}
          <span
            className="text-[10px] sm:text-[11px] font-sans tracking-[0.1em] uppercase truncate max-w-full px-2"
            style={{ color: labelMuted }}
          >
            {colorName}
          </span>

          {/* Hex value / editor */}
          <div className="flex items-center">
            {editing ? (
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <span className="text-[11px] font-mono" style={{ color: labelMuted }}>#</span>
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleInputKey}
                  maxLength={6}
                  className="w-[66px] bg-transparent border-b text-[13px] font-mono tracking-widest uppercase text-center outline-none caret-current"
                  style={{ color: labelOpacity, borderColor: labelMuted }}
                />
              </div>
            ) : (
              <button
                className="text-[12px] sm:text-[13px] font-mono font-semibold tracking-widest uppercase transition-colors duration-150
                  min-h-[44px] sm:min-h-0 flex items-center"
                style={{ color: labelOpacity }}
                onClick={handleCopy}
                onDoubleClick={startEdit}
                title="Click to copy"
              >
                {copied ? 'Copied' : hex.toUpperCase()}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Icons — consistent 18px / stroke-width 1.5 for chrome, 20px for actions ── */

function GripIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color} stroke="none">
      <circle cx="9" cy="5" r="1.8"/>
      <circle cx="15" cy="5" r="1.8"/>
      <circle cx="9" cy="12" r="1.8"/>
      <circle cx="15" cy="12" r="1.8"/>
      <circle cx="9" cy="19" r="1.8"/>
      <circle cx="15" cy="19" r="1.8"/>
    </svg>
  )
}

function LockIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function UnlockIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function ShadesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="8.5" x2="21" y2="8.5"/>
      <line x1="3" y1="13" x2="21" y2="13"/>
      <line x1="3" y1="17.5" x2="21" y2="17.5"/>
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
