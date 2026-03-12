import { useCallback, useEffect, useRef, useState } from 'react'
import PaletteCanvas from './components/palette/PaletteCanvas'
import HarmonyPicker from './components/palette/HarmonyPicker'
import CountPicker from './components/palette/CountPicker'
import ExportPanel from './components/palette/ExportPanel'
import { usePaletteStore } from './store/paletteStore'
import { makeSwatch, decodePalette, encodePalette } from './lib/colorEngine'

const BRAND = '#1A73E8'

export default function App() {
  const {
    swatches, harmonyMode, count,
    generate, lockSwatch, editSwatch, reorderSwatches,
    setHarmonyMode, setCount, undo, setSwatches,
  } = usePaletteStore()

  const [shareCopied,  setShareCopied]  = useState(false)
  const [exportOpen,   setExportOpen]   = useState(false)
  const [showHint,     setShowHint]     = useState(false)
  const [helpOpen,     setHelpOpen]     = useState(false)
  const [mobileSheet,  setMobileSheet]  = useState(false)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const isMobile = window.innerWidth < 640
    const seen = localStorage.getItem('paletta-hint')
    if (!isMobile && !seen) {
      setTimeout(() => setShowHint(true), 900)
      setTimeout(() => { setShowHint(false); localStorage.setItem('paletta-hint', '1') }, 4000)
    }
  }, [])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('p')
    if (p) {
      const hexes = decodePalette(p)
      if (hexes) setSwatches(hexes.map(h => makeSwatch(h)))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('p', encodePalette(swatches.map(s => s.hex)))
    window.history.replaceState(null, '', url.toString())
  }, [swatches])

  const triggerGenerate = useCallback(() => {
    if (animRef.current) clearTimeout(animRef.current)
    generate()
  }, [generate])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space')                         { e.preventDefault(); triggerGenerate() }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo() }
      if (e.key === 'Escape')                         { setExportOpen(false); setHelpOpen(false); setMobileSheet(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [triggerGenerate, undo])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch { /* silent */ }
  }

  const lockedCount = swatches.filter(s => s.locked).length

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-white">

      {/* -- Header -- */}
      <header className="flex-none h-12 sm:h-14 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 z-40 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" fill="white" opacity="0.9"/>
              <circle cx="6.5" cy="11.5" r="1.5" fill="#4285F4"/>
              <circle cx="9.5" cy="7.5" r="1.5" fill="#34A853"/>
              <circle cx="14.5" cy="7.5" r="1.5" fill="#FBBC04"/>
              <circle cx="17.5" cy="11.5" r="1.5" fill="#EA4335"/>
            </svg>
          </div>
          <span className="text-[15px] sm:text-[17px] font-semibold text-gray-800 tracking-tight">Paletta</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 sm:px-4 h-9 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-all duration-150"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span className="hidden sm:inline">{shareCopied ? 'Copied!' : 'Share'}</span>
          </button>
          <button
            onClick={() => setExportOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 sm:px-4 h-9 rounded-full text-white text-[13px] font-medium transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: BRAND }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* -- Palette canvas -- */}
      <main className="flex-1 overflow-hidden relative">
        <PaletteCanvas
          swatches={swatches}
          onLock={lockSwatch}
          onEdit={editSwatch}
          onReorder={reorderSwatches}
        />

        {/* Floating Generate button — desktop only */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center gap-2 pointer-events-none">
          {showHint && (
            <div className="px-3 py-1.5 rounded-lg bg-gray-900/90 text-white text-[11px] font-medium tracking-wide whitespace-nowrap pointer-events-none">
              Press <kbd className="mx-1 px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px]">Space</kbd> to generate
            </div>
          )}
          <button
            onClick={triggerGenerate}
            className="pointer-events-auto flex items-center gap-2 px-6 py-3 rounded-full text-white text-[14px] font-semibold tracking-wide shadow-lg hover:shadow-xl transition-all duration-150 active:scale-95"
            style={{ backgroundColor: BRAND }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Generate
          </button>
        </div>
      </main>

      {/* -- Footer -- */}
      <footer
        className="flex-none bg-white border-t border-gray-200 z-30 shrink-0"
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* ─ Desktop footer ─ */}
        <div className="hidden sm:flex h-14 items-center justify-between px-4 gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <button
                onClick={() => setHelpOpen(o => !o)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all text-[13px] font-semibold"
              >
                ?
              </button>
              {helpOpen && (
                <div className="absolute bottom-10 left-0 z-50 w-52 rounded-xl bg-white border border-gray-200 shadow-xl p-4 text-[12px] text-gray-600 leading-relaxed">
                  <div className="font-semibold text-gray-800 mb-2">Shortcuts</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span>Generate</span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[11px]">Space</kbd></div>
                    <div className="flex justify-between"><span>Undo</span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[11px]">Cmd+Z</kbd></div>
                    <div className="flex justify-between"><span>Lock color</span><span className="text-gray-400">Click swatch</span></div>
                    <div className="flex justify-between"><span>Copy hex</span><span className="text-gray-400">Click hex</span></div>
                    <div className="flex justify-between"><span>Edit hex</span><span className="text-gray-400">Double-click</span></div>
                    <div className="flex justify-between"><span>Reorder</span><span className="text-gray-400">Drag handle</span></div>
                  </div>
                  <button className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 text-[13px]" onClick={() => setHelpOpen(false)}>X</button>
                </div>
              )}
            </div>
            {lockedCount > 0 && (
              <span className="text-[12px] font-medium text-gray-400 whitespace-nowrap">
                {lockedCount} locked
              </span>
            )}
          </div>

          <div className="flex-1 flex justify-center min-w-0 overflow-x-auto">
            <HarmonyPicker mode={harmonyMode} onChange={setHarmonyMode} />
          </div>

          <div className="shrink-0">
            <CountPicker count={count} onChange={setCount} />
          </div>
        </div>

        {/* ─ Mobile footer ─ */}
        <div className="flex sm:hidden h-12 items-center justify-between px-3">
          {/* Left: help + locked badge */}
          <div className="flex items-center gap-2 shrink-0 min-w-[60px]">
            <button
              onClick={() => setHelpOpen(o => !o)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all text-[13px] font-semibold"
            >
              ?
            </button>
            {lockedCount > 0 && (
              <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                {lockedCount}
              </span>
            )}
          </div>

          {/* Center: Generate button */}
          <button
            onClick={triggerGenerate}
            className="flex items-center gap-2 px-5 h-9 rounded-full text-white text-[13px] font-semibold tracking-wide shadow-sm active:scale-95 transition-all duration-150"
            style={{ backgroundColor: BRAND }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Generate
          </button>

          {/* Right: Controls button */}
          <div className="flex items-center shrink-0 min-w-[60px] justify-end">
            <button
              onClick={() => setMobileSheet(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all"
              title="Controls"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14"/>
                <line x1="4" y1="10" x2="4" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12" y2="3"/>
                <line x1="20" y1="21" x2="20" y2="16"/>
                <line x1="20" y1="12" x2="20" y2="3"/>
                <line x1="1" y1="14" x2="7" y2="14"/>
                <line x1="9" y1="8" x2="15" y2="8"/>
                <line x1="17" y1="16" x2="23" y2="16"/>
              </svg>
            </button>
          </div>
        </div>
      </footer>

      {/* -- Mobile controls bottom sheet -- */}
      {mobileSheet && (
        <div className="fixed inset-0 z-50 sm:hidden" onClick={() => setMobileSheet(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm sheet-backdrop" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl sheet-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Harmony section */}
            <div className="px-5 pt-3 pb-2">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Harmony</div>
              <HarmonyPicker mode={harmonyMode} onChange={setHarmonyMode} />
            </div>

            {/* Count section */}
            <div className="px-5 pt-2 pb-2">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Colors</div>
              <CountPicker count={count} onChange={setCount} />
            </div>

            {/* Done button */}
            <div className="px-5 pt-2 pb-6">
              <button
                onClick={() => setMobileSheet(false)}
                className="w-full h-11 rounded-full text-white text-[14px] font-semibold transition-all active:scale-95"
                style={{ backgroundColor: BRAND }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {exportOpen && (
        <ExportPanel hexes={swatches.map(s => s.hex)} onClose={() => setExportOpen(false)} />
      )}
    </div>
  )
}
