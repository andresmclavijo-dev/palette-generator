import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Sparkles, Eye, LayoutDashboard, Image, Star, Heart,
  ChevronLeft, ChevronRight, Lock, Unlock, Copy, Check, Info,
  X, Share2, Download, Grid3X3, RefreshCw, SlidersHorizontal,
  Undo2, Redo2, Plus, Minus, MoreHorizontal, ExternalLink,
} from 'lucide-react'
import { usePaletteStore } from '../store/paletteStore'
import { usePro } from '../hooks/usePro'
import { useAuth } from '../hooks/useAuth'
import { VisionFilterDefs } from './palette/VisionSimulator'
import type { VisionMode } from './palette/VisionSimulator'
import AiPrompt, { getAiRemaining } from './palette/AiPrompt'
import ExportPanel from './palette/ExportPanel'
import ProUpgradeModal from './ui/ProUpgradeModal'
import SignInModal from './ui/SignInModal'
import PaymentSuccessModal from './ui/PaymentSuccessModal'
import SavedPalettesPanel from './ui/SavedPalettesPanel'
import SaveNameModal from './ui/SaveNameModal'
// PreviewModal no longer used — preview is inline via PreviewMode component
import CookieConsent from './CookieConsent'
import {
  readableOn, getColorName, getColorInfo, getContrastBadge,
  makeSwatch, generateShades, TAILWIND_SHADE_LABELS,
  encodePalette, decodePalette, parseHex,
} from '../lib/colorEngine'
import { extractColorsFromFile } from '../lib/kMeans'
import { BRAND_VIOLET, BRAND_DARK } from '../lib/tokens'
import { showToast } from '../utils/toast'
import { analytics } from '../lib/posthog'
import { createCheckoutSession, createPortalSession } from '../lib/stripe'

// ─── Types ───────────────────────────────────────────────────
type ToolId = 'generate' | 'simulate' | 'preview' | 'extract' | 'ai' | 'library'
type HarmonyMode = 'random' | 'analogous' | 'monochromatic' | 'complementary' | 'triadic'

const HARMONIES: { mode: HarmonyMode; label: string; desc: string }[] = [
  { mode: 'random', label: 'Random', desc: 'Fully random colors' },
  { mode: 'analogous', label: 'Analogous', desc: 'Colors next to each other' },
  { mode: 'monochromatic', label: 'Monochromatic', desc: 'Shades of one hue' },
  { mode: 'complementary', label: 'Complementary', desc: 'Opposite on the wheel' },
  { mode: 'triadic', label: 'Triadic', desc: 'Three evenly spaced' },
]

const VISION_MODES: { mode: VisionMode; label: string; desc: string; pro: boolean }[] = [
  { mode: 'normal', label: 'Normal Vision', desc: 'Standard color perception', pro: false },
  { mode: 'protanopia', label: 'Protanopia', desc: 'Red-blind simulation', pro: false },
  { mode: 'deuteranopia', label: 'Deuteranopia', desc: 'Green-blind simulation', pro: true },
  { mode: 'tritanopia', label: 'Tritanopia', desc: 'Blue-blind simulation', pro: true },
  { mode: 'achromatopsia', label: 'Achromatopsia', desc: 'Total color blindness', pro: true },
]

const DOCK_STORAGE_KEY = 'paletta_dock_expanded'

// ─── Main Component ──────────────────────────────────────────
export default function DesktopStudio() {
  // Global state
  const { isPro, showPaymentModal, setShowPaymentModal } = usePro()
  const { user, isSignedIn, signInWithGoogle, signOut } = useAuth()
  const {
    swatches, harmonyMode, count,
    generate, lockSwatch, editSwatch, setHarmonyMode, setCount,
    undo, redo, setSwatches,
  } = usePaletteStore()

  // Local UI state
  const [dockExpanded, setDockExpanded] = useState(() => {
    const stored = localStorage.getItem(DOCK_STORAGE_KEY)
    return stored !== null ? stored === 'true' : true
  })
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)
  const [visionMode, setVisionMode] = useState<VisionMode>('normal')
  const [harmonyOpen, setHarmonyOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [proModalOpen, setProModalOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [saveNameOpen, setSaveNameOpen] = useState(false)
  // previewOpen removed — preview is now activeTool === 'preview'
  const [shareCopied, setShareCopied] = useState(false)
  const [aiRemaining, setAiRemaining] = useState(getAiRemaining)
  const [shadesOpen, setShadesOpen] = useState<string | null>(null)
  const [infoOpen, setInfoOpen] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [imageUploading, setImageUploading] = useState(false)

  const [dockPulse, setDockPulse] = useState(() => !sessionStorage.getItem('paletta_dock_pulsed'))

  const fileInputRef = useRef<HTMLInputElement>(null)
  const harmonyRef = useRef<HTMLDivElement>(null)
  const trackedRef = useRef(false)

  // Track desktop_studio_loaded once
  useEffect(() => {
    if (!trackedRef.current) {
      trackedRef.current = true
      analytics.track('desktop_studio_loaded')
    }
  }, [])

  // Persist dock state
  const toggleDock = useCallback(() => {
    setDockExpanded(prev => {
      const next = !prev
      localStorage.setItem(DOCK_STORAGE_KEY, String(next))
      analytics.track(next ? 'dock_expanded' : 'dock_collapsed')
      return next
    })
  }, [])

  // Auto-close Pro modal when user becomes Pro
  useEffect(() => {
    if (isPro) setProModalOpen(false)
  }, [isPro])

  // After OAuth redirect: pending checkout
  const pendingCheckoutHandled = useRef(false)
  useEffect(() => {
    if (!user || pendingCheckoutHandled.current) return
    const pending = localStorage.getItem('paletta_pending_checkout') as 'monthly' | 'yearly' | null
    if (!pending) return
    pendingCheckoutHandled.current = true
    localStorage.removeItem('paletta_pending_checkout')
    showToast('Redirecting to checkout…')
    createCheckoutSession(pending, user.id, user.email ?? undefined)
      .then(url => { window.location.href = url })
      .catch(() => showToast('Something went wrong — please try again'))
  }, [user])

  // URL palette sync
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

  // Session start + pageview
  useEffect(() => {
    if (!sessionStorage.getItem('paletta_session_start')) {
      sessionStorage.setItem('paletta_session_start', String(Date.now()))
    }
    analytics.track('$pageview')
  }, [])

  const openProModal = useCallback((feature?: string, source?: string) => {
    if (feature) analytics.track('pro_gate_hit', { feature, source: source ?? 'toolbar' })
    analytics.track('pro_modal_opened')
    setProModalOpen(true)
  }, [])

  const triggerGenerate = useCallback((method: 'spacebar' | 'button' | 'ai' = 'button') => {
    generate()
    setDockPulse(false)
    sessionStorage.setItem('paletta_dock_pulsed', '1')
    analytics.trackDebounced('palette_generated', { method, style: harmonyMode, color_count: count })
    if (!localStorage.getItem('paletta_first_generate_at')) {
      localStorage.setItem('paletta_first_generate_at', String(Date.now()))
      const sessionStart = Number(sessionStorage.getItem('paletta_session_start') || Date.now())
      analytics.track('first_generate', { time_to_first_generate_ms: Date.now() - sessionStart })
    }
  }, [generate, harmonyMode, count])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); triggerGenerate('spacebar') }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); undo() }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); redo() }
      if (e.key === 'Escape') {
        setExportOpen(false); setAiOpen(false); setProModalOpen(false)
        setSignInOpen(false); setSavedOpen(false); setSaveNameOpen(false)
        setHarmonyOpen(false)
        setActiveTool(null); setShadesOpen(null); setInfoOpen(null)
        setEditingId(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [triggerGenerate, undo, redo])

  // Click outside harmony dropdown
  useEffect(() => {
    if (!harmonyOpen) return
    const handler = (e: MouseEvent) => {
      if (harmonyRef.current && !harmonyRef.current.contains(e.target as Node)) {
        setHarmonyOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [harmonyOpen])

  // Handlers
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      showToast('Link copied!')
      setTimeout(() => setShareCopied(false), 2000)
    } catch { /* silent */ }
  }

  const handleSave = () => {
    if (!isPro) { openProModal('save_limit', 'toolbar'); return }
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
      const { supabase } = await import('../lib/supabase')
      const colors = swatches.map(s => s.hex).filter(Boolean)
      if (colors.length === 0) { showToast('Nothing to save'); return }
      const { data: existing } = await supabase
        .from('saved_palettes')
        .select('id, colors')
        .eq('user_id', user.id)
      const isDuplicate = existing?.some(
        (p: { colors: string[] }) => JSON.stringify(p.colors) === JSON.stringify(colors)
      )
      if (isDuplicate) { showToast('Palette already saved'); return }
      const payload = { user_id: user.id, name, colors }
      const { error } = await supabase.from('saved_palettes').insert(payload)
      if (error) throw error
      showToast('Palette saved ✓')
      const savedCount = existing?.length ?? 0
      analytics.track('palette_saved', { palette_count: savedCount + 1, is_pro: isPro })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Save failed:', msg, err)
      showToast('Save failed — check console')
    }
  }

  const handleAiPalette = (hexes: string[]) => {
    setSwatches(hexes.map(h => makeSwatch(h)))
    analytics.track('palette_generated', { method: 'ai', style: harmonyMode, color_count: hexes.length })
  }


  const handleImageUpload = async (file: File) => {
    setImageUploading(true)
    try {
      const colors = await extractColorsFromFile(file)
      setSwatches(colors.slice(0, count).map(h => makeSwatch(h)))
      setActiveTool(null)
    } catch {
      showToast('Failed to extract colors')
    } finally {
      setImageUploading(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!user?.email) { showToast('Contact support to manage your subscription'); return }
    try {
      const url = await createPortalSession(user.email)
      window.location.href = url
    } catch {
      showToast('Contact support to manage your subscription')
    }
  }

  const copyHex = async (id: string, hex: string) => {
    try {
      await navigator.clipboard.writeText(hex.toUpperCase())
      setCopiedId(id)
      showToast('Copied!')
      setTimeout(() => setCopiedId(null), 1200)
    } catch { /* silent */ }
  }

  const startEdit = (id: string, hex: string) => {
    setEditingId(id)
    setEditValue(hex.replace('#', '').toUpperCase())
  }

  const confirmEdit = (id: string) => {
    const parsed = parseHex(editValue)
    if (parsed) editSwatch(id, parsed)
    setEditingId(null)
  }

  const handleHarmonySelect = (mode: HarmonyMode) => {
    setHarmonyMode(mode)
    setHarmonyOpen(false)
    triggerGenerate('button')
  }

  const handleToolClick = (tool: ToolId) => {
    if (tool === 'generate') {
      triggerGenerate('button')
      return
    }
    if (tool === 'extract') {
      if (!isPro) { openProModal('image_extraction', 'dock'); return }
      setActiveTool(activeTool === 'extract' ? null : 'extract')
      return
    }
    if (tool === 'preview') {
      setActiveTool(activeTool === 'preview' ? null : 'preview')
      return
    }
    setActiveTool(activeTool === tool ? null : tool)
  }

  const visionFilter = visionMode !== 'normal' ? `url(#vision-${visionMode})` : undefined
  const dockW = dockExpanded ? 200 : 80

  // ─── Render ────────────────────────────────────────────────
  return (
    <>
      <div className="flex w-screen overflow-hidden" style={{ height: '100dvh', backgroundColor: '#EEEEEC' }}>
        {/* Skip link */}
        <a
          href="#main-canvas"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-[#6C47FF] focus:rounded-lg focus:border focus:border-[#6C47FF] focus:font-medium"
        >
          Skip to main content
        </a>
        <h1 className="absolute w-px h-px overflow-hidden" style={{ clip: 'rect(0,0,0,0)' }}>
          Paletta — Free Color Palette Generator
        </h1>

        {/* ─── Side Dock ─── */}
        <aside
          className="shrink-0 z-40 flex flex-col"
          style={{
            width: dockW,
            transition: 'width 200ms ease',
            padding: '12px 8px 12px 8px',
          }}
        >
          <nav
            className="flex-1 flex flex-col"
            style={{
              borderRadius: 16,
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.04)',
              padding: dockExpanded ? '14px 10px' : '12px 8px',
            }}
          >
            {/* Dock logo */}
            <div
              className="flex items-center shrink-0"
              style={{
                justifyContent: dockExpanded ? 'flex-start' : 'center',
                padding: dockExpanded ? '2px 6px 0' : '2px 0 0',
                marginBottom: 10,
                gap: 10,
              }}
            >
              <div
                className="flex items-center justify-center text-white font-bold shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: BRAND_VIOLET,
                  fontSize: 16,
                }}
              >
                P
              </div>
              {dockExpanded && (
                <span className="text-[14px] font-bold" style={{ color: BRAND_DARK }}>Paletta</span>
              )}
            </div>

            {/* Creation tools group */}
            <div className="flex flex-col" style={{ gap: dockExpanded ? 2 : 6 }}>
              <DockItem
                icon={<Sparkles size={20} />}
                label="Generate"
                active={false}
                primary
                expanded={dockExpanded}
                onClick={() => handleToolClick('generate')}
                pulse={dockPulse}
              />
              <DockItem
                icon={<Eye size={20} />}
                label="Simulate"
                active={activeTool === 'simulate'}
                expanded={dockExpanded}
                onClick={() => handleToolClick('simulate')}
              />
              <DockItem
                icon={<LayoutDashboard size={20} />}
                label="Preview"
                active={activeTool === 'preview'}
                expanded={dockExpanded}
                onClick={() => handleToolClick('preview')}
              />
            </div>

            {/* Divider */}
            <div
              className="mx-auto shrink-0"
              style={{
                width: dockExpanded ? '80%' : 24,
                height: 1,
                backgroundColor: 'rgba(0,0,0,0.06)',
                margin: '8px auto',
              }}
            />

            {/* Utility tools group */}
            <div className="flex flex-col" style={{ gap: dockExpanded ? 2 : 6 }}>
              <DockItem
                icon={<Image size={20} />}
                label="Extract"
                active={activeTool === 'extract'}
                expanded={dockExpanded}
                onClick={() => handleToolClick('extract')}
                proBadge={!isPro}
              />
              <DockItem
                icon={<Star size={20} />}
                label="AI Palette"
                active={activeTool === 'ai'}
                expanded={dockExpanded}
                onClick={() => handleToolClick('ai')}
                badge={!isPro ? String(aiRemaining) : undefined}
              />
              <DockItem
                icon={<Heart size={20} />}
                label="Library"
                active={activeTool === 'library'}
                expanded={dockExpanded}
                onClick={() => handleToolClick('library')}
              />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Info / Legal links */}
            <DockInfoMenu expanded={dockExpanded} />

            {/* Collapse / Expand toggle */}
            {dockExpanded ? (
              <button
                onClick={toggleDock}
                className="flex items-center gap-2.5 w-full px-3.5 py-3 text-[13px] font-medium transition-all hover:bg-gray-100"
                style={{ borderRadius: 10, color: '#666' }}
                aria-label="Collapse dock"
              >
                <ChevronLeft size={18} />
                <span>Collapse</span>
              </button>
            ) : (
              <DarkTooltip label="Expand" position="right">
                <button
                  onClick={toggleDock}
                  className="mx-auto flex items-center justify-center transition-all"
                  style={{ width: 40, height: 40, flexShrink: 0, padding: 0, borderRadius: 10, color: '#9ca3af' }}
                  aria-label="Expand dock"
                >
                  <ChevronRight size={16} />
                </button>
              </DarkTooltip>
            )}
          </nav>
        </aside>

        {/* ─── Main Area (bento container) ─── */}
        <div
          className="relative flex-1 min-w-0 overflow-hidden"
          style={{
            margin: '12px 12px 12px 0',
            borderRadius: 24,
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 20px 50px -12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)',
          }}
        >
          {/* ─── Floating Harmony Pill (top-left) ─── */}
          <div
            ref={harmonyRef}
            className="absolute flex items-center"
            style={{
              top: 12,
              left: 12,
              zIndex: 70,
              height: 40,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.04)',
              padding: '0 4px',
            }}
          >
            <button
              onClick={() => setHarmonyOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-all hover:bg-black/5"
              style={{ borderRadius: 8, color: BRAND_DARK }}
              aria-expanded={harmonyOpen}
              aria-haspopup="listbox"
            >
              {HARMONIES.find(h => h.mode === harmonyMode)?.label ?? 'Random'}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {harmonyOpen && (
              <div
                className="absolute top-full left-0 mt-2 bg-white overflow-hidden"
                style={{ borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 220 }}
                role="listbox"
                aria-label="Harmony modes"
              >
                {HARMONIES.map(h => (
                  <button
                    key={h.mode}
                    role="option"
                    aria-selected={harmonyMode === h.mode}
                    onClick={() => handleHarmonySelect(h.mode)}
                    className="w-full flex flex-col px-4 py-3 text-left transition-all hover:bg-gray-50"
                    style={{
                      borderRadius: 6,
                      backgroundColor: harmonyMode === h.mode ? '#F3F0FF' : undefined,
                      color: harmonyMode === h.mode ? BRAND_VIOLET : BRAND_DARK,
                    }}
                  >
                    <span className="text-[13px] font-semibold">{h.label}</span>
                    <span className="text-[11px] opacity-60">{h.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Floating Actions Pill (top-right) ─── */}
          <header
            className="absolute flex items-center gap-1"
            style={{
              top: 12,
              right: 12,
              zIndex: 70,
              height: 40,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              border: '1px solid rgba(0,0,0,0.04)',
              padding: '0 6px',
            }}
          >
            {/* Save */}
            <DarkTooltip label="Save palette" position="bottom">
              <button
                onClick={handleSave}
                className="w-8 h-8 flex items-center justify-center transition-all hover:bg-black/5"
                style={{ borderRadius: 8 }}
                aria-label="Save palette"
              >
                <Heart size={16} style={{ color: BRAND_DARK }} />
              </button>
            </DarkTooltip>

            {/* Share */}
            <DarkTooltip label="Share" position="bottom">
              <button
                onClick={handleShare}
                className="w-8 h-8 flex items-center justify-center transition-all hover:bg-black/5"
                style={{ borderRadius: 8 }}
                aria-label="Share palette link"
              >
                {shareCopied ? <Check size={16} style={{ color: '#16a34a' }} /> : <Share2 size={16} style={{ color: BRAND_DARK }} />}
              </button>
            </DarkTooltip>

            {/* Export */}
            <DarkTooltip label="Export" position="bottom">
              <button
                onClick={() => setExportOpen(o => !o)}
                className="w-8 h-8 flex items-center justify-center transition-all hover:bg-black/5"
                style={{ borderRadius: 8 }}
                aria-label="Export palette"
              >
                <Download size={16} style={{ color: BRAND_DARK }} />
              </button>
            </DarkTooltip>

            {/* Divider */}
            <div className="w-px h-5 mx-0.5" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />

            {/* Go Pro (non-Pro) */}
            {!isPro && (
              <button
                onClick={() => openProModal()}
                className="h-7 px-3 text-white text-[12px] font-semibold transition-all hover:opacity-90"
                style={{ borderRadius: 8, backgroundColor: BRAND_VIOLET }}
              >
                Go Pro
              </button>
            )}

            {/* Auth */}
            {isSignedIn ? (
              <UserMenu
                email={user?.email ?? ''}
                isPro={isPro}
                onSignOut={signOut}
                onManage={handleManageSubscription}
              />
            ) : (
              <button
                onClick={() => setSignInOpen(true)}
                className="h-7 px-3 text-[12px] font-semibold transition-all hover:bg-black/5"
                style={{ borderRadius: 8, color: BRAND_DARK, border: '1px solid rgba(0,0,0,0.08)' }}
              >
                Sign In
              </button>
            )}
          </header>

          {/* ─── Horizontal Shade Bar ─── */}
          {shadesOpen && (() => {
            const sw = swatches.find(s => s.id === shadesOpen)
            return sw ? (
              <ShadeBar hex={sw.hex} onClose={() => setShadesOpen(null)} />
            ) : null
          })()}

          {/* ─── Color Canvas OR Preview Mode ─── */}
          {activeTool === 'preview' ? (
            <PreviewMode
              swatches={swatches}
              isPro={isPro}
              onClose={() => setActiveTool(null)}
              onGenerate={() => triggerGenerate('button')}
              onExport={() => setExportOpen(true)}
              onUndo={undo}
              onRedo={redo}
              onProGate={openProModal}
              onLock={lockSwatch}
            />
          ) : (
            <main
              id="main-canvas"
              className="absolute inset-0 overflow-hidden"
              style={{ filter: visionFilter }}
            >
              <div className="flex h-full">
                {swatches.map(s => {
                  const textColor = readableOn(s.hex)
                  const contrast = getContrastBadge(s.hex)
                  const isCopied = copiedId === s.id
                  const isEditing = editingId === s.id
                  const showShades = shadesOpen === s.id
                  const showInfo = infoOpen === s.id

                  return (
                    <div
                      key={s.id}
                      className="relative flex-1 flex flex-col items-center justify-center transition-all group/swatch"
                      style={{
                        backgroundColor: s.hex,
                        paddingTop: 70,
                        paddingBottom: 40,
                      }}
                    >
                      {/* Per-swatch vertical cluster */}
                      <div className="flex flex-col items-center justify-center gap-3">
                        {/* WCAG badge */}
                        <div
                          className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold text-white"
                          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                        >
                          {contrast.level} {contrast.ratio}:1 {contrast.pass ? '✓' : '✗'}
                        </div>

                        {/* Hex code — click to edit */}
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editValue}
                            onChange={e => setEditValue(e.target.value.replace(/[^0-9a-fA-F#]/g, '').slice(0, 7))}
                            onBlur={() => confirmEdit(s.id)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') confirmEdit(s.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                            className="bg-transparent border-b-2 text-center font-mono text-[16px] font-bold outline-none w-24"
                            style={{ color: textColor, borderColor: textColor }}
                            aria-label="Edit hex code"
                          />
                        ) : (
                          <button
                            onClick={() => startEdit(s.id, s.hex)}
                            className="font-mono text-[16px] font-bold tracking-wide cursor-text transition-all hover:opacity-80"
                            style={{ color: textColor }}
                            aria-label={`Edit color ${s.hex}`}
                          >
                            {s.hex.toUpperCase()}
                          </button>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-col items-center gap-1.5">
                          {/* Copy */}
                          <button
                            onClick={() => copyHex(s.id, s.hex)}
                            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all hover:scale-110"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.15)',
                              backdropFilter: 'blur(8px)',
                              color: textColor,
                            }}
                            aria-label={isCopied ? 'Copied' : 'Copy hex code'}
                          >
                            {isCopied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
                          </button>

                          {/* Info */}
                          <button
                            onClick={() => setInfoOpen(showInfo ? null : s.id)}
                            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all hover:scale-110"
                            style={{
                              backgroundColor: showInfo ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                              backdropFilter: 'blur(8px)',
                              color: textColor,
                            }}
                            aria-label="Color info"
                          >
                            <Info size={14} strokeWidth={1.5} />
                          </button>

                          {/* Shades */}
                          <button
                            onClick={() => {
                              const next = showShades ? null : s.id
                              setShadesOpen(next)
                              if (next) analytics.track('shade_panel_opened')
                            }}
                            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all hover:scale-110"
                            style={{
                              backgroundColor: showShades ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                              backdropFilter: 'blur(8px)',
                              color: textColor,
                            }}
                            aria-label={showShades ? 'Close shades' : 'Show shades'}
                          >
                            <Grid3X3 size={14} strokeWidth={1.5} />
                          </button>

                          {/* Lock */}
                          <button
                            onClick={() => lockSwatch(s.id)}
                            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all hover:scale-110"
                            style={{
                              backgroundColor: s.locked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                              backdropFilter: 'blur(8px)',
                              color: textColor,
                            }}
                            aria-label={s.locked ? 'Unlock color' : 'Lock color'}
                          >
                            {s.locked ? <Lock size={14} strokeWidth={1.5} /> : <Unlock size={14} strokeWidth={1.5} />}
                          </button>
                        </div>

                        {/* Locked badge */}
                        {s.locked && (
                          <span
                            className="text-[10px] font-bold tracking-widest uppercase opacity-60"
                            style={{ color: textColor }}
                          >
                            LOCKED
                          </span>
                        )}
                      </div>

                      {/* Info popover */}
                      {showInfo && (
                        <ColorInfoPopover hex={s.hex} onClose={() => setInfoOpen(null)} />
                      )}

                      {/* Shades now rendered as horizontal bar above canvas */}
                    </div>
                  )
                })}
              </div>
            </main>
          )}

          {/* ─── Floating Tool Panels ─── */}
          {activeTool === 'simulate' && (
            <SimulatePanel
              mode={visionMode}
              isPro={isPro}
              onChange={m => {
                if (VISION_MODES.find(v => v.mode === m)?.pro && !isPro) {
                  openProModal('vision_sim', 'dock')
                  return
                }
                setVisionMode(m)
              }}
              onClose={() => setActiveTool(null)}
            />
          )}

          {activeTool === 'ai' && (
            <AiFloatingPanel
              onClose={() => setActiveTool(null)}
              onOpenFull={() => { setAiOpen(true); setActiveTool(null) }}
              isPro={isPro}
              aiRemaining={aiRemaining}
            />
          )}

          {activeTool === 'library' && (
            <LibraryPanel
              isSignedIn={isSignedIn}
              userId={user?.id}
              isPro={isPro}
              onLoad={hexes => { setSwatches(hexes.map(h => makeSwatch(h))); setActiveTool(null) }}
              onProGate={openProModal}
              onSignIn={() => setSignInOpen(true)}
              onClose={() => setActiveTool(null)}
            />
          )}

          {activeTool === 'extract' && (
            <ExtractDialog
              uploading={imageUploading}
              onFile={handleImageUpload}
              onClose={() => setActiveTool(null)}
              fileInputRef={fileInputRef}
            />
          )}

          {/* Vision mode badge */}
          {visionMode !== 'normal' && activeTool !== 'preview' && (
            <button
              onClick={() => setVisionMode('normal')}
              className="absolute top-[60px] left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur shadow-md text-[12px] font-medium hover:bg-white transition-all"
              style={{ color: '#374151' }}
            >
              <Eye size={14} />
              {visionMode.charAt(0).toUpperCase() + visionMode.slice(1)}
              <span className="text-gray-400 ml-1">✕</span>
            </button>
          )}

          {/* Bottom bar — color count + spacebar hint */}
          {!activeTool && !aiOpen && !exportOpen && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-3 py-1.5"
              style={{
                borderRadius: 10,
                backgroundColor: 'rgba(26,26,46,0.75)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {/* Color count controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { if (count > 3) setCount(count - 1) }}
                  className="w-6 h-6 flex items-center justify-center transition-all hover:bg-white/10"
                  style={{ borderRadius: 6, opacity: count <= 3 ? 0.3 : 1 }}
                  disabled={count <= 3}
                  aria-label="Remove color"
                >
                  <Minus size={12} style={{ color: '#fff' }} />
                </button>
                <span className="text-[12px] font-mono font-semibold text-white tabular-nums" style={{ minWidth: 14, textAlign: 'center' }}>
                  {count}
                </span>
                {(() => {
                  const freeMax = 5
                  const proMax = 8
                  const max = isPro ? proMax : freeMax
                  const atFreeLimit = !isPro && count >= freeMax
                  return (
                    <button
                      onClick={() => {
                        if (atFreeLimit) {
                          openProModal('color_count', 'canvas_bar')
                        } else if (count < max) {
                          setCount(count + 1)
                        }
                      }}
                      className="relative w-6 h-6 flex items-center justify-center transition-all hover:bg-white/10"
                      style={{ borderRadius: 6, opacity: !atFreeLimit && count >= max ? 0.3 : 1 }}
                      disabled={!atFreeLimit && count >= max}
                      aria-label={atFreeLimit ? 'Upgrade to Pro for more colors' : 'Add color'}
                    >
                      <Plus size={12} style={{ color: '#fff' }} />
                      {atFreeLimit && (
                        <span
                          className="absolute -top-1.5 -right-1.5 w-3 h-3 flex items-center justify-center rounded-full text-[6px] font-bold text-white"
                          style={{ backgroundColor: BRAND_VIOLET }}
                        >
                          P
                        </span>
                      )}
                    </button>
                  )
                })()}
              </div>

              {/* Divider */}
              <div className="w-px h-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />

              {/* Spacebar hint */}
              <div className="flex items-center gap-2">
                <kbd
                  className="inline-flex items-center justify-center h-5 px-2 rounded text-[10px] font-mono font-semibold"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
                >
                  Space
                </kbd>
                <span className="text-[12px] font-medium text-white/70">generate</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── Modals (full-screen, above everything) ─── */}
        <AiPrompt
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          onPalette={handleAiPalette}
          onFallback={triggerGenerate}
          onProGate={openProModal}
          onUsageChange={() => setAiRemaining(getAiRemaining())}
          onError={msg => showToast(msg)}
          colorCount={count}
        />

        {exportOpen && (
          <ExportPanel hexes={swatches.map(s => s.hex)} onClose={() => setExportOpen(false)} />
        )}

        <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} onGoogleSignIn={signInWithGoogle} />
        <ProUpgradeModal open={proModalOpen} onClose={() => setProModalOpen(false)} />
        <PaymentSuccessModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} />

        <SaveNameModal
          open={saveNameOpen}
          defaultName={defaultPaletteName}
          onConfirm={handleSaveConfirm}
          onClose={() => setSaveNameOpen(false)}
        />

        {user && (
          <SavedPalettesPanel
            open={savedOpen}
            onClose={() => setSavedOpen(false)}
            userId={user.id}
            onLoad={hexes => setSwatches(hexes.map(h => makeSwatch(h)))}
            isPro={isPro}
            onProGate={openProModal}
          />
        )}

        <VisionFilterDefs />

        {/* Hidden file input for image extraction */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleImageUpload(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* Cookie banner — fixed above everything, outside flex layout */}
      <div className="fixed top-0 left-0 right-0" style={{ zIndex: 100 }}>
        <CookieConsent />
      </div>

      {/* SEO content below fold */}
      <SEOContent />
    </>
  )
}

// ─── Dock Item ───────────────────────────────────────────────
function DockItem({
  icon, label, active, primary, expanded, onClick, badge, proBadge, pulse,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  primary?: boolean
  expanded: boolean
  onClick: () => void
  badge?: string
  proBadge?: boolean
  pulse?: boolean
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  // Collapsed: 48x48 centered ghost container
  // Expanded: full-width with label
  const isCollapsed = !expanded

  return (
    <div className="relative" style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'stretch' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => { if (isCollapsed) setShowTooltip(true) }}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center justify-center transition-all duration-150 ease-in-out${pulse ? ' dock-pulse' : ''}`}
        style={{
          width: isCollapsed ? 48 : '100%',
          height: isCollapsed ? 48 : undefined,
          minHeight: expanded ? 46 : undefined,
          flexShrink: 0,
          borderRadius: isCollapsed ? 12 : 10,
          padding: expanded ? '12px 14px' : '0',
          gap: expanded ? 12 : 0,
          justifyContent: expanded ? 'flex-start' : 'center',
          backgroundColor: primary
            ? BRAND_VIOLET
            : active
              ? (isCollapsed ? 'rgba(108,71,255,0.08)' : '#F3F0FF')
              : 'transparent',
          color: primary ? '#ffffff' : active ? BRAND_VIOLET : '#374151',
          fontWeight: active || primary ? 600 : 500,
          boxShadow: active && expanded ? `0 0 12px ${BRAND_VIOLET}30` : undefined,
        }}
        onMouseOver={(e) => {
          if (primary) (e.currentTarget.style.backgroundColor = '#7C5AFF')
          else if (!active) (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')
        }}
        onMouseOut={(e) => {
          if (primary) (e.currentTarget.style.backgroundColor = BRAND_VIOLET)
          else if (!active) (e.currentTarget.style.backgroundColor = 'transparent')
        }}
        aria-label={label}
      >
        <span className="shrink-0 relative" style={{ strokeWidth: primary || active ? 2 : 1.5 }}>
          {icon}
          {/* Badge overlay on collapsed icon container */}
          {isCollapsed && badge && (
            <span
              className="absolute flex items-center justify-center rounded-full font-bold text-white leading-none pointer-events-none"
              style={{
                top: -4,
                right: -4,
                minWidth: 16,
                height: 16,
                fontSize: 9,
                padding: '0 3px',
                backgroundColor: BRAND_VIOLET,
                border: '1px solid #ffffff',
              }}
            >
              {badge}
            </span>
          )}
          {isCollapsed && proBadge && (
            <span
              className="absolute flex items-center justify-center font-bold text-white leading-none pointer-events-none"
              style={{
                top: -4,
                right: -4,
                height: 14,
                fontSize: 7,
                padding: '0 4px',
                borderRadius: 4,
                backgroundColor: BRAND_VIOLET,
                border: '1px solid #ffffff',
              }}
            >
              PRO
            </span>
          )}
        </span>
        {expanded && (
          <span className="text-[14px] whitespace-nowrap flex items-center gap-1.5">
            {label}
            {badge && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: 'rgba(108,71,255,0.12)', color: BRAND_VIOLET }}
              >
                {badge}
              </span>
            )}
            {proBadge && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white"
                style={{ backgroundColor: BRAND_VIOLET }}
              >
                PRO
              </span>
            )}
          </span>
        )}
      </button>

      {/* Collapsed tooltip */}
      {showTooltip && isCollapsed && (
        <DarkTooltipBubble label={label} position="right" />
      )}
    </div>
  )
}

// ─── User Menu ───────────────────────────────────────────────
function UserMenu({
  email, isPro, onSignOut, onManage,
}: {
  email: string
  isPro: boolean
  onSignOut: () => void
  onManage: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const initial = email.charAt(0).toUpperCase()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[13px] font-bold text-white transition-all hover:ring-2 hover:ring-black/10"
        style={{ background: `linear-gradient(135deg, ${BRAND_VIOLET}, #9b82ff)` }}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 bg-white rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 200 }}
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-[13px] font-semibold m-0" style={{ color: BRAND_DARK }}>{email}</p>
            {isPro && (
              <span
                className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: BRAND_VIOLET }}
              >
                PRO
              </span>
            )}
          </div>
          {isPro && (
            <button
              onClick={() => { onManage(); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 transition-all"
              style={{ color: BRAND_DARK }}
            >
              Manage subscription
            </button>
          )}
          <button
            onClick={() => { onSignOut(); setOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 transition-all"
            style={{ color: '#dc2626' }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Color Info Popover ──────────────────────────────────────
function ColorInfoPopover({ hex, onClose }: { hex: string; onClose: () => void }) {
  const name = getColorName(hex)
  const { rgb, hsl } = getColorInfo(hex)

  return (
    <>
      {/* Click-outside overlay */}
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div
        className="absolute z-40 bg-white rounded-2xl overflow-hidden"
        style={{
          top: '50%',
          right: '100%',
          transform: 'translateY(-50%)',
          marginRight: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
          minWidth: 200,
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={`Color details for ${hex}`}
      >
        <div style={{ height: 8, backgroundColor: hex }} />
        <div style={{ padding: '12px 16px' }}>
          <p className="text-[15px] font-bold m-0" style={{ color: BRAND_DARK }}>{name}</p>
          <div className="mt-2 flex flex-col gap-1">
            <InfoRow label="HEX" value={hex.toUpperCase()} />
            <InfoRow label="RGB" value={rgb} />
            <InfoRow label="HSL" value={hsl} />
          </div>
        </div>
      </div>
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold tracking-wider opacity-40 w-7" style={{ color: BRAND_DARK }}>{label}</span>
      <span className="text-[12px] font-mono" style={{ color: '#374151' }}>{value}</span>
    </div>
  )
}

// ─── Shade Bar (horizontal overlay) ─────────────────────────
function ShadeBar({ hex, onClose }: { hex: string; onClose: () => void }) {
  const shades = useMemo(() => generateShades(hex, 10), [hex])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const handleCopy = async (shade: string, i: number) => {
    try {
      await navigator.clipboard.writeText(shade.toUpperCase())
      setCopiedIdx(i)
      showToast('Copied!')
      setTimeout(() => setCopiedIdx(null), 1200)
    } catch { /* silent */ }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="absolute left-0 right-0 z-20 flex items-stretch"
      style={{ bottom: 0, height: 50 }}
      role="region"
      aria-label="Shade scale"
    >
      {shades.map((shade, i) => {
        const labelColor = readableOn(shade)
        const isCopied = copiedIdx === i
        const isBase = TAILWIND_SHADE_LABELS[i] === 500
        return (
          <button
            key={shade + i}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all hover:opacity-90"
            style={{
              backgroundColor: shade,
              outline: isBase ? `2px solid ${labelColor}` : undefined,
              outlineOffset: -2,
            }}
            onClick={() => handleCopy(shade, i)}
            aria-label={`Copy shade ${TAILWIND_SHADE_LABELS[i]}: ${shade}`}
          >
            <span className="text-[9px] font-mono font-semibold opacity-60" style={{ color: labelColor }}>
              {TAILWIND_SHADE_LABELS[i]}
            </span>
            <span className="text-[10px] font-mono font-medium" style={{ color: labelColor }}>
              {isCopied ? '✓' : shade.toUpperCase()}
            </span>
          </button>
        )
      })}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center bg-black/20 hover:bg-black/40 text-white transition-all"
        aria-label="Close shades"
      >
        <X size={10} />
      </button>
    </div>
  )
}

// ─── Dock Info Menu ─────────────────────────────────────────
function DockInfoMenu({ expanded }: { expanded: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const links = [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
  ]

  const shortcuts = [
    { key: 'Space', desc: 'Generate' },
    { key: 'U', desc: 'Undo' },
    { key: 'R', desc: 'Redo' },
  ]

  if (expanded) {
    return (
      <div className="flex flex-col gap-0.5 py-2 border-t border-gray-100 mt-1">
        {links.map(l => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-gray-100"
            style={{ color: '#9ca3af', textDecoration: 'none' }}
          >
            {l.label}
            <ExternalLink size={10} className="opacity-40" />
          </a>
        ))}
        <div className="px-3 pt-1">
          <p className="text-[9px] m-0" style={{ color: '#d1d5db' }}>
            Built with Paletta
          </p>
        </div>
      </div>
    )
  }

  // Collapsed: icon trigger with floating popover
  return (
    <div ref={ref} className="relative flex justify-center py-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
        style={{ color: '#9ca3af' }}
        aria-label="Info and legal links"
        aria-expanded={open}
      >
        <MoreHorizontal size={20} />
      </button>

      {open && (
        <div
          className="absolute z-50 bg-white rounded-xl overflow-hidden"
          style={{
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            minWidth: 200,
            padding: '8px 0',
          }}
          role="menu"
        >
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium transition-all hover:bg-gray-50"
              style={{ color: '#374151', textDecoration: 'none' }}
              role="menuitem"
            >
              {l.label}
              <ExternalLink size={10} className="opacity-40 ml-auto" />
            </a>
          ))}

          <div className="border-t border-gray-100 my-1" />

          <div className="px-4 py-1.5">
            <p className="text-[10px] font-semibold m-0 mb-1" style={{ color: '#9ca3af' }}>Shortcuts</p>
            {shortcuts.map(s => (
              <div key={s.key} className="flex items-center justify-between py-0.5">
                <span className="text-[11px]" style={{ color: '#6b7280' }}>{s.desc}</span>
                <kbd
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
                >
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 my-1" />
          <div className="px-4 py-1">
            <p className="text-[10px] m-0" style={{ color: '#d1d5db' }}>Built with Paletta</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Simulate Panel ──────────────────────────────────────────
function SimulatePanel({
  mode, isPro, onChange, onClose,
}: {
  mode: VisionMode
  isPro: boolean
  onChange: (m: VisionMode) => void
  onClose: () => void
}) {
  return (
    <FloatingPanel title="Vision simulation" width={280} onClose={onClose}>
      <div className="flex flex-col gap-1">
        {VISION_MODES.map(v => (
          <button
            key={v.mode}
            onClick={() => onChange(v.mode)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all hover:bg-gray-50"
            style={{
              backgroundColor: mode === v.mode ? '#F3F0FF' : undefined,
              color: mode === v.mode ? BRAND_VIOLET : BRAND_DARK,
            }}
          >
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold">{v.label}</span>
              <span className="text-[11px] opacity-50">{v.desc}</span>
            </div>
            {v.pro && !isPro && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white shrink-0 ml-2"
                style={{ backgroundColor: BRAND_VIOLET }}
              >
                PRO
              </span>
            )}
          </button>
        ))}
      </div>
    </FloatingPanel>
  )
}

// ─── AI Floating Panel (quick access — opens full AiPrompt) ─
function AiFloatingPanel({
  onClose, onOpenFull, isPro, aiRemaining,
}: {
  onClose: () => void
  onOpenFull: () => void
  isPro: boolean
  aiRemaining: number
}) {
  const [prompt, setPrompt] = useState('')

  return (
    <FloatingPanel title="AI palette" width={320} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            autoFocus
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && prompt.trim()) onOpenFull() }}
            placeholder="Describe a mood or theme…"
            className="flex-1 h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-[#6C47FF] transition-all"
            style={{ color: BRAND_DARK }}
          />
          <button
            onClick={onOpenFull}
            className="h-10 px-4 rounded-xl text-white text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: BRAND_VIOLET }}
          >
            Generate
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-1.5">
          {['Warm sunset', 'Ocean breeze', 'Forest canopy', 'Neon cyber', 'Pastel dream', 'Earthy tones'].map(chip => (
            <button
              key={chip}
              onClick={() => { setPrompt(chip); onOpenFull() }}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all hover:bg-gray-100"
              style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
            >
              {chip}
            </button>
          ))}
        </div>

        <p className="text-[11px] opacity-50 m-0" style={{ color: BRAND_DARK }}>
          {isPro ? '✦ Unlimited prompts' : `${aiRemaining}/day free · Unlimited with Pro`}
        </p>
      </div>
    </FloatingPanel>
  )
}

// ─── Library Panel ───────────────────────────────────────────
function LibraryPanel({
  isSignedIn, userId, isPro, onLoad, onProGate, onSignIn, onClose,
}: {
  isSignedIn: boolean
  userId?: string
  isPro: boolean
  onLoad: (hexes: string[]) => void
  onProGate: () => void
  onSignIn: () => void
  onClose: () => void
}) {
  const [palettes, setPalettes] = useState<{ id: string; name: string; colors: string[] }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isSignedIn || !userId) return
    setLoading(true)
    ;(async () => {
      try {
        const { supabase } = await import('../lib/supabase')
        const { data } = await supabase
          .from('saved_palettes')
          .select('id, name, colors')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
        setPalettes(data ?? [])
      } catch { /* silent */ }
      finally { setLoading(false) }
    })()
  }, [isSignedIn, userId])

  return (
    <FloatingPanel title="Saved palettes" width={280} onClose={onClose}>
      {!isSignedIn ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <Heart size={24} style={{ color: '#d1d5db' }} />
          <p className="text-[13px] m-0" style={{ color: '#6b7280' }}>Sign in to save palettes</p>
          <button
            onClick={onSignIn}
            className="h-9 px-4 rounded-full text-white text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: BRAND_VIOLET }}
          >
            Sign In
          </button>
        </div>
      ) : loading ? (
        <p className="text-[13px] text-center py-4" style={{ color: '#6b7280' }}>Loading…</p>
      ) : palettes.length === 0 ? (
        <p className="text-[13px] text-center py-4" style={{ color: '#6b7280' }}>No saved palettes yet</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
          {palettes.map(p => (
            <button
              key={p.id}
              onClick={() => onLoad(p.colors)}
              className="w-full flex flex-col gap-1.5 p-2 rounded-xl border border-gray-100 hover:border-gray-300 transition-all text-left"
            >
              <div className="flex h-[38px] rounded-lg overflow-hidden border border-gray-100">
                {p.colors.map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="text-[12px] font-medium truncate" style={{ color: BRAND_DARK }}>
                {p.name || 'Untitled'}
              </span>
            </button>
          ))}

          {/* Slot counter */}
          {!isPro && (
            <p className="text-[11px] text-center mt-1" style={{ color: '#6b7280' }}>
              {palettes.length} of 3 free ·{' '}
              <button
                onClick={onProGate}
                className="underline font-semibold"
                style={{ color: BRAND_VIOLET }}
              >
                Go Pro
              </button>
            </p>
          )}
        </div>
      )}
    </FloatingPanel>
  )
}

// ─── Extract Dialog ──────────────────────────────────────────
function ExtractDialog({
  uploading, onFile, onClose, fileInputRef,
}: {
  uploading: boolean
  onFile: (file: File) => void
  onClose: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onFile(file)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="absolute z-50 bg-white rounded-2xl overflow-hidden"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 440,
          boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
        }}
        role="dialog"
        aria-label="Extract colors from image"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[16px] font-bold m-0" style={{ color: BRAND_DARK }}>
            Extract from image
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all"
            aria-label="Close"
          >
            <X size={16} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          className="mx-5 my-4 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer"
          style={{
            height: 180,
            borderColor: dragOver ? BRAND_VIOLET : '#d1d5db',
            backgroundColor: dragOver ? '#F3F0FF' : '#fafafa',
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <p className="text-[14px] font-medium" style={{ color: '#6b7280' }}>Analyzing…</p>
          ) : (
            <>
              <Image size={32} style={{ color: '#d1d5db' }} />
              <p className="text-[14px] font-medium m-0" style={{ color: '#374151' }}>
                Drop image here
              </p>
              <p className="text-[12px] m-0" style={{ color: '#9ca3af' }}>
                or click to browse · PNG, JPG, WebP
              </p>
            </>
          )}
        </div>

        <div className="px-5 pb-4">
          <p className="text-[11px] m-0" style={{ color: '#9ca3af' }}>
            Colors are extracted using k-means clustering
          </p>
        </div>
      </div>
    </>
  )
}

// ─── Preview Mode ────────────────────────────────────────────
function PreviewMode({
  swatches, isPro, onClose, onGenerate, onExport, onUndo, onRedo, onProGate, onLock,
}: {
  swatches: { id: string; hex: string; locked: boolean }[]
  isPro: boolean
  onClose: () => void
  onGenerate: () => void
  onExport: () => void
  onUndo: () => void
  onRedo: () => void
  onProGate: (feature?: string, source?: string) => void
  onLock: (id: string) => void
}) {
  const hexes = swatches.map(s => s.hex)
  const c = (i: number) => hexes[i % hexes.length]

  const handleCopyCSS = async () => {
    const css = hexes.map((h, i) => `  --color-${i + 1}: ${h};`).join('\n')
    try {
      await navigator.clipboard.writeText(`:root {\n${css}\n}`)
      showToast('CSS variables copied!')
    } catch { /* silent */ }
  }

  const handleExportTailwind = () => {
    showToast('Use Export panel for full Tailwind config')
    onExport()
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ transition: 'all 400ms cubic-bezier(0.4,0,0.2,1)' }}>
      {/* ─ Slim palette strip ─ */}
      <div
        className="flex-none flex items-stretch relative z-10"
        style={{ height: 60, marginTop: 60 }}
      >
        {swatches.map(s => (
          <div
            key={s.id}
            className="flex-1 flex items-center justify-center"
            style={{ backgroundColor: s.hex }}
          >
            <span
              className="font-mono text-[10px] font-semibold"
              style={{ color: readableOn(s.hex) }}
            >
              {s.hex.toUpperCase()}
            </span>
          </div>
        ))}
        <button
          onClick={onClose}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center bg-black/20 hover:bg-black/40 text-white transition-all"
          aria-label="Exit preview mode"
        >
          <X size={12} />
        </button>
      </div>

      {/* ─ Export actions bar ─ */}
      <div
        className="flex-none flex items-center justify-between px-6 border-b"
        style={{ height: 44, backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
      >
        <span className="text-[13px] font-semibold" style={{ color: BRAND_DARK }}>Preview</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportTailwind}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium transition-all hover:bg-gray-50"
            style={{ border: '1px solid #e5e7eb', color: BRAND_DARK }}
          >
            <Download size={13} />
            Export Tailwind config
          </button>
          <button
            onClick={handleCopyCSS}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium transition-all hover:bg-gray-50"
            style={{ border: '1px solid #e5e7eb', color: BRAND_DARK }}
          >
            <Copy size={13} />
            Copy CSS variables
          </button>
        </div>
      </div>

      {/* ─ Mockup grid ─ */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: '#f5f5f4', padding: 24 }}
      >
        <div
          className="grid gap-4 mx-auto"
          style={{ gridTemplateColumns: '1fr 1fr', maxWidth: 1100 }}
        >
          {/* Card 1: Landing page (FREE) */}
          <MockupCard label="Landing page" badge="Free" badgeStyle="free">
            <LandingMockup c={c} />
          </MockupCard>

          {/* Card 2: Dashboard (PRO) */}
          <MockupCard
            label="Dashboard"
            badge="PRO"
            badgeStyle="pro"
            blurred={!isPro}
            onProClick={() => onProGate('preview_dashboard', 'preview_grid')}
          >
            <DashboardMockup c={c} />
          </MockupCard>

          {/* Card 3: Mobile app (PRO, full width) */}
          <div style={{ gridColumn: '1 / -1' }}>
            <MockupCard
              label="Mobile app"
              badge="PRO"
              badgeStyle="pro"
              blurred={!isPro}
              onProClick={() => onProGate('preview_mobile', 'preview_grid')}
            >
              <MobileAppMockup c={c} />
            </MockupCard>
          </div>
        </div>

        {/* Spacer for footer */}
        <div style={{ height: 80 }} />
      </div>

      {/* ─ Floating control footer ─ */}
      <div
        className="absolute z-20 flex items-center gap-3"
        style={{
          bottom: 14,
          left: 14,
          right: 14,
          height: 56,
          borderRadius: 16,
          backgroundColor: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 2px 28px rgba(0,0,0,0.06), inset 0 0 0 0.5px rgba(255,255,255,0.6)',
          padding: '0 16px',
        }}
      >
        {/* Color swatches */}
        <div className="flex items-center gap-2">
          {swatches.map(s => (
            <button
              key={s.id}
              onClick={() => onLock(s.id)}
              className="relative w-9 h-9 rounded-lg transition-all hover:scale-105"
              style={{ backgroundColor: s.hex, border: '1px solid rgba(0,0,0,0.08)' }}
              aria-label={`${s.hex} ${s.locked ? '(locked)' : ''}`}
            >
              {s.locked && (
                <Lock size={10} className="absolute bottom-0.5 right-0.5" style={{ color: readableOn(s.hex) }} />
              )}
            </button>
          ))}
          {swatches.length < 8 && (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ border: '2px dashed #d1d5db' }}
            >
              <Plus size={14} style={{ color: '#9ca3af' }} />
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-7" style={{ backgroundColor: '#e5e7eb' }} />

        {/* Tool buttons */}
        <div className="flex items-center gap-1.5">
          <DarkTooltip label="Shuffle" position="top">
            <button
              onClick={onGenerate}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
              aria-label="Generate new palette"
            >
              <RefreshCw size={15} style={{ color: BRAND_DARK }} />
            </button>
          </DarkTooltip>
          <DarkTooltip label="Adjust" position="top">
            <button
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
              aria-label="HSL adjust (coming soon)"
            >
              <SlidersHorizontal size={15} style={{ color: BRAND_DARK }} />
            </button>
          </DarkTooltip>
          <DarkTooltip label="Undo" position="top">
            <button
              onClick={onUndo}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
              aria-label="Undo"
            >
              <Undo2 size={15} style={{ color: BRAND_DARK }} />
            </button>
          </DarkTooltip>
          <DarkTooltip label="Redo" position="top">
            <button
              onClick={onRedo}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
              aria-label="Redo"
            >
              <Redo2 size={15} style={{ color: BRAND_DARK }} />
            </button>
          </DarkTooltip>
        </div>

        <div className="flex-1" />

        {/* Generate + Export */}
        <button
          onClick={onGenerate}
          className="flex items-center gap-2 h-9 px-4 rounded-full text-[13px] font-medium transition-all hover:bg-gray-200"
          style={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', color: BRAND_DARK }}
        >
          <Sparkles size={14} />
          Generate
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-2 h-9 px-4 rounded-full text-white text-[13px] font-semibold transition-all hover:opacity-90"
          style={{ backgroundColor: BRAND_VIOLET }}
        >
          <Download size={14} />
          Export
        </button>
      </div>
    </div>
  )
}

// ─── Mockup Card Wrapper ─────────────────────────────────────
function MockupCard({
  label, badge, badgeStyle, blurred, onProClick, children,
}: {
  label: string
  badge: string
  badgeStyle: 'free' | 'pro'
  blurred?: boolean
  onProClick?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3" style={{ height: 32, backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#eab308' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
        </div>
        <div className="flex-1 h-5 rounded-md" style={{ backgroundColor: '#e5e7eb', maxWidth: 200 }} />
      </div>

      {/* Content */}
      <div className="relative">
        <div style={{ filter: blurred ? 'blur(4px)' : undefined, opacity: blurred ? 0.55 : 1 }}>
          {children}
        </div>

        {/* PRO lock overlay */}
        {blurred && (
          <button
            onClick={onProClick}
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            aria-label={`Unlock ${label} preview`}
          >
            <div
              className="flex flex-col items-center gap-2"
              style={{
                backgroundColor: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: 16,
                padding: '16px 24px',
              }}
            >
              <Lock size={24} style={{ color: BRAND_VIOLET }} />
              <span className="text-[13px] font-semibold" style={{ color: BRAND_VIOLET }}>
                Preview {label.toLowerCase()}
              </span>
              <span
                className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: BRAND_VIOLET }}
              >
                PRO
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Label */}
      <div className="flex items-center gap-2 px-3 py-2 border-t" style={{ borderColor: '#f3f4f6' }}>
        <span className="text-[12px] font-medium" style={{ color: BRAND_DARK }}>{label}</span>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: badgeStyle === 'pro' ? BRAND_VIOLET : '#e5e7eb',
            color: badgeStyle === 'pro' ? '#ffffff' : '#374151',
          }}
        >
          {badge}
        </span>
      </div>
    </div>
  )
}

// ─── Landing Page Mockup ─────────────────────────────────────
function LandingMockup({ c }: { c: (i: number) => string }) {
  return (
    <div style={{ height: 280 }}>
      {/* Nav */}
      <div className="flex items-center justify-between px-4" style={{ height: 36, backgroundColor: '#ffffff' }}>
        <div className="w-16 h-3 rounded" style={{ backgroundColor: c(0) }} />
        <div className="flex gap-3">
          <div className="w-10 h-2.5 rounded bg-gray-200" />
          <div className="w-10 h-2.5 rounded bg-gray-200" />
          <div className="w-14 h-6 rounded-full" style={{ backgroundColor: c(1) }} />
        </div>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center" style={{ height: 140, backgroundColor: c(0) }}>
        <div className="w-32 h-3 rounded-full mb-2" style={{ backgroundColor: readableOn(c(0)), opacity: 0.8 }} />
        <div className="w-48 h-2 rounded-full mb-4" style={{ backgroundColor: readableOn(c(0)), opacity: 0.4 }} />
        <div className="flex gap-2">
          <div className="w-20 h-7 rounded-full" style={{ backgroundColor: c(1) }} />
          <div className="w-20 h-7 rounded-full" style={{ border: `1.5px solid ${readableOn(c(0))}`, opacity: 0.5 }} />
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-3 p-4" style={{ backgroundColor: '#ffffff' }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: c(i + 2) }} />
            <div className="w-12 h-1.5 rounded bg-gray-200" />
            <div className="w-16 h-1 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard Mockup ────────────────────────────────────────
function DashboardMockup({ c }: { c: (i: number) => string }) {
  return (
    <div className="flex" style={{ height: 280 }}>
      {/* Sidebar */}
      <div className="flex flex-col gap-2 p-2" style={{ width: 60, backgroundColor: c(0) }}>
        <div className="w-7 h-7 rounded-lg mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-7 h-5 rounded mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 p-3" style={{ backgroundColor: '#f9fafb' }}>
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-lg p-2" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
              <div className="w-8 h-1.5 rounded bg-gray-200 mb-1" />
              <div className="w-12 h-3 rounded" style={{ backgroundColor: c(i + 1), opacity: 0.8 }} />
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="rounded-lg p-3" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', height: 140 }}>
          <div className="w-16 h-2 rounded bg-gray-200 mb-3" />
          <div className="flex items-end gap-1.5 h-[90px]">
            {[65, 40, 80, 55, 90, 45, 70, 60].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${h}%`, backgroundColor: c(i), opacity: 0.7 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mobile App Mockup ───────────────────────────────────────
function MobileAppMockup({ c }: { c: (i: number) => string }) {
  return (
    <div className="flex justify-center gap-4 py-4 px-6" style={{ height: 300, backgroundColor: '#f9fafb' }}>
      {[0, 1, 2].map(screen => (
        <div
          key={screen}
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{ width: 120, backgroundColor: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-2" style={{ height: 18, backgroundColor: c(screen), fontSize: 8 }}>
            <span style={{ color: readableOn(c(screen)), opacity: 0.6, fontSize: 7 }}>9:41</span>
            <div className="flex gap-0.5">
              <div className="w-2 h-1.5 rounded-sm" style={{ backgroundColor: readableOn(c(screen)), opacity: 0.4 }} />
              <div className="w-2 h-1.5 rounded-sm" style={{ backgroundColor: readableOn(c(screen)), opacity: 0.4 }} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-2 flex flex-col gap-1.5">
            {screen === 0 && (
              <>
                <div className="w-16 h-2 rounded" style={{ backgroundColor: c(0), opacity: 0.8 }} />
                <div className="w-full h-1.5 rounded bg-gray-100" />
                <div className="w-3/4 h-1.5 rounded bg-gray-100" />
                <div className="mt-1 w-14 h-5 rounded-full" style={{ backgroundColor: c(1) }} />
              </>
            )}
            {screen === 1 && (
              <>
                <div className="w-12 h-2 rounded bg-gray-200" />
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="h-8 rounded" style={{ backgroundColor: c(i), opacity: 0.6 }} />
                  ))}
                </div>
              </>
            )}
            {screen === 2 && (
              <>
                <div className="w-full h-16 rounded-lg" style={{ backgroundColor: c(2), opacity: 0.5 }} />
                <div className="w-14 h-2 rounded bg-gray-200 mt-1" />
                <div className="w-full h-1.5 rounded bg-gray-100" />
              </>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex items-center justify-around px-1" style={{ height: 22, borderTop: '1px solid #e5e7eb' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: i === screen ? c(screen) : '#d1d5db' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Floating Panel Wrapper ──────────────────────────────────
function FloatingPanel({
  title, width, onClose, children,
}: {
  title: string
  width: number
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="absolute z-30 bg-white overflow-hidden"
      style={{
        borderRadius: 12,
        top: 60,
        left: 12,
        width,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        padding: 14,
      }}
      role="dialog"
      aria-label={title}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-bold m-0" style={{ color: BRAND_DARK }}>{title}</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-all"
          aria-label={`Close ${title}`}
        >
          <X size={14} style={{ color: '#6b7280' }} />
        </button>
      </div>
      {children}
    </div>
  )
}

// ─── Dark Tooltip ────────────────────────────────────────────
const TOOLTIP_BG = '#1F2937'

/** Positioned tooltip bubble — used standalone (DockItem) or via DarkTooltip wrapper */
function DarkTooltipBubble({ label, position }: { label: string; position: 'right' | 'bottom' | 'top' }) {
  const posClass =
    position === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2'
    : position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    : 'top-full left-1/2 -translate-x-1/2 mt-2'

  const arrowStyle: React.CSSProperties = {
    width: 6, height: 6, backgroundColor: TOOLTIP_BG, transform: 'rotate(45deg)',
    ...(position === 'right'
      ? { left: -3, top: '50%', marginTop: -3 }
      : position === 'top'
        ? { bottom: -3, left: '50%', marginLeft: -3 }
        : { top: -3, left: '50%', marginLeft: -3 }),
  }

  return (
    <div className={`absolute z-50 whitespace-nowrap pointer-events-none ${posClass}`} role="tooltip">
      <div
        className="relative text-[11px] font-medium text-white"
        style={{ backgroundColor: TOOLTIP_BG, padding: '4px 9px', borderRadius: 6 }}
      >
        {label}
        <div className="absolute" style={arrowStyle} />
      </div>
    </div>
  )
}

/** Wrapper that shows a dark tooltip on hover */
function DarkTooltip({
  label, position, children,
}: {
  label: string
  position: 'right' | 'bottom' | 'top'
  children: React.ReactNode
}) {
  const [show, setShow] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && <DarkTooltipBubble label={label} position={position} />}
    </div>
  )
}

// ─── Import SEOContent ───────────────────────────────────────
import SEOContent from './SEOContent'
