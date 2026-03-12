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
      if (e.key === 'Escape')                         { setExportOpen(false); setHelpOpen(false) }
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

      {/* -- Harmony tab bar -- */}
      <div
        className="flex-none h-12 bg-white border-b border-gray-200 flex items-center px-3 sm:px-4 z-30 shrink-0 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <HarmonyPicker mode={harmonyMode} onChange={setHarmonyMode} />
      </div>

      {/* -- Palette canvas -- */}
      <main className="flex-1 overflow-hidden relative pb-[72px] sm:pb-0">
        <PaletteCanvas
          swatches={swatches}
          onLock={lockSwatch}
          onEdit={editSwatch}
          onReorder={reorderSwatches}
        />

        {/* Floating help button — bottom left (desktop only) */}
        <div className="absolute floating-bottom left-4 z-20 hidden sm:block">
          <div className="relative">
            <button
              onClick={() => setHelpOpen(o => !o)}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-lg transition-all text-[15px] font-semibold"
            >
              ?
            </button>
            {helpOpen && (
              <div className="absolute bottom-12 left-0 z-50 w-52 rounded-xl bg-white border border-gray-200 shadow-xl p-4 text-[12px] text-gray-600 leading-relaxed">
                <div className="font-semibold text-gray-800 mb-2">Shortcuts</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span>Generate</span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[11px]">Space</kbd></div>
                  <div className="flex justify-between"><span>Undo</span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[11px]">Cmd+Z</kbd></div>
                  <div className="flex justify-between"><span>Lock color</span><span className="text-gray-400">Click swatch</span></div>
                  <div className="flex justify-between"><span>Copy hex</span><span className="text-gray-400">Click hex</span></div>
                  <div className="flex justify-between"><span>Edit color</span><span className="text-gray-400">Double-click hex</span></div>
                  <div className="flex justify-between"><span>Reorder</span><span className="text-gray-400">Drag handle</span></div>
                </div>
                <button className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 text-[13px]" onClick={() => setHelpOpen(false)}>X</button>
              </div>
            )}
          </div>
        </div>

        {/* Floating Generate button — bottom center (desktop only) */}
        <div className="absolute floating-bottom left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center gap-2 pointer-events-none">
          {showHint && (
            <div className="px-3 py-1.5 rounded-lg bg-gray-900/90 text-white text-[11px] font-medium tracking-wide whitespace-nowrap pointer-events-none">
              Press <kbd className="mx-1 px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px]">Space</kbd> to generate
            </div>
          )}
          <button
            onClick={triggerGenerate}
            className="pointer-events-auto flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-white text-[13px] sm:text-[14px] font-semibold tracking-wide shadow-lg hover:shadow-xl transition-all duration-150 active:scale-95"
            style={{ backgroundColor: BRAND }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Generate
          </button>
        </div>

        {/* Floating count picker — bottom right (desktop only) */}
        <div className="absolute floating-bottom right-4 z-20 hidden sm:block">
          <div className="bg-white shadow-md rounded-full px-2 py-1">
            <CountPicker count={count} onChange={setCount} />
          </div>
        </div>
      </main>

      {/* -- Mobile footer -- */}
      <footer
        className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-gray-200 z-40 flex items-center justify-between px-2"
        style={{ height: `calc(56px + max(env(safe-area-inset-bottom, 0px), 16px))`, paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        {/* Help */}
        <div className="relative">
          <button
            onClick={() => setHelpOpen(o => !o)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all text-[15px] font-semibold"
          >
            ?
          </button>
          {helpOpen && (
            <div className="absolute bottom-12 left-0 z-50 w-52 rounded-xl bg-white border border-gray-200 shadow-xl p-4 text-[12px] text-gray-600 leading-relaxed">
              <div className="font-semibold text-gray-800 mb-2">Shortcuts</div>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span>Generate</span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[11px]">Space</kbd></div>
                <div className="flex justify-between"><span>Undo</span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[11px]">Cmd+Z</kbd></div>
                <div className="flex justify-between"><span>Lock color</span><span className="text-gray-400">Tap lock icon</span></div>
                <div className="flex justify-between"><span>Copy hex</span><span className="text-gray-400">Tap hex</span></div>
              </div>
              <button className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 text-[13px]" onClick={() => setHelpOpen(false)}>X</button>
            </div>
          )}
        </div>

        {/* Undo */}
        <button
          onClick={undo}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all"
          title="Undo"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>

        {/* Generate */}
        <button
          onClick={triggerGenerate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-[13px] font-semibold tracking-wide shadow-md active:scale-95 transition-all"
          style={{ backgroundColor: BRAND }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Generate
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all"
          title={shareCopied ? 'Copied!' : 'Share'}
        >
          {shareCopied ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          )}
        </button>

        {/* Count picker */}
        <CountPicker count={count} onChange={setCount} />
      </footer>

      {exportOpen && (
        <ExportPanel hexes={swatches.map(s => s.hex)} onClose={() => setExportOpen(false)} />
      )}
    </div>
  )
}
