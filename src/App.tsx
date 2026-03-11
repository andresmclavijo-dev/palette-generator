import { useCallback, useEffect, useRef, useState } from 'react'
import PaletteCanvas from './components/palette/PaletteCanvas'
import HarmonyPicker from './components/palette/HarmonyPicker'
import ShortcutLegend from './components/palette/ShortcutLegend'
import CountPicker from './components/palette/CountPicker'
import ExportPanel from './components/palette/ExportPanel'
import { usePaletteStore } from './store/paletteStore'
import { makeSwatch, decodePalette, encodePalette } from './lib/colorEngine'

export default function App() {
  const {
    swatches, harmonyMode, count,
    generate, lockSwatch, editSwatch,
    setHarmonyMode, setCount, undo, setSwatches,
  } = usePaletteStore()

  const [shareCopied, setShareCopied] = useState(false)
  const [exportOpen,  setExportOpen]  = useState(false)
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── On mount: restore palette from URL ───────────────────────
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('p')
    if (p) {
      const hexes = decodePalette(p)
      if (hexes) setSwatches(hexes.map(h => makeSwatch(h)))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Sync URL on palette change ────────────────────────────────
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('p', encodePalette(swatches.map(s => s.hex)))
    window.history.replaceState(null, '', url.toString())
  }, [swatches])

  // ── Generate ──────────────────────────────────────────────────
  const triggerGenerate = useCallback(() => {
    generate()
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
  }, [generate])

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space')                          { e.preventDefault(); triggerGenerate() }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey))  { e.preventDefault(); undo() }
      if (e.key === 'Escape')                          { setExportOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [triggerGenerate, undo])

  // ── Share ─────────────────────────────────────────────────────
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1600)
    } catch { /* silent */ }
  }

  const lockedCount = swatches.filter(s => s.locked).length

  return (
    <div className="w-screen h-screen overflow-hidden relative select-none">

      {/* ── Palette — constrained above 56px toolbar ── */}
      <div className="absolute inset-0 bottom-14">
        <PaletteCanvas
          swatches={swatches}
          onLock={lockSwatch}
          onEdit={editSwatch}
        />
      </div>

      {/* ── Toolbar — z-30, absorbs all pointer events so nothing below fires ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-14 z-30
          flex items-center justify-between
          bg-black/30 backdrop-blur-md border-t border-white/8 px-3"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        {/* Left: help + count + locked indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <ShortcutLegend />
          <CountPicker count={count} onChange={setCount} />
          {lockedCount > 0 && (
            <span className="text-[10px] font-mono text-white/35 tracking-wider whitespace-nowrap">
              {lockedCount} locked
            </span>
          )}
        </div>

        {/* Center: harmony picker */}
        <HarmonyPicker mode={harmonyMode} onChange={setHarmonyMode} />

        {/* Right: export + share */}
        <div className="flex items-center gap-2 shrink-0">
          <ToolbarBtn onClick={() => setExportOpen(o => !o)}>
            <ExportIcon size={10} /> Export
          </ToolbarBtn>
          <ToolbarBtn onClick={handleShare}>
            <ShareIcon size={10} /> {shareCopied ? 'Copied!' : 'Share'}
          </ToolbarBtn>
        </div>
      </div>

      {/* ── Export panel — modal above everything ── */}
      {exportOpen && (
        <ExportPanel
          hexes={swatches.map(s => s.hex)}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  )
}

function ToolbarBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
        bg-white/10 hover:bg-white/20
        text-white/60 hover:text-white/90
        text-[10px] font-mono tracking-wider
        transition-all duration-150"
    >
      {children}
    </button>
  )
}

function ShareIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}

function ExportIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}
