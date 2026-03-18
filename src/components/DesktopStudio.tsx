import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Sparkles, Eye, LayoutDashboard, Image, Star, Heart,
  ChevronLeft, ChevronRight, Lock, Unlock, Copy, Check, Info,
  X, Share2, Download, Grid3X3,
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
import PreviewModal from './palette/PreviewModal'
import CookieConsent from './CookieConsent'
import {
  readableOn, getColorName, getColorInfo, getContrastBadge,
  makeSwatch, generateShades, TAILWIND_SHADE_LABELS,
  encodePalette, decodePalette, parseHex,
} from '../lib/colorEngine'
import { extractColorsFromFile } from '../lib/kMeans'
import { BRAND_VIOLET, BRAND_DARK, BRAND_WARM } from '../lib/tokens'
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
    generate, lockSwatch, editSwatch, setHarmonyMode,
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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [aiRemaining, setAiRemaining] = useState(getAiRemaining)
  const [shadesOpen, setShadesOpen] = useState<string | null>(null)
  const [infoOpen, setInfoOpen] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [imageUploading, setImageUploading] = useState(false)

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
    analytics.track('palette_generated', { method, style: harmonyMode, color_count: count })
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
        setPreviewOpen(false); setHarmonyOpen(false)
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
      setPreviewOpen(true)
      return
    }
    setActiveTool(activeTool === tool ? null : tool)
  }

  const visionFilter = visionMode !== 'normal' ? `url(#vision-${visionMode})` : undefined
  const dockW = dockExpanded ? 152 : 54

  // ─── Render ────────────────────────────────────────────────
  return (
    <>
      <div className="relative w-screen overflow-hidden" style={{ height: '100dvh', backgroundColor: BRAND_WARM }}>
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
          className="absolute top-0 left-0 bottom-0 z-40 flex flex-col"
          style={{ width: dockW, transition: 'width 200ms ease', padding: '66px 7px 10px 7px' }}
        >
          <nav
            className="flex-1 flex flex-col rounded-2xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 2px 28px rgba(0,0,0,0.06), inset 0 0 0 0.5px rgba(255,255,255,0.6)',
              padding: '8px 6px',
            }}
          >
            <div className="flex-1 flex flex-col gap-1">
              <DockItem
                icon={<Sparkles size={18} />}
                label="Generate"
                active={false}
                primary
                expanded={dockExpanded}
                onClick={() => handleToolClick('generate')}
              />
              <DockItem
                icon={<Eye size={18} />}
                label="Simulate"
                active={activeTool === 'simulate'}
                expanded={dockExpanded}
                onClick={() => handleToolClick('simulate')}
              />
              <DockItem
                icon={<LayoutDashboard size={18} />}
                label="Preview"
                active={activeTool === 'preview'}
                expanded={dockExpanded}
                onClick={() => handleToolClick('preview')}
              />
              <DockItem
                icon={<Image size={18} />}
                label="Extract"
                active={activeTool === 'extract'}
                expanded={dockExpanded}
                onClick={() => handleToolClick('extract')}
                proBadge={!isPro}
              />
              <DockItem
                icon={<Star size={18} />}
                label="AI Palette"
                active={activeTool === 'ai'}
                expanded={dockExpanded}
                onClick={() => handleToolClick('ai')}
                badge={dockExpanded && !isPro ? `${aiRemaining}/day` : undefined}
              />
              <DockItem
                icon={<Heart size={18} />}
                label="Library"
                active={activeTool === 'library'}
                expanded={dockExpanded}
                onClick={() => handleToolClick('library')}
              />
            </div>

            {/* Collapse toggle */}
            <button
              onClick={toggleDock}
              className="flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-[12px] font-medium transition-all hover:bg-gray-100"
              style={{ color: '#666', justifyContent: dockExpanded ? 'flex-start' : 'center' }}
              aria-label={dockExpanded ? 'Collapse dock' : 'Expand dock'}
            >
              {dockExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              {dockExpanded && <span>Collapse</span>}
            </button>
          </nav>
        </aside>

        {/* ─── Main Area ─── */}
        <div
          className="absolute top-0 right-0 bottom-0"
          style={{ left: dockW, transition: 'left 200ms ease' }}
        >
          {/* ─── Floating Header Pill ─── */}
          <header
            className="absolute z-30 flex items-center justify-between"
            style={{
              top: 11,
              left: 12,
              right: 12,
              height: 46,
              borderRadius: 9999,
              backgroundColor: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 2px 28px rgba(0,0,0,0.06), inset 0 0 0 0.5px rgba(255,255,255,0.6)',
              padding: '6px 9px 6px 15px',
            }}
          >
            {/* Left: Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[13px] font-bold"
                style={{ backgroundColor: BRAND_VIOLET }}
              >
                P
              </div>
              <span className="text-[13px] font-bold" style={{ color: BRAND_DARK }}>Paletta</span>
            </div>

            {/* Center: Harmony dropdown */}
            <div
              ref={harmonyRef}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <button
                onClick={() => setHarmonyOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all hover:bg-black/5"
                style={{ color: BRAND_DARK }}
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
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl overflow-hidden"
                  style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 220 }}
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

            {/* Right: Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Save */}
              <button
                onClick={handleSave}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-black/5"
                aria-label="Save palette"
              >
                <Heart size={16} style={{ color: BRAND_DARK }} />
              </button>

              {/* Share */}
              <button
                onClick={handleShare}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-black/5"
                aria-label="Share palette link"
              >
                {shareCopied ? <Check size={16} style={{ color: '#16a34a' }} /> : <Share2 size={16} style={{ color: BRAND_DARK }} />}
              </button>

              {/* Export */}
              <button
                onClick={() => setExportOpen(o => !o)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-black/5"
                aria-label="Export palette"
              >
                <Download size={16} style={{ color: BRAND_DARK }} />
              </button>

              {/* Divider */}
              <div className="w-px h-5 mx-1" style={{ backgroundColor: '#e5e7eb' }} />

              {/* Go Pro (non-Pro) or Manage (Pro) */}
              {!isPro && (
                <button
                  onClick={() => openProModal()}
                  className="h-7 px-3 rounded-full text-white text-[12px] font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: BRAND_VIOLET }}
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
                  className="h-7 px-3 rounded-full text-[12px] font-semibold transition-all hover:bg-black/5"
                  style={{ color: BRAND_DARK, border: '1px solid #e5e7eb' }}
                >
                  Sign In
                </button>
              )}
            </div>
          </header>

          {/* ─── Color Canvas ─── */}
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
                      flexGrow: showShades ? 2 : 1,
                      transition: 'flex-grow 250ms ease',
                    }}
                  >
                    {/* Per-swatch vertical cluster */}
                    <div className="flex flex-col items-center gap-3">
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
                          {isCopied ? <Check size={14} /> : <Copy size={14} />}
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
                          <Info size={14} />
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
                          <Grid3X3 size={14} />
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
                          {s.locked ? <Lock size={14} /> : <Unlock size={14} />}
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

                    {/* Shades panel — slides from right edge of swatch */}
                    {showShades && (
                      <ShadesColumn hex={s.hex} onClose={() => setShadesOpen(null)} />
                    )}
                  </div>
                )
              })}
            </div>
          </main>

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
          {visionMode !== 'normal' && (
            <button
              onClick={() => setVisionMode('normal')}
              className="absolute top-[66px] left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur shadow-md text-[12px] font-medium hover:bg-white transition-all"
              style={{ color: '#374151' }}
            >
              <Eye size={14} />
              {visionMode.charAt(0).toUpperCase() + visionMode.slice(1)}
              <span className="text-gray-400 ml-1">✕</span>
            </button>
          )}

          {/* Spacebar hint — show when no panel open */}
          {!activeTool && !previewOpen && !aiOpen && !exportOpen && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: 'rgba(26,26,46,0.75)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <kbd
                className="inline-flex items-center justify-center h-5 px-2 rounded text-[10px] font-mono font-semibold"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
              >
                Space
              </kbd>
              <span className="text-[12px] font-medium text-white/70">generate</span>
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
        <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} onProGate={openProModal} />
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
        <CookieConsent />

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

      {/* SEO content below fold */}
      <SEOContent />
    </>
  )
}

// ─── Dock Item ───────────────────────────────────────────────
function DockItem({
  icon, label, active, primary, expanded, onClick, badge, proBadge,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  primary?: boolean
  expanded: boolean
  onClick: () => void
  badge?: string
  proBadge?: boolean
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => { if (!expanded) setShowTooltip(true) }}
        onMouseLeave={() => setShowTooltip(false)}
        className="w-full flex items-center gap-2.5 rounded-xl transition-all"
        style={{
          padding: expanded ? '10px 12px' : '10px 0',
          justifyContent: expanded ? 'flex-start' : 'center',
          backgroundColor: primary ? BRAND_VIOLET : active ? '#F3F0FF' : 'transparent',
          color: primary ? '#ffffff' : active ? BRAND_VIOLET : '#374151',
          fontWeight: active || primary ? 600 : 500,
          minHeight: 40,
        }}
        aria-label={label}
      >
        <span className="shrink-0" style={{ strokeWidth: primary || active ? 2.5 : 2 }}>{icon}</span>
        {expanded && (
          <span className="text-[13px] whitespace-nowrap flex items-center gap-1.5">
            {label}
            {badge && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
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
      {showTooltip && !expanded && (
        <div
          className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-white whitespace-nowrap z-50"
          style={{ backgroundColor: BRAND_DARK, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          role="tooltip"
        >
          {/* Arrow */}
          <div
            className="absolute right-full top-1/2 -translate-y-1/2"
            style={{
              width: 0, height: 0,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderRight: `5px solid ${BRAND_DARK}`,
            }}
          />
          {label}
        </div>
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

// ─── Shades Column ───────────────────────────────────────────
function ShadesColumn({ hex, onClose }: { hex: string; onClose: () => void }) {
  const shades = generateShades(hex, 10)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const handleCopy = async (shade: string, i: number) => {
    try {
      await navigator.clipboard.writeText(shade.toUpperCase())
      setCopiedIdx(i)
      showToast('Copied!')
      setTimeout(() => setCopiedIdx(null), 1200)
    } catch { /* silent */ }
  }

  return (
    <div
      className="absolute top-0 right-0 bottom-0 flex flex-col z-10"
      style={{ width: 120, backgroundColor: 'rgba(0,0,0,0.08)' }}
    >
      {/* Close */}
      <button
        onClick={e => { e.stopPropagation(); onClose() }}
        className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full flex items-center justify-center bg-black/20 hover:bg-black/40 text-white transition-all"
        aria-label="Close shades"
      >
        <X size={10} />
      </button>

      {shades.map((shade, i) => {
        const labelColor = readableOn(shade)
        const isCopied = copiedIdx === i
        return (
          <button
            key={shade + i}
            className="flex-1 flex items-center justify-between px-2 cursor-pointer hover:opacity-90 transition-all"
            style={{ backgroundColor: shade }}
            onClick={e => { e.stopPropagation(); handleCopy(shade, i) }}
            aria-label={`Copy shade ${TAILWIND_SHADE_LABELS[i]}: ${shade}`}
          >
            <span className="text-[9px] font-mono opacity-50" style={{ color: labelColor }}>
              {TAILWIND_SHADE_LABELS[i]}
            </span>
            <span className="text-[10px] font-mono opacity-70" style={{ color: labelColor }}>
              {isCopied ? '✓' : shade.toUpperCase()}
            </span>
          </button>
        )
      })}
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
      className="absolute z-30 bg-white rounded-2xl overflow-hidden"
      style={{
        top: 70,
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

// ─── Import SEOContent ───────────────────────────────────────
import SEOContent from './SEOContent'
