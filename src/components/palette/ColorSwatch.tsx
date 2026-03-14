import { Component, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { getColorName, getColorInfo, getContrastBadge, isNearWhite, isLight } from '../../lib/colorEngine'
import ShadesPanel from './ShadesPanel'
import ColorPicker from './ColorPicker'
import Tooltip from '../ui/Tooltip'
import type { ActivePanel } from './PaletteCanvas'

const IS_COARSE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

/* ── Error boundary for ColorPicker ── */
interface EBProps { children: ReactNode; fallback: ReactNode }
interface EBState { hasError: boolean }

class PickerErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() { return this.state.hasError ? this.props.fallback : this.props.children }
}

interface ColorSwatchProps {
  hex: string
  locked: boolean
  index: number
  isDragging: boolean
  dedupedName?: string
  onLock: () => void
  onEdit: (hex: string) => void
  onDragStart: () => void
  onCopyToast?: () => void
  activePanel: ActivePanel
  onPanelChange: (panel: ActivePanel) => void
}

export default function ColorSwatch({
  hex, locked, index, isDragging, dedupedName, onLock, onEdit, onDragStart, onCopyToast,
  activePanel, onPanelChange,
}: ColorSwatchProps) {
  const [copied,     setCopied]     = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showHint,   setShowHint]   = useState(false)

  const shadesOpen = activePanel?.type === 'shades' && activePanel.swatchIndex === index
  const pickerOpen = activePanel?.type === 'picker' && activePanel.swatchIndex === index
  const infoOpen   = activePanel?.type === 'info'   && activePanel.swatchIndex === index
  const swatchRef = useRef<HTMLDivElement>(null)

  const lightBg    = isLight(hex)
  const nearWhite  = isNearWhite(hex)
  const colorName  = dedupedName || getColorName(hex)
  const staggerDelay = locked ? '0ms' : `${index * 40}ms`
  const iconColor  = lightBg ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)'
  const labelColor = lightBg ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.92)'
  const labelMuted = lightBg ? 'rgba(0,0,0,0.42)' : 'rgba(255,255,255,0.55)'
  const lockShadow = 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))'
  const contrast = getContrastBadge(hex)

  // Onboarding tooltip — mobile only, first swatch, first visit
  useEffect(() => {
    if (!IS_COARSE || index !== 0) return
    const seen = localStorage.getItem('paletta-tap-hint')
    if (seen) return
    const timer = setTimeout(() => setShowHint(true), 1200)
    const dismiss = setTimeout(() => {
      setShowHint(false)
      localStorage.setItem('paletta-tap-hint', '1')
    }, 4500)
    return () => { clearTimeout(timer); clearTimeout(dismiss) }
  }, [index])

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

  // Close info popover on outside tap
  useEffect(() => {
    if (!infoOpen) return
    const handler = (e: PointerEvent) => {
      if (swatchRef.current && !swatchRef.current.contains(e.target as Node)) {
        onPanelChange(null)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [infoOpen, onPanelChange])

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(true)
      onCopyToast?.()
      setTimeout(() => setCopied(false), 1400)
    } catch { /* silent */ }
  }

  const handleDesktopClick = () => {
    if (activePanel) { onPanelChange(null); return }
    onLock()
    if (showHint) {
      setShowHint(false)
      localStorage.setItem('paletta-tap-hint', '1')
    }
  }

  const handleDragPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onDragStart()
  }

  const handleOpenShades = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPanelChange({ type: 'shades', swatchIndex: index })
    setShowActions(false)
  }

  const handleOpenPicker = (e: React.MouseEvent) => {
    try {
      e.stopPropagation()
      onPanelChange({ type: 'picker', swatchIndex: index })
      setShowActions(false)
    } catch (err) { console.error('Failed to open picker:', err) }
  }

  const handleHexDoubleClick = (e: React.MouseEvent) => {
    try {
      e.stopPropagation()
      onPanelChange({ type: 'picker', swatchIndex: index })
      setShowActions(false)
    } catch (err) { console.error('Failed to open picker:', err) }
  }

  const handleToggleInfo = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPanelChange(infoOpen ? null : { type: 'info', swatchIndex: index })
  }

  const handleMobileLock = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLock()
  }

  // Desktop hover action bar classes
  const barHoverClass = !IS_COARSE
    ? 'group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto'
    : ''

  // Color picker — mobile renders as fixed bottom sheet (handled by ColorPicker internally)
  // Desktop renders as floating card positioned inside the swatch
  const pickerDesktop = pickerOpen && !IS_COARSE && (
    <div
      className="absolute z-50 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
      onClick={e => e.stopPropagation()}
    >
      <PickerErrorBoundary fallback={
        <div className="w-[280px] bg-white rounded-2xl shadow-xl border border-gray-100 p-6 text-center text-sm text-gray-500">
          Color picker unavailable
          <button onClick={() => onPanelChange(null)} className="block mx-auto mt-3 text-[#1A73E8] text-xs font-medium">Close</button>
        </div>
      }>
        <ColorPicker
          hex={hex}
          onChange={onEdit}
          onClose={() => onPanelChange(null)}
        />
      </PickerErrorBoundary>
    </div>
  )

  // Mobile picker — rendered outside the overflow-hidden swatch via fixed positioning
  const pickerMobile = pickerOpen && IS_COARSE && (
    <PickerErrorBoundary fallback={
      <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => onPanelChange(null)}>
        <div className="w-full bg-white rounded-t-2xl p-6 text-center text-sm text-gray-500" onClick={e => e.stopPropagation()}>
          Color picker unavailable
          <button onClick={() => onPanelChange(null)} className="block mx-auto mt-3 text-[#1A73E8] text-xs font-medium">Close</button>
        </div>
      </div>
    }>
      <ColorPicker
        hex={hex}
        onChange={onEdit}
        onClose={() => onPanelChange(null)}
      />
    </PickerErrorBoundary>
  )

  // Info popover
  const infoPopover = infoOpen && (() => {
    const info = getColorInfo(hex)
    return (
      <div
        className="absolute z-50 left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 sm:top-auto sm:bottom-24"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-4 text-[12px]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-gray-800 text-[13px]">{colorName || 'Color'}</span>
            <button onClick={() => onPanelChange(null)} className="text-gray-400 hover:text-gray-600 text-[14px]">✕</button>
          </div>
          <div className="space-y-1.5 text-gray-600 font-mono">
            <div className="flex justify-between"><span className="text-gray-400 font-sans">HEX</span><span>{hex.toUpperCase()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400 font-sans">RGB</span><span>{info.rgb}</span></div>
            <div className="flex justify-between"><span className="text-gray-400 font-sans">HSL</span><span>{info.hsl}</span></div>
          </div>
        </div>
      </div>
    )
  })()

  /* ── MOBILE layout (< 640px) ── horizontal inline row ── */
  const mobileLayout = (
    <div
      ref={swatchRef}
      className="sm:hidden relative flex-1 min-h-0 flex items-center select-none overflow-hidden"
      style={{
        backgroundColor: hex,
        boxShadow: nearWhite ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : undefined,
        transition: 'background-color 300ms cubic-bezier(.4,0,.2,1)',
        transitionDelay: staggerDelay,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 20 : undefined,
      }}
    >
      {/* Dark overlay when locked */}
      {locked && (
        <div className="absolute inset-0 pointer-events-none z-[1]" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }} />
      )}

      {shadesOpen && <ShadesPanel hex={hex} onClose={() => onPanelChange(null)} />}
      {pickerMobile}
      {infoPopover}

      {/* Left: drag handle + color name */}
      <div className="flex items-center gap-1 pl-1 z-10 min-w-0 shrink-0" style={{ maxWidth: '40%' }}>
        <div
          className="w-9 h-9 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0"
          style={{ color: iconColor, touchAction: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          onPointerDown={handleDragPointerDown}
        >
          <GripIcon color="currentColor" />
        </div>
        <span
          className="text-[10px] font-sans tracking-[0.06em] uppercase truncate min-w-0"
          style={{ color: labelMuted }}
        >
          {colorName}
        </span>
      </div>

      {/* Center: hex value — tap opens picker on mobile */}
      <div className="flex-1 flex justify-center z-10 min-w-0">
        <button
          className="text-[14px] font-mono font-bold tracking-wider uppercase truncate"
          style={{ color: labelColor }}
          onClick={(e) => { e.stopPropagation(); onPanelChange({ type: 'picker', swatchIndex: index }) }}
        >
          {copied ? 'Copied' : hex.toUpperCase()}
        </button>
      </div>

      {/* Right: 4 icon buttons */}
      <div className="flex items-center gap-0 pr-1 z-10 shrink-0">
        <button
          onClick={handleOpenShades}
          className="w-11 h-11 flex items-center justify-center"
          style={{ color: iconColor }}
          aria-label="Shades"
        >
          <ShadesIcon size={18} />
        </button>
        <button
          onClick={handleCopy}
          className="w-11 h-11 flex items-center justify-center"
          style={{ color: iconColor }}
          aria-label="Copy"
        >
          {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
        </button>
        <button
          onClick={handleToggleInfo}
          className="w-11 h-11 flex items-center justify-center"
          style={{ color: iconColor }}
          aria-label="Info"
        >
          <InfoIcon size={18} />
        </button>
        <button
          onClick={handleMobileLock}
          className="w-11 h-11 flex items-center justify-center"
          style={{ color: iconColor }}
          aria-label={locked ? 'Unlock' : 'Lock'}
        >
          {locked ? <LockedFilledIcon size={18} color={iconColor} /> : <UnlockIcon size={18} color={iconColor} />}
        </button>
      </div>

      {/* WCAG contrast badge */}
      {!shadesOpen && !pickerOpen && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/20 text-white`}>
            {contrast.ratio}:1 {contrast.pass ? (
              <span className="text-green-300">{contrast.level} ✓</span>
            ) : (
              <span className="text-red-300">✗</span>
            )}
          </span>
        </div>
      )}

      {/* Onboarding hint */}
      {showHint && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none onboarding-tooltip">
          <div className="px-4 py-2 rounded-xl bg-gray-900/90 text-white text-[12px] font-medium whitespace-nowrap shadow-lg">
            Tap lock to keep a color
          </div>
        </div>
      )}
    </div>
  )

  /* ── DESKTOP layout (≥ 640px) ── centered vertical ── */
  const desktopLayout = (
    <div
      ref={swatchRef}
      className="hidden sm:block relative flex-1 cursor-pointer group select-none overflow-hidden min-w-0 min-h-0"
      style={{
        backgroundColor: hex,
        boxShadow: nearWhite ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : undefined,
        transition: `background-color 300ms cubic-bezier(.4,0,.2,1) ${staggerDelay}, filter 0.15s ease`,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 20 : undefined,
      }}
      onClick={handleDesktopClick}
      role="button"
      aria-label={locked ? `Unlock ${hex}` : `Lock ${hex}`}
    >
      {/* Hover sheen */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
      />

      {locked && (
        <div className="absolute inset-0 pointer-events-none z-[1] transition-opacity duration-200" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }} />
      )}

      {shadesOpen && <ShadesPanel hex={hex} onClose={() => onPanelChange(null)} />}
      {pickerDesktop}
      {infoPopover}

      {/* Drag handle — top right */}
      {!shadesOpen && !pickerOpen && (
        <div
          className="absolute right-3 top-3 z-10
            opacity-0 group-hover:opacity-70 hover:!opacity-100
            transition-opacity duration-150 cursor-grab active:cursor-grabbing
            w-11 h-11 flex items-center justify-center rounded-full"
          style={{ color: iconColor, touchAction: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          onPointerDown={handleDragPointerDown}
          aria-label="Drag to reorder"
        >
          <GripIcon color="currentColor" />
        </div>
      )}

      {/* Lock icon — top center */}
      {!shadesOpen && !pickerOpen && (
        <div
          className={`absolute top-5 left-1/2 -translate-x-1/2 z-10 transition-all duration-200 ${
            locked ? 'opacity-100 scale-110' : 'opacity-0 scale-90 group-hover:opacity-50 group-hover:scale-100'
          }`}
          style={{ filter: lockShadow }}
        >
          {locked ? <LockedFilledIcon /> : <UnlockIcon />}
        </div>
      )}

      {/* Action bar + labels */}
      {!shadesOpen && !pickerOpen && (
        <div className="absolute inset-0 flex flex-col items-center z-10 pointer-events-none">
          <div className="flex-1 min-h-[40px]" />

          {/* Desktop hover action bar */}
          <div
            className={`flex items-center bg-white rounded-full shadow-md overflow-hidden pointer-events-auto shrink-0
              transition-all duration-150 ease-out opacity-0 translate-y-2 pointer-events-none
              ${barHoverClass}
            `}
            onClick={e => e.stopPropagation()}
          >
            <Tooltip text="Copy hex">
              <button onClick={handleCopy} className="flex items-center justify-center w-12 h-12 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors" aria-label="Copy hex code">
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </Tooltip>
            <div className="w-px h-5 bg-gray-200" />
            <Tooltip text="View shades" disabled={shadesOpen}>
              <button onClick={handleOpenShades} className="flex items-center justify-center w-12 h-12 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors" aria-label="View shades">
                <ShadesIcon />
              </button>
            </Tooltip>
            <div className="w-px h-5 bg-gray-200" />
            <Tooltip text="Color info" disabled={infoOpen}>
              <button onClick={handleToggleInfo} className="flex items-center justify-center w-12 h-12 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors" aria-label="Color info">
                <InfoIcon />
              </button>
            </Tooltip>
            <div className="w-px h-5 bg-gray-200" />
            <Tooltip text="Edit color" disabled={pickerOpen}>
              <button onClick={handleOpenPicker} className="flex items-center justify-center w-12 h-12 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors" aria-label="Edit color">
                <EditIcon />
              </button>
            </Tooltip>
          </div>

          <div className="h-3 shrink-0" />

          {/* Labels */}
          <div className={`flex flex-col items-center gap-[5px] shrink-0 pointer-events-auto pb-20`}>
            <span className="text-[12px] font-sans tracking-[0.12em] uppercase truncate max-w-full px-2" style={{ color: labelMuted }}>
              {colorName}
            </span>
            <button
              className="text-[16px] font-mono font-bold tracking-widest uppercase transition-colors duration-150"
              style={{ color: labelColor }}
              onClick={handleCopy}
              onDoubleClick={handleHexDoubleClick}
              aria-label="Click to copy, double-click to edit"
            >
              {copied ? 'Copied' : hex.toUpperCase()}
            </button>
            {/* WCAG contrast badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/20 text-white mt-1`}>
              {contrast.ratio}:1 {contrast.pass ? (
                <span className="text-green-300">{contrast.level} ✓</span>
              ) : (
                <span className="text-red-300">✗</span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {mobileLayout}
      {desktopLayout}
    </>
  )
}

/* ── Icons ── */

function GripIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color} stroke="none">
      <circle cx="9" cy="5" r="1.8"/><circle cx="15" cy="5" r="1.8"/>
      <circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/>
      <circle cx="9" cy="19" r="1.8"/><circle cx="15" cy="19" r="1.8"/>
    </svg>
  )
}

function LockedFilledIcon({ size = 20, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" fill={color} stroke={color} strokeWidth="1.5"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke={color} strokeWidth="1.5"/>
    </svg>
  )
}

function UnlockIcon({ size = 18, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" fill={color} stroke={color} strokeWidth="1.5"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1" fill="none" stroke={color} strokeWidth="1.5"/>
    </svg>
  )
}

function CopyIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

function CheckIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function ShadesIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="8.5" x2="21" y2="8.5"/><line x1="3" y1="13" x2="21" y2="13"/><line x1="3" y1="17.5" x2="21" y2="17.5"/>
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

function InfoIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  )
}
