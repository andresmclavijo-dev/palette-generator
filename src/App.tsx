import { useCallback, useEffect, useState } from 'react'
import Header from './components/palette/Header'
import PaletteCanvas from './components/palette/PaletteCanvas'
import GenerateButton from './components/palette/GenerateButton'
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

  // ── On mount: restore from URL ────────────────────────────────
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('p')
    if (p) {
      const hexes = decodePalette(p)
      if (hexes) setSwatches(hexes.map(h => makeSwatch(h)))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Sync URL ──────────────────────────────────────────────────
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('p', encodePalette(swatches.map(s => s.hex)))
    window.history.replaceState(null, '', url.toString())
  }, [swatches])

  // ── Keyboard shortcuts ────────────────────────────────────────
  const triggerGenerate = useCallback(() => generate(), [generate])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space')                         { e.preventDefault(); triggerGenerate() }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo() }
      if (e.key === 'Escape')                         { setExportOpen(false) }
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
    // 100dvh accounts for mobile browser chrome
    <div className="w-screen h-[100dvh] flex flex-col overflow-hidden bg-white">

      {/* ── Header ── */}
      <Header />

      {/* ── Palette canvas + floating generate button ── */}
      <div className="flex-1 relative overflow-hidden">
        <PaletteCanvas
          swatches={swatches}
          onLock={lockSwatch}
          onEdit={editSwatch}
        />
        <GenerateButton onClick={triggerGenerate} />
      </div>

      {/* ── Toolbar — white, full contrast ── */}
      <footer
        className="h-14 bg-white border-t border-[#E8EAED] shrink-0 z-30
          flex items-center justify-between px-3 sm:px-4 gap-2"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        {/* Left: help + count + locked */}
        <div className="flex items-center gap-2 shrink-0">
          <ShortcutLegend />
          <CountPicker count={count} onChange={setCount} />
          {lockedCount > 0 && (
            <span className="text-[11px] text-[#9AA0A6] whitespace-nowrap hidden sm:block">
              {lockedCount} locked
            </span>
          )}
        </div>

        {/* Center: harmony */}
        <div className="flex-1 flex justify-center overflow-x-auto scrollbar-none px-1">
          <HarmonyPicker mode={harmonyMode} onChange={setHarmonyMode} />
        </div>

        {/* Right: export + share */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ToolbarBtn onClick={() => setExportOpen(o => !o)}>
            <DownloadIcon size={11} />
            <span className="hidden sm:inline">Export</span>
          </ToolbarBtn>
          <ToolbarBtn onClick={handleShare} primary>
            <ShareIcon size={11} />
            <span className="hidden sm:inline">{shareCopied ? 'Copied!' : 'Share'}</span>
          </ToolbarBtn>
        </div>
      </footer>

      {/* ── Export panel ── */}
      {exportOpen && (
        <ExportPanel
          hexes={swatches.map(s => s.hex)}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  )
}

function ToolbarBtn({
  onClick, children, primary = false
}: {
  onClick: () => void
  children: React.ReactNode
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full
        text-[12px] font-medium transition-all duration-150 select-none whitespace-nowrap
        ${primary
          ? 'bg-[#1A73E8] hover:bg-[#1557B0] text-white'
          : 'border border-[#E8EAED] text-[#3C4043] hover:bg-[#F1F3F4]'
        }`}
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

function DownloadIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}