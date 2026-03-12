import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PaletteCanvas from './components/palette/PaletteCanvas'
import type { ActivePanel } from './components/palette/PaletteCanvas'
import HarmonyPicker from './components/palette/HarmonyPicker'
import CountPicker from './components/palette/CountPicker'
import ExportPanel from './components/palette/ExportPanel'
import AiPrompt from './components/palette/AiPrompt'
import ImagePalette from './components/palette/ImagePalette'
import VisionSimulator, { VisionFilterDefs } from './components/palette/VisionSimulator'
import type { VisionMode } from './components/palette/VisionSimulator'
import ToolsSheet from './components/palette/ToolsSheet'
import ProUpgradeModal from './components/ui/ProUpgradeModal'
import SignInModal from './components/ui/SignInModal'
import PaymentSuccessModal from './components/ui/PaymentSuccessModal'
import MobileDrawer from './components/ui/MobileDrawer'
import Tooltip from './components/ui/Tooltip'
import { usePro } from './hooks/usePro'
import { useAuth } from './hooks/useAuth'
import { usePaletteStore } from './store/paletteStore'
import { makeSwatch, decodePalette, encodePalette, getColorName } from './lib/colorEngine'

const BRAND = '#1A73E8'
const FREE_COUNTS = [3, 4, 5]

export default function App() {
  const { isPro, showPaymentModal, setShowPaymentModal } = usePro()
  const { user, isSignedIn, signInWithGoogle, signOut } = useAuth()
  const {
    swatches, harmonyMode, count,
    generate, lockSwatch, editSwatch, reorderSwatches,
    setHarmonyMode, setCount, undo, setSwatches,
  } = usePaletteStore()

  const [shareCopied,  setShareCopied]  = useState(false)
  const [exportOpen,   setExportOpen]   = useState(false)
  const [showHint,     setShowHint]     = useState(false)
  const [helpOpen,     setHelpOpen]     = useState(false)
  const [aiOpen,       setAiOpen]       = useState(false)
  const [visionMode,   setVisionMode]   = useState<VisionMode>('normal')
  const [proModalOpen, setProModalOpen] = useState(false)
  const [toolsOpen,    setToolsOpen]    = useState(false)
  const [saveToast,    setSaveToast]    = useState('')
  const [proToolsOpen, setProToolsOpen] = useState(false)
  const [copyToast,    setCopyToast]    = useState(false)
  const [signInOpen,   setSignInOpen]   = useState(false)
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [avatarOpen,   setAvatarOpen]   = useState(false)
  const [activePanel,  setActivePanel]  = useState<ActivePanel>(null)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const proToolsBtnRef = useRef<HTMLButtonElement>(null)
  const proToolsDropRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const [proToolsPos, setProToolsPos] = useState({ top: 0, left: 0 })

  const openProModal = useCallback(() => setProModalOpen(true), [])

  // Auto-close Pro modal when user becomes Pro
  useEffect(() => {
    if (isPro) setProModalOpen(false)
  }, [isPro])

  const showCopyToast = useCallback(() => {
    setCopyToast(true)
    setTimeout(() => setCopyToast(false), 1500)
  }, [])

  const handlePanelChange = useCallback((panel: ActivePanel) => {
    setActivePanel(panel)
    if (panel) setHelpOpen(false)
  }, [])

  // Close Pro Tools dropdown on outside click
  useEffect(() => {
    if (!proToolsOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        proToolsBtnRef.current?.contains(target) ||
        proToolsDropRef.current?.contains(target)
      ) return
      setProToolsOpen(false)
    }
    // Delay listener attachment so the opening click doesn't immediately close
    const raf = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handler)
    })
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousedown', handler)
    }
  }, [proToolsOpen])

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!avatarOpen) return
    const handler = (e: MouseEvent) => {
      if (avatarRef.current?.contains(e.target as Node)) return
      setAvatarOpen(false)
    }
    const raf = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handler)
    })
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousedown', handler)
    }
  }, [avatarOpen])

  useEffect(() => {
    const isMobile = window.innerWidth < 640
    const seen = localStorage.getItem('paletta-hint')
    if (!isMobile && !seen) {
      setTimeout(() => setShowHint(true), 900)
      setTimeout(() => { setShowHint(false); localStorage.setItem('paletta-hint', '1') }, 4000)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('p')
    if (p) {
      const hexes = decodePalette(p)
      if (hexes) {
        const lockedParam = params.get('locked')
        const lockedBits = lockedParam ? lockedParam.split(',') : []
        setSwatches(hexes.map((h, i) => makeSwatch(h, lockedBits[i] === '1')))
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('p', encodePalette(swatches.map(s => s.hex)))
    const lockedStr = swatches.map(s => s.locked ? '1' : '0').join(',')
    if (swatches.some(s => s.locked)) {
      url.searchParams.set('locked', lockedStr)
    } else {
      url.searchParams.delete('locked')
    }
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
      if (e.key === 'Escape')                         { setExportOpen(false); setHelpOpen(false); setActivePanel(null); setProModalOpen(false); setToolsOpen(false); setProToolsOpen(false); setSignInOpen(false); setDrawerOpen(false); setAvatarOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [triggerGenerate, undo])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      setSaveToast('Link copied!')
      setTimeout(() => { setShareCopied(false); setSaveToast('') }, 2000)
    } catch { /* silent */ }
  }

  const handleAiPalette = (hexes: string[]) => {
    setSwatches(hexes.map(h => makeSwatch(h)))
  }

  const handleImagePalette = (hexes: string[]) => {
    setSwatches(hexes.map(h => makeSwatch(h)))
  }

  const handleSave = () => {
    if (!isPro) { openProModal(); return }
    console.log('Save palette:', swatches.map(s => s.hex))
    setSaveToast('Palette saved!')
    setTimeout(() => setSaveToast(''), 2000)
  }

  // Mobile: cycle through free counts
  const handleMobileCountCycle = () => {
    const idx = FREE_COUNTS.indexOf(count)
    const next = FREE_COUNTS[(idx + 1) % FREE_COUNTS.length]
    setCount(next)
  }

  const visionFilter = visionMode !== 'normal' ? `url(#vision-${visionMode})` : undefined

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-white">

      {/* -- Header Row 1: Navbar -- */}
      <header className="flex-none h-16 sm:h-14 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 z-40 shrink-0">
        <span className="text-[22px] sm:text-[24px] font-bold tracking-tight text-gray-900">
          Paletta
        </span>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Share — desktop only */}
          <Tooltip text={shareCopied ? 'Copied!' : 'Copy shareable link'}>
            <button
              onClick={handleShare}
              className="hidden sm:flex items-center gap-1.5 px-4 h-9 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-all duration-150"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              <span>{shareCopied ? 'Copied!' : 'Share'}</span>
            </button>
          </Tooltip>

          {/* Mobile: Sign In text */}
          <button
            onClick={() => setSignInOpen(true)}
            className="sm:hidden text-[13px] text-gray-600 font-medium hover:text-gray-900 transition-colors px-1"
          >
            Sign In
          </button>

          {/* Mobile: Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all"
            aria-label="Menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Save — desktop only */}
          <Tooltip text="Save palette">
            <button
              onClick={handleSave}
              className="hidden sm:flex items-center gap-1.5 px-4 h-9 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-all duration-150"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>Save</span>
            </button>
          </Tooltip>

          {/* Sign In — desktop only */}
          {!isSignedIn ? (
            <button
              onClick={() => setSignInOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 font-medium hover:text-gray-900 transition-colors px-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Sign In
            </button>
          ) : (
            <div ref={avatarRef} className="relative hidden sm:block">
              <button
                onClick={() => setAvatarOpen(o => !o)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-xs font-bold cursor-pointer hover:bg-blue-200 transition-colors"
              >
                {(user?.email?.[0] ?? 'U').toUpperCase()}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-10 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2">
                    <span className="text-[12px] text-gray-400 break-all">{user?.email}</span>
                  </div>
                  <div className="mx-2 h-px bg-gray-100" />
                  <button
                    onClick={() => { setAvatarOpen(false); signOut() }}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Divider before Export — desktop */}
          <div className="hidden sm:block w-px h-5 bg-gray-200" />

          {/* Export — desktop only */}
          <Tooltip text="Export palette">
            <button
              onClick={() => setExportOpen(o => !o)}
              className="hidden sm:flex items-center gap-1.5 px-4 h-9 rounded-full text-white text-[13px] font-medium transition-all duration-150 hover:opacity-90 active:scale-95"
              style={{ backgroundColor: BRAND }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          </Tooltip>

          {/* Go Pro CTA — desktop only */}
          <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
            <button
              onClick={openProModal}
              className="px-3 h-8 rounded-full border text-[13px] font-medium transition-all hover:bg-blue-50"
              style={{ borderColor: BRAND, color: BRAND }}
            >
              Go Pro →
            </button>
          </div>
        </div>
      </header>

      {/* -- Header Row 2: Harmony tabs + desktop tools -- */}
      <div
        className="flex-none h-12 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 z-30 shrink-0 overflow-x-auto overflow-y-hidden scrollbar-none"
        onClick={e => e.stopPropagation()}
      >
        <HarmonyPicker mode={harmonyMode} onChange={setHarmonyMode} />
        {/* Desktop-only tools */}
        <div className="hidden sm:flex items-center gap-1 shrink-0 ml-2">
          {/* Pro Tools dropdown trigger */}
          <Tooltip text="Pro tools">
            <button
              ref={proToolsBtnRef}
              onClick={(e) => {
                e.stopPropagation()
                if (!proToolsOpen && proToolsBtnRef.current) {
                  const rect = proToolsBtnRef.current.getBoundingClientRect()
                  setProToolsPos({ top: rect.bottom + 8, left: rect.left })
                }
                setProToolsOpen(o => !o)
              }}
              className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-medium transition-all ${
                proToolsOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <span className="text-amber-500">✦</span> Pro Tools
            </button>
          </Tooltip>
          <ImagePalette onPalette={handleImagePalette} onProGate={openProModal} />
          <VisionSimulator mode={visionMode} onChange={setVisionMode} onProGate={openProModal} />
          <Tooltip text="Generate from prompt">
            <button
              onClick={() => setAiOpen(o => !o)}
              className={`flex items-center gap-1 h-8 px-3 rounded-full text-[12px] font-medium transition-all ${
                aiOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              ✨ AI
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wide text-white leading-none" style={{ backgroundColor: '#1A73E8' }}>PRO</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* -- Palette auto-name (desktop only) -- */}
      {(() => {
        const names = swatches.map(s => getColorName(s.hex)).filter(Boolean)
        const baseNames = names.filter(n => !/\s\d+$/.test(n))
        const unique = [...new Set(baseNames)]
        if (unique.length < 2) return null
        const display = unique.slice(0, 3).join(' · ')
        return (
          <div className="flex-none hidden sm:flex items-center justify-center h-7 bg-white text-[11px] text-gray-400 font-medium tracking-wide">
            {display}
          </div>
        )
      })()}

      {/* -- AI prompt bar (collapsible) -- */}
      {aiOpen && (
        <div className="flex-none h-11 bg-white border-b border-gray-100 flex items-center px-3 sm:px-4 z-20 shrink-0">
          <AiPrompt onPalette={handleAiPalette} onFallback={triggerGenerate} onProGate={openProModal} />
        </div>
      )}

      {/* -- Palette canvas -- */}
      <main
        className="flex-1 overflow-hidden relative"
        style={{ filter: visionFilter }}
      >
        {/* Vision mode badge */}
        {visionMode !== 'normal' && (
          <button
            onClick={() => setVisionMode('normal')}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur shadow-md text-[12px] font-medium text-gray-700 hover:bg-white transition-all"
          >
            👁 {visionMode.charAt(0).toUpperCase() + visionMode.slice(1)}
            <span className="text-gray-400 ml-1">✕</span>
          </button>
        )}

        {/* Palette with mobile footer clearance */}
        <div
          className="w-full h-full sm:[all:unset] sm:contents"
          style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom, 0px))' }}
        >
          <PaletteCanvas
            swatches={swatches}
            onLock={lockSwatch}
            onEdit={editSwatch}
            onReorder={reorderSwatches}
            onCopyToast={showCopyToast}
            activePanel={activePanel}
            onPanelChange={handlePanelChange}
          />
        </div>

        {/* Floating help button — bottom left (desktop only) */}
        <div className="absolute floating-bottom left-4 z-20 hidden sm:block">
          <div className="relative">
            <Tooltip text="Keyboard shortcuts" disabled={helpOpen}>
              <button
                onClick={() => {
                  if (helpOpen) { setHelpOpen(false) }
                  else { setHelpOpen(true); setActivePanel(null) }
                }}
                className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-lg transition-all text-[15px] font-semibold"
              >
                ?
              </button>
            </Tooltip>
            {helpOpen && (
              <div className="absolute bottom-12 left-0 z-[100] min-w-[300px] rounded-xl bg-white border border-gray-200 shadow-xl p-4 text-[12px] text-gray-600 leading-relaxed">
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
            <CountPicker count={count} onChange={setCount} onProGate={openProModal} />
          </div>
        </div>
      </main>

      {/* -- Mobile footer: Undo | Generate | Colors | Tools | Export -- */}
      <footer
        className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-gray-200 z-40 flex items-center justify-between px-2"
        style={{ height: `calc(56px + max(env(safe-area-inset-bottom, 0px), 16px))`, paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        {/* Undo */}
        <button
          onClick={undo}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all shrink-0"
          aria-label="Undo"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>

        {/* Generate — pill, centered */}
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

        {/* Colors — cycle pill */}
        <button
          onClick={handleMobileCountCycle}
          className="h-9 px-3 rounded-full bg-gray-100 text-[13px] font-semibold text-gray-700 active:bg-gray-200 transition-all shrink-0"
          aria-label={`${count} colors, tap to change`}
        >
          {count}
        </button>

        {/* Tools */}
        <button
          onClick={() => setToolsOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all shrink-0"
          aria-label="Pro Tools"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>

        {/* Export */}
        <button
          onClick={() => setExportOpen(o => !o)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all shrink-0"
          aria-label="Export"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      </footer>

      {exportOpen && (
        <ExportPanel hexes={swatches.map(s => s.hex)} onClose={() => setExportOpen(false)} />
      )}

      {/* Mobile tools bottom sheet */}
      <ToolsSheet
        open={toolsOpen}
        onClose={() => setToolsOpen(false)}
        onProGate={openProModal}
        onImagePalette={handleImagePalette}
        onAiOpen={() => { setAiOpen(true); setToolsOpen(false) }}
        visionMode={visionMode}
        onVisionChange={setVisionMode}
      />

      {/* Mobile drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
        onExport={() => setExportOpen(true)}
        onShare={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href)
            setSaveToast('Link copied!')
            setTimeout(() => setSaveToast(''), 2000)
          } catch { /* silent */ }
        }}
        onSignIn={() => setSignInOpen(true)}
        onProGate={openProModal}
        onImagePalette={() => { if (!isPro) { openProModal(); return }; document.querySelector<HTMLInputElement>('input[accept="image/*"]')?.click() }}
        onVisionSim={() => { if (!isPro) { openProModal(); return }; setVisionMode(visionMode === 'normal' ? 'deuteranopia' : 'normal') }}
        onAiPalette={() => { if (!isPro) { openProModal(); return }; setAiOpen(true) }}
      />

      {/* Sign In modal */}
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} onGoogleSignIn={signInWithGoogle} />

      {/* Unified Pro upgrade modal */}
      <ProUpgradeModal open={proModalOpen} onClose={() => setProModalOpen(false)} onSignIn={() => setSignInOpen(true)} />

      {/* Payment success modal — shown when returning from Stripe without being signed in */}
      <PaymentSuccessModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} />

      {/* Save toast */}
      {saveToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium whitespace-nowrap shadow-lg pointer-events-none">
          {saveToast}
        </div>
      )}

      {/* Copy toast */}
      {copyToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium whitespace-nowrap shadow-lg pointer-events-none">
          Copied!
        </div>
      )}

      {/* Pro Tools dropdown — portal to body to avoid overflow clipping */}
      {proToolsOpen && createPortal(
        <div
          ref={proToolsDropRef}
          className="bg-white rounded-xl shadow-xl border border-gray-100 p-2 min-w-[280px]"
          style={{
            position: 'fixed',
            top: proToolsPos.top,
            left: proToolsPos.left,
            zIndex: 9999,
          }}
        >
          <button
            onClick={() => { setProToolsOpen(false); if (!isPro) { openProModal(); return }; document.querySelector<HTMLInputElement>('input[accept="image/*"]')?.click() }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium text-gray-800">From Image</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wide text-white leading-none" style={{ backgroundColor: BRAND }}>PRO</span>
              </div>
              <p className="text-[11px] text-gray-500">Extract palette from any photo</p>
            </div>
          </button>
          <button
            onClick={() => { setProToolsOpen(false); if (!isPro) { openProModal(); return }; setVisionMode(visionMode === 'normal' ? 'deuteranopia' : 'normal') }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium text-gray-800">Vision Sim</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wide text-white leading-none" style={{ backgroundColor: BRAND }}>PRO</span>
              </div>
              <p className="text-[11px] text-gray-500">Simulate color blindness modes</p>
            </div>
          </button>
          <button
            onClick={() => { setProToolsOpen(false); if (!isPro) { openProModal(); return }; setAiOpen(true) }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <span className="text-[14px]">✨</span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium text-gray-800">AI Palette</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold tracking-wide text-white leading-none" style={{ backgroundColor: BRAND }}>PRO</span>
              </div>
              <p className="text-[11px] text-gray-500">Generate palette from a text prompt</p>
            </div>
          </button>
        </div>,
        document.body
      )}

      <VisionFilterDefs />
    </div>
  )
}
