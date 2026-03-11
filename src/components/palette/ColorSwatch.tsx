import { useRef, useState } from 'react'
import { getColorName, isNearWhite, parseHex, readableOn } from '../../lib/colorEngine'
import ShadesPanel from './ShadesPanel'

interface ColorSwatchProps {
  hex: string
  locked: boolean
  index: number
  onLock: () => void
  onEdit: (hex: string) => void
}

export default function ColorSwatch({ hex, locked, index, onLock, onEdit }: ColorSwatchProps) {
  const [editing,    setEditing]    = useState(false)
  const [draft,      setDraft]      = useState('')
  const [copied,     setCopied]     = useState(false)
  const [shadesOpen, setShadesOpen] = useState(false)
  const inputRef                    = useRef<HTMLInputElement>(null)

  const labelColor   = readableOn(hex)
  const nearWhite    = isNearWhite(hex)
  const colorName    = getColorName(hex)
  const labelOpacity = labelColor === '#ffffff' ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.78)'
  const labelMuted   = labelColor === '#ffffff' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.42)'

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch { /* silent */ }
  }

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDraft(hex.replace('#', ''))
    setEditing(true)
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

  return (
    <div
      className="relative flex-1 cursor-pointer group select-none overflow-hidden min-w-0 min-h-0"
      style={{
        backgroundColor: hex,
        boxShadow: nearWhite ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : undefined,
        filter: locked ? 'brightness(0.90)' : undefined,
        transition: 'background-color 0.32s ease, filter 0.15s ease',
      }}
      onClick={() => { if (!editing && !shadesOpen) onLock() }}
      role="button"
      aria-label={locked ? `Unlock ${hex}` : `Lock ${hex}`}
      tabIndex={index}
    >
      {/* Hover sheen */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

      {/* Shades panel */}
      {shadesOpen && <ShadesPanel hex={hex} onClose={() => setShadesOpen(false)} />}

      {/* Lock icon — top center */}
      {!shadesOpen && (
        <div className={`absolute top-5 left-1/2 -translate-x-1/2 z-10 transition-all duration-150 ${
          locked ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-50 group-hover:scale-100'
        }`}>
          {locked ? <LockIcon color={labelOpacity} /> : <UnlockIcon color={labelMuted} />}
        </div>
      )}

      {/* Bottom labels
          pb-20 clears the floating Generate button (≈48px + 16px gap) */}
      {!shadesOpen && (
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-20 gap-[5px] z-10">

          <span className="text-[11px] font-sans tracking-[0.1em] uppercase"
            style={{ color: labelMuted }}>
            {colorName}
          </span>

          <div className="flex items-center gap-[7px]">
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
              <>
                <button
                  className="text-[13px] font-mono font-semibold tracking-widest uppercase transition-colors duration-150"
                  style={{ color: copied ? labelMuted : labelOpacity }}
                  onClick={handleCopy}
                  onDoubleClick={startEdit}
                  title="Click to copy · Double-click to edit"
                >
                  {copied ? '✓ Copied' : hex.toUpperCase()}
                </button>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ color: labelMuted }}
                  onClick={e => { e.stopPropagation(); setShadesOpen(true) }}
                  title="View shades"
                >
                  <ShadesIcon size={13} />
                </button>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ color: labelMuted }}
                  onClick={startEdit}
                  title="Edit hex"
                >
                  <EditIcon size={12} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LockIcon({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}
function UnlockIcon({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  )
}
function ShadesIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="8.5" x2="21" y2="8.5"/>
      <line x1="3" y1="13"  x2="21" y2="13"/>
      <line x1="3" y1="17.5" x2="21" y2="17.5"/>
    </svg>
  )
}
function EditIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}