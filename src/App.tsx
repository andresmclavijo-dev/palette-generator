import { useCallback, useEffect, useRef, useState } from 'react'
import PaletteCanvas from './components/palette/PaletteCanvas'
import type { ActivePanel } from './components/palette/PaletteCanvas'
import HarmonyPicker from './components/palette/HarmonyPicker'
import CountPicker from './components/palette/CountPicker'
import ExportPanel from './components/palette/ExportPanel'
import AiPrompt, { getAiRemaining } from './components/palette/AiPrompt'
import ImagePalette from './components/palette/ImagePalette'
import VisionSimulator, { VisionFilterDefs } from './components/palette/VisionSimulator'
import type { VisionMode } from './components/palette/VisionSimulator'
import ToolsSheet from './components/palette/ToolsSheet'
import ProUpgradeModal from './components/ui/ProUpgradeModal'
import SignInModal from './components/ui/SignInModal'
import PaymentSuccessModal from './components/ui/PaymentSuccessModal'
import SavedPalettesPanel from './components/ui/SavedPalettesPanel'
import SaveNameModal from './components/ui/SaveNameModal'
import MobileDrawer from './components/ui/MobileDrawer'
import WelcomeModal from './components/ui/WelcomeModal'
import Tooltip from './components/ui/Tooltip'
import AppHeader from './components/AppHeader'
import AppFooter from './components/AppFooter'
import CookieConsent from './components/CookieConsent'
import { showToast } from './utils/toast'
import { usePro } from './hooks/usePro'

import { useAuth } from './hooks/useAuth'
import { usePaletteStore } from './store/paletteStore'
import { makeSwatch, decodePalette, encodePalette, getColorName } from './lib/colorEngine'
import { extractColorsFromFile } from './lib/kMeans'
import { BRAND_VIOLET, BRAND_WARM } from './lib/tokens'
const FREE_COUNTS = [3, 4, 5]

export default function App() {
  const { isPro, showPaymentModal, setShowPaymentModal } = usePro()
  const { user, isSignedIn, signInWithGoogle, signOut } = useAuth()
  const {
    swatches, harmonyMode, count, historyIndex, history,
    generate, lockSwatch, editSwatch, reorderSwatches,
    setHarmonyMode, setCount, undo, redo, setSwatches,
  } = usePaletteStore()

  const [shareCopied,  setShareCopied]  = useState(false)
  const [exportOpen,   setExportOpen]   = useState(false)
  const [showHint,     setShowHint]     = useState(false)
  const [helpOpen,     setHelpOpen]     = useState(false)
  const [aiOpen,       setAiOpen]       = useState(false)
  const [visionMode,   setVisionMode]   = useState<VisionMode>('normal')
  const [proModalOpen, setProModalOpen] = useState(false)
  const [toolsOpen,    setToolsOpen]    = useState(false)
  const [signInOpen,   setSignInOpen]   = useState(false)
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [savedOpen,    setSavedOpen]    = useState(false)
  const [saveNameOpen, setSaveNameOpen] = useState(false)
  const [activePanel,  setActivePanel]  = useState<ActivePanel>(null)
  const [aiRemaining, setAiRemaining]  = useState(getAiRemaining)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mobileFileRef = useRef<HTMLInputElement>(null)

  const openProModal = useCallback(() => setProModalOpen(true), [])

  // Auto-close Pro modal when user becomes Pro
  useEffect(() => {
    if (isPro) setProModalOpen(false)
  }, [isPro])

  const handlePanelChange = useCallback((panel: ActivePanel) => {
    setActivePanel(panel)
    if (panel) setHelpOpen(false)
  }, [])

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
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); undo() }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey)  { e.preventDefault(); redo() }
      if (e.key === 'Escape')                         { setExportOpen(false); setHelpOpen(false); setActivePanel(null); setProModalOpen(false); setToolsOpen(false); setSignInOpen(false); setDrawerOpen(false); setSavedOpen(false); setSaveNameOpen(false); setAiOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [triggerGenerate, undo, redo])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      showToast('Link copied!')
      setTimeout(() => setShareCopied(false), 2000)
    } catch { /* silent */ }
  }

  const handleAiPalette = (hexes: string[]) => {
    setSwatches(hexes.map(h => makeSwatch(h)))
  }

  const handleImagePalette = (hexes: string[]) => {
    setSwatches(hexes.map(h => makeSwatch(h)))
  }

  const handleMobileImageClick = () => {
    if (isPro) { mobileFileRef.current?.click() }
    else { openProModal() }
  }

  const handleMobileFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const colors = await extractColorsFromFile(file)
      setSwatches(colors.slice(0, count).map(h => makeSwatch(h)))
    } catch { /* silent */ }
  }

  const handleSave = () => {
    if (!isPro) { openProModal(); return }
    if (!user) { setSignInOpen(true); return }
    setSaveNameOpen(true)
  }

  const defaultPaletteName = (() => {
    const names = swatches.map(s => getColorName(s.hex)).filter(Boolean)
    return names.slice(0, 3).join(' · ') || 'Untitled'
  })()

  const handleSaveConfirm = async (name: string) => {
    setSaveNameOpen(false)
    if (!user) return
    try {
      const { supabase } = await import('./lib/supabase')
      const colors = swatches.map(s => s.hex).filter(Boolean)
      if (colors.length === 0) {
        showToast('Nothing to save')
        return
      }
      // Check for duplicate palette (same colors in same order)
      const { data: existing } = await supabase
        .from('saved_palettes')
        .select('id, colors')
        .eq('user_id', user.id)
      const isDuplicate = existing?.some(
        (p: { colors: string[] }) => JSON.stringify(p.colors) === JSON.stringify(colors)
      )
      if (isDuplicate) {
        showToast('Palette already saved')
        return
      }
      const payload = { user_id: user.id, name, colors }
      const { error } = await supabase.from('saved_palettes').insert(payload)
      if (error) throw error
      showToast('Palette saved \u2713')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Save failed:', msg, err)
      showToast('Save failed — check console')
    }
  }

  // Mobile: cycle through available counts (3–5 free, 3–8 Pro)
  const mobileCounts = isPro ? [3, 4, 5, 6, 7, 8] : FREE_COUNTS
  const handleMobileCountCycle = () => {
    const idx = mobileCounts.indexOf(count)
    const next = mobileCounts[(idx + 1) % mobileCounts.length]
    setCount(next)
  }

  const visionFilter = visionMode !== 'normal' ? `url(#vision-${visionMode})` : undefined

  return (
    <div className="w-screen flex flex-col overflow-hidden" style={{ height: '100dvh', backgroundColor: BRAND_WARM }}>

      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[#6C47FF] focus:rounded-lg focus:border focus:border-[#6C47FF] focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Visually hidden h1 for screen readers */}
      <h1 className="absolute w-px h-px overflow-hidden" style={{ clip: 'rect(0,0,0,0)' }}>Paletta — Free Color Palette Generator</h1>

      {/* -- Header Row 1: Navbar -- */}
      <AppHeader
        isPro={isPro}
        isSignedIn={isSignedIn}
        userEmail={user?.email ?? undefined}
        shareCopied={shareCopied}
        onShare={handleShare}
        onSave={handleSave}
        onSavedPalettes={() => setSavedOpen(true)}
        onExport={() => setExportOpen(o => !o)}
        onSignIn={() => setSignInOpen(true)}
        onSignOut={signOut}
        onProGate={openProModal}
        onDrawerOpen={() => setDrawerOpen(true)}
      />

      {/* -- Header Row 2: Harmony tabs + desktop tools -- */}
      <div
        className="flex-none bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 z-30 shrink-0 overflow-x-auto overflow-y-hidden scrollbar-none"
        style={{ minHeight: '60px' }}
        onClick={e => e.stopPropagation()}
      >
        <span className="text-[11px] sm:text-[14px] font-bold mr-1 sm:mr-1.5 shrink-0" style={{ color: '#555555' }}>Style:</span>
        <HarmonyPicker mode={harmonyMode} onChange={setHarmonyMode} />
        {/* Desktop-only tools — inline, no dropdown wrapper */}
        <div className="hidden sm:flex items-center gap-1 shrink-0 ml-2">
          <VisionSimulator mode={visionMode} onChange={setVisionMode} onProGate={openProModal} />
          <ImagePalette onPalette={handleImagePalette} onProGate={openProModal} />
          <Tooltip text="Generate a palette from a text prompt">
            <button
              onClick={() => setAiOpen(true)}
              className="flex items-center gap-3 h-10 px-4 rounded-full text-[14px] font-medium transition-all hover:bg-surface-secondary hover:text-gray-700"
              style={{ color: '#444444' }}
              aria-label="AI palette generation from text prompt"
            >
              <span aria-hidden="true">✨</span> AI Palette
              {!isPro && (
                <span aria-hidden="true" className="contents">
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold text-white leading-none" style={{ backgroundColor: BRAND_VIOLET }}>
                    {aiRemaining}
                  </span>
                  <span className="text-[14px] ml-0.5" style={{ color: '#666666' }}>free/day</span>
                </span>
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* -- Instruction banner -- */}
      <div
        className="flex-none hidden sm:flex items-center justify-center w-full"
        style={{ height: 32, background: '#FAFAF8', borderTop: '1px solid #e8e8e8', borderBottom: '1px solid #e8e8e8' }}
      >
        <span className="text-[11px] font-medium" style={{ color: '#555555' }}>
          Drag to reorder
        </span>
      </div>

      {/* AI modal dialog */}
      <AiPrompt
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onPalette={handleAiPalette}
        onFallback={triggerGenerate}
        onProGate={openProModal}
        onUsageChange={() => setAiRemaining(getAiRemaining())}
        onError={(msg) => showToast(msg)}
        colorCount={count}
      />

      {/* -- Palette canvas -- */}
      <main
        id="main-content"
        className="flex-1 min-h-0 overflow-hidden relative"
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

        {/* Palette with mobile footer clearance — vision filter applied here to avoid trapping fixed-position bottom sheets */}
        <div
          className="w-full h-full pb-[calc(88px+env(safe-area-inset-bottom,0px))] sm:pb-0"
          style={{ filter: visionFilter }}
        >
          <PaletteCanvas
            swatches={swatches}
            onLock={lockSwatch}
            onEdit={editSwatch}
            onReorder={reorderSwatches}
            activePanel={activePanel}
            onPanelChange={handlePanelChange}
          />
        </div>

        {/* Floating hint — desktop only, shown briefly on first load */}
        {showHint && (
          <div className="absolute floating-bottom left-1/2 -translate-x-1/2 z-20 hidden sm:block pointer-events-none">
            <div className="px-3 py-1.5 rounded-lg bg-gray-900/90 text-white text-[11px] font-medium tracking-wide whitespace-nowrap">
              Press <kbd className="mx-1 px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px]">Space</kbd> to generate
            </div>
          </div>
        )}
      </main>

      {/* -- Desktop bottom bar (Figma Footer 19:473) -- */}
      <div
        className="flex-none hidden sm:flex items-center justify-between relative"
        style={{ height: 64, background: '#FFFFFF', borderTop: '0.5px solid #efefef', padding: '0 20px' }}
      >
        {/* Left: Help / keyboard shortcuts */}
        <div className="relative z-10">
          <Tooltip text="Keyboard shortcuts" disabled={helpOpen}>
            <button
              onClick={() => {
                if (helpOpen) { setHelpOpen(false) }
                else { setHelpOpen(true); setActivePanel(null) }
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-transparent hover:bg-surface-secondary cursor-pointer"
              style={{ border: '1px solid #e8e8e8', color: '#1a1a2e' }}
              aria-label="Keyboard shortcuts"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </button>
          </Tooltip>
          {helpOpen && (
            <div className="absolute bottom-12 left-0 z-[100] min-w-[300px] rounded-xl bg-white border border-gray-200 shadow-xl p-4 text-[12px] text-gray-600 leading-relaxed">
              <div className="font-semibold text-gray-800 mb-2">Shortcuts</div>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span>Generate</span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[11px]">Space</kbd></div>
                <div className="flex justify-between"><span>Undo</span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[11px]">Cmd+Z</kbd></div>
                <div className="flex justify-between"><span>Redo</span><kbd className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-[11px]">Cmd+Shift+Z</kbd></div>
                <div className="flex justify-between"><span>Lock color</span><span className="text-gray-400">Click swatch</span></div>
                <div className="flex justify-between"><span>Copy hex</span><span className="text-gray-400">Click hex</span></div>
                <div className="flex justify-between"><span>Edit color</span><span className="text-gray-400">Double-click hex</span></div>
                <div className="flex justify-between"><span>Reorder</span><span className="text-gray-400">Drag handle</span></div>
              </div>
              <button className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 text-[13px]" onClick={() => setHelpOpen(false)} aria-label="Close shortcuts">X</button>
            </div>
          )}
        </div>

        {/* Center: Undo + Generate + Redo — absolutely centered */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
          {/* Undo */}
          <Tooltip text="Undo (Cmd+Z)">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 bg-transparent hover:bg-surface-secondary cursor-pointer"
              style={{ border: '1px solid #e8e8e8', color: '#1a1a2e' }}
              aria-label="Undo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>
              </svg>
            </button>
          </Tooltip>

          {/* Generate */}
          <button
            onClick={triggerGenerate}
            className="flex items-center gap-3 h-10 rounded-full text-white text-[14px] font-medium transition-all duration-150 active:scale-95 bg-brand-violet hover:bg-brand-violet-hover"
            style={{ padding: '0 16px', gap: 12 }}
            aria-label="Generate new palette"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Generate
            <span aria-hidden="true" className="hidden md:block">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  height: 14,
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 0,
                  paddingBottom: 0,
                  background: '#9b82ff',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#ffffff',
                  lineHeight: 1,
                }}
              >
                space
              </span>
            </span>
            <span className="sr-only">Press space to generate</span>
          </button>

          {/* Redo */}
          <Tooltip text="Redo (Cmd+Shift+Z)">
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 bg-transparent hover:bg-surface-secondary cursor-pointer"
              style={{ border: '1px solid #e8e8e8', color: '#1a1a2e' }}
              aria-label="Redo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 14l5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13"/>
              </svg>
            </button>
          </Tooltip>
        </div>

        {/* Right: Colors pill */}
        <div className="relative z-10">
          <CountPicker count={count} onChange={setCount} onProGate={openProModal} />
        </div>
      </div>

      {/* App footer — legal links + attribution */}
      <AppFooter />

      {/* -- Mobile footer: Undo | Redo | Generate | Colors | Export -- */}
      <footer
        className="fixed bottom-0 left-0 right-0 sm:hidden bg-white border-t border-gray-200 z-40 flex items-center justify-between px-2"
        style={{ minHeight: '64px', height: `calc(64px + max(env(safe-area-inset-bottom, 0px), 16px))`, paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
      >
        {/* Undo */}
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all shrink-0 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
          style={{ minWidth: '40px', minHeight: '40px' }}
          aria-label="Undo"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all shrink-0 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
          style={{ minWidth: '40px', minHeight: '40px' }}
          aria-label="Redo"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>
          </svg>
        </button>

        {/* Generate — pill, centered */}
        <button
          onClick={triggerGenerate}
          className="flex items-center gap-3 px-4 h-10 rounded-full text-white text-[14px] font-medium shadow-md active:scale-95 transition-all bg-brand-violet hover:bg-brand-violet-hover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Generate
        </button>

        {/* Colors — cycle pill */}
        <button
          onClick={handleMobileCountCycle}
          className="h-10 px-4 rounded-full bg-gray-100 text-[14px] font-semibold text-gray-700 active:bg-gray-200 transition-all shrink-0"
          aria-label={`${count} colors, tap to change`}
        >
          {count}
        </button>

        {/* Export */}
        <button
          onClick={() => setExportOpen(o => !o)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all shrink-0"
          style={{ minWidth: '40px', minHeight: '40px' }}
          aria-label="Export"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>

        {/* Pro CTA — visible only for non-Pro */}
        {!isPro && (
          <button
            onClick={openProModal}
            className="h-10 px-4 rounded-full text-white text-[14px] font-medium active:scale-95 transition-all shrink-0 flex items-center gap-3 bg-brand-violet hover:bg-brand-violet-hover"
          >
            <span className="text-[12px] leading-none">✦</span>
            Pro
          </button>
        )}
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

      {/* Hidden file input for mobile image extraction */}
      <input ref={mobileFileRef} type="file" accept="image/*" className="hidden" onChange={handleMobileFile} />

      {/* Mobile drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
        onExport={() => setExportOpen(true)}
        onShare={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href)
            showToast('Link copied!')
          } catch { /* silent */ }
        }}
        onSignIn={() => setSignInOpen(true)}
        onSignOut={signOut}
        onProGate={openProModal}
        onImagePalette={handleMobileImageClick}
        onVisionSim={() => { if (isPro) { setToolsOpen(true) } else { openProModal() } }}
        onAiPalette={() => { setAiOpen(true) }}
        onSavedPalettes={() => setSavedOpen(true)}
        isPro={isPro}
        isSignedIn={isSignedIn}
        userEmail={user?.email ?? undefined}
        visionMode={visionMode}
        onVisionChange={setVisionMode}
      />

      {/* Sign In modal */}
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} onGoogleSignIn={signInWithGoogle} />

      {/* Unified Pro upgrade modal */}
      <ProUpgradeModal open={proModalOpen} onClose={() => setProModalOpen(false)} onSignIn={() => setSignInOpen(true)} />

      {/* Payment success modal — shown when returning from Stripe without being signed in */}
      <PaymentSuccessModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} />

      {/* Save name modal */}
      <SaveNameModal
        open={saveNameOpen}
        defaultName={defaultPaletteName}
        onConfirm={handleSaveConfirm}
        onClose={() => setSaveNameOpen(false)}
      />

      {/* Saved palettes panel */}
      {user && (
        <SavedPalettesPanel
          open={savedOpen}
          onClose={() => setSavedOpen(false)}
          userId={user.id}
          onLoad={(hexes) => setSwatches(hexes.map(h => makeSwatch(h)))}
          isPro={isPro}
          onProGate={openProModal}
        />
      )}

      <WelcomeModal />
      <VisionFilterDefs />
      <CookieConsent />
    </div>
  )
}
