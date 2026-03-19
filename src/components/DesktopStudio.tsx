import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Shuffle, Sparkles, Eye, Image, Star, Heart,
  ChevronLeft, ChevronRight, Lock, Unlock, Copy, Check, Info,
  X, Share2, Download, Grid3X3,
  Undo2, Redo2, Plus, Minus, MoreHorizontal, ExternalLink,
  Folder, User,
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
type SectionId = 'studio' | 'library' | 'profile'
type ViewMode = 'colors' | 'preview'
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
  const [section, setSection] = useState<SectionId>('studio')
  const [viewMode, setViewMode] = useState<ViewMode>('colors')
  const [validateOn, setValidateOn] = useState(false)
  const [visionMode, setVisionMode] = useState<VisionMode>('normal')
  // Unified dialog state — only one dialog open at a time
  type DialogType = 'ai-popover' | 'extract' | 'harmony' | 'export' | 'ai-full' | 'pro' | 'sign-in' | 'saved' | 'save-name' | 'shortcuts' | null
  const [activeDialog, setActiveDialog] = useState<DialogType>(null)
  const openDialog = useCallback((type: DialogType) => setActiveDialog(type), [])
  const closeDialog = useCallback(() => setActiveDialog(null), [])

  const [shareCopied, setShareCopied] = useState(false)
  const [aiRemaining, setAiRemaining] = useState(getAiRemaining)
  const [shadesOpen, setShadesOpen] = useState<string | null>(null)
  const [infoOpen, setInfoOpen] = useState<string | null>(null)
  const [infoAnchorRect, setInfoAnchorRect] = useState<DOMRect | null>(null)
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
    if (isPro) setActiveDialog(d => d === 'pro' ? null : d)
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
    openDialog('pro')
  }, [openDialog])

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
      if (e.code === 'Space' && section === 'studio') { e.preventDefault(); triggerGenerate('spacebar') }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); undo() }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); redo() }
      if (e.key === '1' && section === 'studio') setViewMode('colors')
      if (e.key === '2' && section === 'studio') setViewMode('preview')
      if (e.key === 'Escape') {
        closeDialog()
        setValidateOn(false); setShadesOpen(null); setInfoOpen(null)
        setEditingId(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [triggerGenerate, undo, redo, section, closeDialog])

  // Click outside harmony dropdown
  useEffect(() => {
    if (activeDialog !== 'harmony') return
    const handler = (e: MouseEvent) => {
      if (harmonyRef.current && !harmonyRef.current.contains(e.target as Node)) {
        closeDialog()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [activeDialog, closeDialog])

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
    if (!user) { openDialog('sign-in'); return }
    openDialog('save-name')
  }

  const defaultPaletteName = (() => {
    const names = swatches.map(s => getColorName(s.hex)).filter(Boolean)
    return names.slice(0, 3).join(' · ') || 'Untitled'
  })()

  const handleSaveConfirm = async (name: string) => {
    closeDialog()
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
      closeDialog()
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
    closeDialog()
    triggerGenerate('button')
  }

  const visionFilter = visionMode !== 'normal' ? `url(#vision-${visionMode})` : undefined
  const dockW = dockExpanded ? 200 : 80

  // Compute a11y grade from average contrast ratio
  const avgContrastRatio = useMemo(() => {
    if (swatches.length === 0) return 0
    const sum = swatches.reduce((acc, s) => acc + getContrastBadge(s.hex).ratio, 0)
    return sum / swatches.length
  }, [swatches])
  const a11yGrade: 'A' | 'B' | 'C' = avgContrastRatio >= 7 ? 'A' : avgContrastRatio >= 4.5 ? 'B' : 'C'

  // ─── Render ────────────────────────────────────────────────
  return (
    <>
      <div className="w-screen" style={{ backgroundColor: '#EEEEEC' }}>
      {/* App shell — fixed viewport height */}
      <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* Cookie banner — in normal flow, pushes app down */}
      <CookieConsent />

      <div className="flex flex-1 min-h-0 overflow-hidden">
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
            transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
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
              padding: dockExpanded ? '14px 12px' : '12px 8px',
            }}
          >
            {/* Dock logo */}
            <div
              className="flex items-center shrink-0"
              style={{
                justifyContent: dockExpanded ? 'flex-start' : 'center',
                padding: dockExpanded ? '2px 6px 0' : '2px 0 0',
                marginBottom: dockExpanded ? 14 : 10,
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
                <span className="text-[15px] font-bold" style={{ color: BRAND_DARK }}>Paletta</span>
              )}
            </div>

            {/* Section navigation */}
            <div className="flex flex-col" style={{ gap: dockExpanded ? 4 : 6 }}>
              <DockItem
                icon={<Sparkles size={20} />}
                label="Studio"
                active={section === 'studio'}
                expanded={dockExpanded}
                onClick={() => setSection('studio')}
                pulse={dockPulse}
              />
              <DockItem
                icon={<Folder size={20} />}
                label="Library"
                active={section === 'library'}
                expanded={dockExpanded}
                onClick={() => setSection('library')}
              />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Profile — at bottom, separated */}
            <DockItem
              icon={<User size={20} />}
              label="Profile"
              active={section === 'profile'}
              expanded={dockExpanded}
              onClick={() => setSection('profile')}
            />

            {/* Info / Legal links */}
            <DockInfoMenu expanded={dockExpanded} />

            {/* Collapse / Expand toggle */}
            {dockExpanded ? (
              <button
                onClick={toggleDock}
                className="flex items-center w-full text-[13px] font-medium transition-all hover:bg-black/[0.04]"
                style={{ height: 44, padding: '0 14px', gap: 8, borderRadius: 10, color: '#9ca3af' }}
                aria-label="Collapse dock"
              >
                <ChevronLeft size={16} />
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
          {/* ═══ STUDIO SECTION ═══ */}
          {section === 'studio' && (
            <>
              {/* ─── Action Bar (top of bento) ─── */}
              <div
                className="absolute flex items-center justify-between"
                style={{ top: 12, left: 12, right: 12, zIndex: 70 }}
              >
                {/* LEFT GROUP — 3 pills */}
                <div className="flex items-center" style={{ gap: 6 }}>
                  {/* Pill 1: Harmony dropdown */}
                  <div
                    ref={harmonyRef}
                    className="relative flex items-center"
                    style={{
                      borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      border: '1px solid rgba(0,0,0,0.04)',
                      padding: 3,
                    }}
                  >
                    <button
                      onClick={() => activeDialog === 'harmony' ? closeDialog() : openDialog('harmony')}
                      className="flex items-center gap-1.5 text-[13px] font-medium transition-all hover:bg-black/[0.06]"
                      style={{ height: 36, padding: '0 12px', borderRadius: 8, color: BRAND_DARK }}
                      aria-expanded={activeDialog === 'harmony'}
                      aria-haspopup="listbox"
                    >
                      <Shuffle size={16} strokeWidth={1.5} style={{ color: '#6B7280' }} />
                      {HARMONIES.find(h => h.mode === harmonyMode)?.label ?? 'Random'}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {activeDialog === 'harmony' && (
                      <div
                        className="absolute top-full left-0 mt-2 bg-white overflow-hidden"
                        style={{ borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 220, zIndex: 80 }}
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
                            <span className="text-[11px] opacity-50">{h.desc}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pill 2: View mode segmented control */}
                  <div
                    className="flex items-center"
                    style={{
                      borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      border: '1px solid rgba(0,0,0,0.04)',
                      padding: 3,
                      gap: 2,
                    }}
                  >
                    {(['colors', 'preview'] as ViewMode[]).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className="text-[13px] transition-all"
                        style={{
                          height: 36,
                          padding: '0 16px',
                          borderRadius: 8,
                          fontWeight: viewMode === mode ? 600 : 400,
                          backgroundColor: viewMode === mode ? '#ffffff' : 'transparent',
                          boxShadow: viewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : undefined,
                          color: viewMode === mode ? BRAND_DARK : '#6B7280',
                        }}
                      >
                        {mode === 'colors' ? 'Colors' : 'Preview'}
                      </button>
                    ))}
                  </div>

                  {/* Pill 3: Validate toggle */}
                  <button
                    onClick={() => setValidateOn(v => !v)}
                    className="flex items-center transition-all hover:bg-black/[0.02]"
                    style={{
                      height: 36,
                      padding: '0 10px',
                      borderRadius: 8,
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      border: validateOn ? `2px solid ${BRAND_VIOLET}` : '1px solid rgba(0,0,0,0.04)',
                      gap: 6,
                    }}
                    aria-pressed={validateOn}
                    aria-label="Toggle accessibility validation"
                  >
                    <Eye size={16} strokeWidth={1.5} style={{ color: validateOn ? BRAND_VIOLET : '#6B7280' }} />
                    {validateOn && (
                      <>
                        <span className="text-[13px] font-medium" style={{ color: BRAND_VIOLET }}>A11y</span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5"
                          style={{
                            borderRadius: 6,
                            backgroundColor: a11yGrade === 'A' ? '#D1FAE5' : a11yGrade === 'B' ? '#FEF3C7' : '#FEE2E2',
                            color: a11yGrade === 'A' ? '#16A34A' : a11yGrade === 'B' ? '#D97706' : '#DC2626',
                          }}
                        >
                          {a11yGrade}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* RIGHT GROUP — single pill */}
                <div
                  className="flex items-center"
                  style={{
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    padding: 4,
                    gap: 6,
                  }}
                  role="toolbar"
                  aria-label="Palette actions"
                >
                  {/* AI */}
                  <DarkTooltip label="AI palette" position="bottom">
                    <button
                      onClick={() => activeDialog === 'ai-popover' ? closeDialog() : openDialog('ai-popover')}
                      className="flex items-center gap-1 transition-all hover:bg-black/[0.06]"
                      style={{ height: 36, padding: '0 10px', borderRadius: 8, color: BRAND_DARK }}
                      aria-label="AI palette"
                    >
                      <Star size={16} strokeWidth={1.5} />
                      <span className="text-[12px] font-medium">AI</span>
                      {!isPro && (
                        <span
                          className="text-[8px] font-bold text-white px-1.5 py-0.5"
                          style={{ borderRadius: 6, backgroundColor: BRAND_VIOLET }}
                        >
                          {aiRemaining}
                        </span>
                      )}
                    </button>
                  </DarkTooltip>

                  {/* Extract */}
                  <DarkTooltip label="Extract from image" position="bottom">
                    <button
                      onClick={() => {
                        if (!isPro) { openProModal('image_extraction', 'action_bar'); return }
                        activeDialog === 'extract' ? closeDialog() : openDialog('extract')
                      }}
                      className="flex items-center gap-1 transition-all hover:bg-black/[0.06]"
                      style={{ height: 36, padding: '0 10px', borderRadius: 8, color: BRAND_DARK }}
                      aria-label="Extract colors from image"
                    >
                      <Image size={16} strokeWidth={1.5} />
                      {!isPro && (
                        <span
                          className="text-[8px] font-bold text-white px-1.5 py-0.5"
                          style={{ borderRadius: 6, backgroundColor: BRAND_VIOLET }}
                        >
                          PRO
                        </span>
                      )}
                    </button>
                  </DarkTooltip>

                  {/* Divider */}
                  <div style={{ width: 1, height: 20, backgroundColor: 'rgba(0,0,0,0.06)' }} />

                  {/* Save */}
                  <DarkTooltip label="Save palette" position="bottom">
                    <button
                      onClick={handleSave}
                      className="flex items-center justify-center transition-all hover:bg-black/[0.06]"
                      style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
                      aria-label="Save palette"
                    >
                      <Heart size={20} strokeWidth={1.5} style={{ color: '#374151' }} />
                    </button>
                  </DarkTooltip>

                  {/* Share */}
                  <DarkTooltip label="Share" position="bottom">
                    <button
                      onClick={handleShare}
                      className="flex items-center justify-center transition-all hover:bg-black/[0.06]"
                      style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
                      aria-label="Share palette link"
                    >
                      {shareCopied ? <Check size={20} strokeWidth={1.5} style={{ color: '#16a34a' }} /> : <Share2 size={20} strokeWidth={1.5} style={{ color: '#374151' }} />}
                    </button>
                  </DarkTooltip>

                  {/* Export */}
                  <DarkTooltip label="Export" position="bottom">
                    <button
                      onClick={() => activeDialog === 'export' ? closeDialog() : openDialog('export')}
                      className="flex items-center justify-center transition-all hover:bg-black/[0.06]"
                      style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
                      aria-label="Export palette"
                    >
                      <Download size={20} strokeWidth={1.5} style={{ color: '#374151' }} />
                    </button>
                  </DarkTooltip>

                  {/* Divider */}
                  <div style={{ width: 1, height: 20, backgroundColor: 'rgba(0,0,0,0.08)' }} />

                  {/* Go Pro */}
                  {!isPro && (
                    <button
                      onClick={() => { openProModal(undefined, 'action_bar') }}
                      className="text-[12px] font-semibold transition-all hover:opacity-80"
                      style={{ height: 36, padding: '0 14px', borderRadius: 8, backgroundColor: BRAND_VIOLET, color: '#ffffff' }}
                    >
                      Go Pro
                    </button>
                  )}

                  {/* Auth */}
                  {isSignedIn && user?.email ? (
                    <UserMenu email={user.email} isPro={isPro} onSignOut={signOut} onManage={handleManageSubscription} />
                  ) : (
                    <button
                      onClick={() => openDialog('sign-in')}
                      className="text-[13px] font-medium transition-all hover:bg-black/[0.04]"
                      style={{ height: 36, padding: '0 14px', borderRadius: 8, color: BRAND_DARK, border: '1px solid rgba(0,0,0,0.1)' }}
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>

              {/* ─── Validate: Vision Picker Bar ─── */}
              {validateOn && (
                <div
                  className="absolute flex items-center"
                  style={{
                    top: 60, left: 12, zIndex: 70,
                    borderRadius: 10,
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    padding: 3, gap: 2,
                  }}
                  role="radiogroup"
                  aria-label="Vision simulation modes"
                >
                  {VISION_MODES.map(v => {
                    const needsPro = v.pro && !isPro
                    const isActive = visionMode === v.mode
                    return (
                      <button
                        key={v.mode}
                        onClick={() => {
                          if (needsPro) { openProModal('vision_sim', 'validate_bar'); return }
                          setVisionMode(v.mode)
                        }}
                        className="text-[11px] transition-all"
                        style={{
                          height: 30, padding: '0 10px', borderRadius: 6,
                          fontWeight: isActive ? 600 : 400,
                          backgroundColor: isActive ? '#ffffff' : 'transparent',
                          boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : undefined,
                          color: needsPro ? '#9CA3AF' : isActive ? BRAND_DARK : '#6B7280',
                          opacity: needsPro ? 0.6 : 1,
                        }}
                        role="radio"
                        aria-checked={isActive}
                        aria-label={v.label}
                      >
                        {v.label.replace(' Vision', '')}
                        {needsPro && (
                          <span className="ml-1 text-[8px] font-bold text-white px-1 py-0.5" style={{ borderRadius: 4, backgroundColor: BRAND_VIOLET }}>PRO</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* ─── Shade Specimen Grid ─── */}
              {shadesOpen && (() => {
                const sw = swatches.find(s => s.id === shadesOpen)
                return sw ? <ShadesSpecimen hex={sw.hex} onClose={() => setShadesOpen(null)} /> : null
              })()}

              {/* ─── Colors View ─── */}
              {viewMode === 'colors' && (
                <main id="main-canvas" className="absolute inset-0 overflow-hidden" style={{ filter: validateOn ? visionFilter : undefined }}>
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
                          style={{ backgroundColor: s.hex, paddingTop: 70, paddingBottom: 40 }}
                        >
                          <div className="flex flex-col items-center justify-center gap-3">
                            {/* WCAG badge */}
                            <div
                              className="px-2.5 py-1 rounded-md font-mono font-semibold text-white"
                              style={{ backgroundColor: 'rgba(0,0,0,0.45)', fontSize: validateOn ? 18 : 11 }}
                            >
                              {contrast.level} {contrast.ratio}:1 {contrast.pass ? '✓' : '✗'}
                            </div>

                            {/* Validate: Aa text previews */}
                            {validateOn && (
                              <div className="flex gap-2">
                                <span className="text-[14px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#ffffff', color: s.hex }}>Aa</span>
                                <span className="text-[14px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: '#000000', color: s.hex }}>Aa</span>
                              </div>
                            )}

                            {/* Hex code */}
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
                            <div className="flex flex-col items-center" style={{ gap: 6 }}>
                              <DarkTooltip label={isCopied ? 'Copied' : 'Copy hex'} position="right">
                                <button
                                  onClick={() => copyHex(s.id, s.hex)}
                                  className="flex items-center justify-center transition-all"
                                  style={{ width: 36, height: 36, padding: 0, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' }}
                                  aria-label={isCopied ? 'Copied' : `Copy ${s.hex}`}
                                >
                                  {isCopied
                                    ? <Check size={20} strokeWidth={1.5} style={{ color: textColor }} />
                                    : <Copy size={20} strokeWidth={1.5} style={{ color: textColor }} />}
                                </button>
                              </DarkTooltip>
                              <DarkTooltip label="Color details" position="right">
                                <button
                                  onClick={(e) => {
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                    if (infoOpen === s.id) { setInfoOpen(null); setInfoAnchorRect(null) }
                                    else { setInfoOpen(s.id); setInfoAnchorRect(rect) }
                                  }}
                                  className="flex items-center justify-center transition-all"
                                  style={{ width: 36, height: 36, padding: 0, borderRadius: 8, backgroundColor: showInfo ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)' }}
                                  aria-label="Color info"
                                  aria-expanded={showInfo}
                                >
                                  <Info size={20} strokeWidth={1.5} style={{ color: textColor }} />
                                </button>
                              </DarkTooltip>
                              <DarkTooltip label="Shade scale" position="right">
                                <button
                                  onClick={() => setShadesOpen(shadesOpen === s.id ? null : s.id)}
                                  className="flex items-center justify-center transition-all"
                                  style={{ width: 36, height: 36, padding: 0, borderRadius: 8, backgroundColor: showShades ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)' }}
                                  aria-label="View shade scale"
                                  aria-expanded={showShades}
                                >
                                  <Grid3X3 size={20} strokeWidth={1.5} style={{ color: textColor }} />
                                </button>
                              </DarkTooltip>
                              <DarkTooltip label={s.locked ? 'Unlock' : 'Lock'} position="right">
                                <button
                                  onClick={() => lockSwatch(s.id)}
                                  className="flex items-center justify-center transition-all"
                                  style={{ width: 36, height: 36, padding: 0, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' }}
                                  aria-label={s.locked ? 'Unlock color' : 'Lock color'}
                                >
                                  {s.locked
                                    ? <Lock size={20} strokeWidth={1.5} style={{ color: textColor }} />
                                    : <Unlock size={20} strokeWidth={1.5} style={{ color: textColor }} />}
                                </button>
                              </DarkTooltip>
                            </div>

                            {s.locked && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.35)', color: '#ffffff' }}>Locked</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </main>
              )}

              {/* ─── Preview View ─── */}
              {viewMode === 'preview' && (
                <PreviewMode
                  swatches={swatches}
                  isPro={isPro}
                  onClose={() => setViewMode('colors')}
                  onGenerate={() => triggerGenerate('button')}
                  onExport={() => openDialog('export')}
                  onUndo={undo}
                  onRedo={redo}
                  onProGate={openProModal}
                  onLock={lockSwatch}
                  visionFilter={validateOn ? visionFilter : undefined}
                />
              )}

              {/* Bottom bar — color count + spacebar hint */}
              {viewMode === 'colors' && activeDialog !== 'ai-full' && activeDialog !== 'export' && (
                <div
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center"
                  style={{ gap: 6, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '4px 6px' }}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { if (count > 3) setCount(count - 1) }}
                      className="flex items-center justify-center transition-all hover:bg-white/10"
                      style={{ width: 32, height: 32, padding: 0, borderRadius: 8, opacity: count <= 3 ? 0.3 : 1 }}
                      disabled={count <= 3}
                      aria-label="Remove color"
                    >
                      <Minus size={16} style={{ color: '#fff' }} />
                    </button>
                    <span className="text-[14px] font-mono font-semibold text-white tabular-nums" style={{ minWidth: 20, textAlign: 'center' }}>{count}</span>
                    {(() => {
                      const freeMax = 5
                      const proMax = 8
                      const currentCount = swatches.length
                      const max = isPro ? proMax : freeMax
                      const atFreeLimit = !isPro && currentCount >= freeMax
                      const atAbsMax = isPro && currentCount >= proMax
                      const canAdd = !atFreeLimit && !atAbsMax
                      return (
                        <button
                          onClick={() => {
                            if (atFreeLimit) { openProModal('color_count', 'canvas_bar'); return }
                            if (atAbsMax) return
                            if (currentCount < max) setCount(currentCount + 1)
                          }}
                          className={`relative flex items-center justify-center transition-all ${atAbsMax ? 'cursor-not-allowed' : 'cursor-pointer'} ${canAdd ? 'hover:bg-white/10' : ''}`}
                          style={{ width: 32, height: 32, padding: 0, borderRadius: 8, opacity: canAdd ? 1 : atFreeLimit ? 0.5 : 0.3 }}
                          disabled={atAbsMax}
                          aria-label={atFreeLimit ? 'Upgrade to Pro for more colors' : atAbsMax ? 'Maximum colors reached' : 'Add color'}
                        >
                          <Plus size={16} style={{ color: '#fff' }} />
                          {atFreeLimit && (
                            <span className="absolute flex items-center justify-center rounded-full" style={{ bottom: -6, right: -6, width: 16, height: 16, backgroundColor: 'rgba(0,0,0,0.75)' }}>
                              <Lock size={10} style={{ color: '#fff' }} />
                            </span>
                          )}
                        </button>
                      )
                    })()}
                  </div>
                  <div style={{ width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
                  <div className="flex items-center gap-2">
                    <kbd className="inline-flex items-center justify-center text-[11px] font-mono font-semibold" style={{ padding: '2px 8px', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Space</kbd>
                    <span className="text-[12px] font-medium text-white/70">generate</span>
                  </div>
                  <div style={{ width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
                  <div className="relative">
                    <button
                      onClick={() => activeDialog === 'shortcuts' ? closeDialog() : openDialog('shortcuts')}
                      className="flex items-center justify-center transition-all hover:bg-white/10"
                      style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }}
                      aria-label="Keyboard shortcuts"
                      aria-expanded={activeDialog === 'shortcuts'}
                    >
                      <span className="text-[14px]" style={{ color: 'rgba(255,255,255,0.7)' }} aria-hidden="true">?</span>
                    </button>
                    {activeDialog === 'shortcuts' && (
                      <div
                        className="absolute bottom-full mb-2 right-0 bg-white overflow-hidden"
                        style={{ borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', border: '1px solid #f3f4f6', width: 220, padding: 16 }}
                        role="dialog"
                        aria-label="Keyboard shortcuts"
                      >
                        <p className="text-[12px] font-medium m-0 mb-2" style={{ color: BRAND_VIOLET }}>Keyboard shortcuts</p>
                        {[
                          { key: 'Space', desc: 'Generate palette' },
                          { key: '⌘ Z', desc: 'Undo' },
                          { key: '⇧ ⌘ Z', desc: 'Redo' },
                          { key: '1', desc: 'Colors view' },
                          { key: '2', desc: 'Preview view' },
                          { key: 'Esc', desc: 'Close panel' },
                        ].map(s => (
                          <div key={s.key} className="flex items-center justify-between py-2">
                            <span className="text-[12px]" style={{ color: '#374151' }}>{s.desc}</span>
                            <kbd className="text-[10px] font-mono px-2 py-0.5 rounded-md" style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}>{s.key}</kbd>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ LIBRARY SECTION ═══ */}
          {section === 'library' && (
            <LibrarySection
              isSignedIn={isSignedIn}
              userId={user?.id}
              isPro={isPro}
              onLoad={hexes => { setSwatches(hexes.map(h => makeSwatch(h))); setSection('studio') }}
              onProGate={openProModal}
              onSignIn={() => openDialog('sign-in')}
            />
          )}

          {/* ═══ PROFILE SECTION ═══ */}
          {section === 'profile' && (
            <ProfileSection
              user={user}
              isSignedIn={isSignedIn}
              isPro={isPro}
              onSignIn={signInWithGoogle}
              onSignOut={signOut}
              onProGate={() => openProModal(undefined, 'profile')}
              onManageSubscription={handleManageSubscription}
            />
          )}
        </div>

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
      </div>{/* close inner flex row (dock + bento) */}

      {/* ─── Modals (outside overflow-hidden, above everything) ─── */}
      <AiPrompt
        open={activeDialog === 'ai-full'}
        onClose={closeDialog}
        onPalette={handleAiPalette}
        onFallback={triggerGenerate}
        onProGate={openProModal}
        onUsageChange={() => setAiRemaining(getAiRemaining())}
        onError={msg => showToast(msg)}
        colorCount={count}
      />

      {activeDialog === 'export' && (
        <ExportPanel hexes={swatches.map(s => s.hex)} onClose={closeDialog} onProGate={() => openProModal()} />
      )}

      {activeDialog === 'ai-popover' && (
        <AiModalDialog
          onClose={closeDialog}
          onOpenFull={() => openDialog('ai-full')}
          isPro={isPro}
          aiRemaining={aiRemaining}
        />
      )}

      {activeDialog === 'extract' && (
        <ExtractDialog
          uploading={imageUploading}
          onFile={handleImageUpload}
          onClose={closeDialog}
          fileInputRef={fileInputRef}
        />
      )}

      <SignInModal open={activeDialog === 'sign-in'} onClose={closeDialog} onGoogleSignIn={signInWithGoogle} />
      <ProUpgradeModal open={activeDialog === 'pro'} onClose={closeDialog} />
      <PaymentSuccessModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} />

      <SaveNameModal
        open={activeDialog === 'save-name'}
        defaultName={defaultPaletteName}
        onConfirm={handleSaveConfirm}
        onClose={closeDialog}
      />

      {user && (
        <SavedPalettesPanel
          open={activeDialog === 'saved'}
          onClose={closeDialog}
          userId={user.id}
          onLoad={hexes => setSwatches(hexes.map(h => makeSwatch(h)))}
          isPro={isPro}
          onProGate={openProModal}
        />
      )}

      </div>{/* close app shell (100dvh) */}

      {/* Color info popover — fixed positioned, outside overflow containers */}
      {infoOpen && infoAnchorRect && (() => {
        const sw = swatches.find(s => s.id === infoOpen)
        if (!sw) return null
        return (
          <ColorInfoPopover
            hex={sw.hex}
            anchorRect={infoAnchorRect}
            onClose={() => { setInfoOpen(null); setInfoAnchorRect(null) }}
          />
        )
      })()}

      {/* SEO content below fold — scrollable past the app viewport */}
      <SEOContent />
      </div>{/* close outer w-screen wrapper */}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// LIBRARY SECTION (full-page inside bento)
// ═══════════════════════════════════════════════════════════════
function LibrarySection({
  isSignedIn, userId, isPro, onLoad, onProGate, onSignIn,
}: {
  isSignedIn: boolean
  userId?: string
  isPro: boolean
  onLoad: (hexes: string[]) => void
  onProGate: (feature?: string, source?: string) => void
  onSignIn: () => void
}) {
  const [palettes, setPalettes] = useState<{ id: string; name: string; colors: string[]; created_at: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isSignedIn || !userId) return
    setLoading(true)
    ;(async () => {
      try {
        const { supabase } = await import('../lib/supabase')
        const { data } = await supabase
          .from('saved_palettes')
          .select('id, name, colors, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
        setPalettes(data ?? [])
      } catch { /* silent */ }
      finally { setLoading(false) }
    })()
  }, [isSignedIn, userId])

  const handleDelete = async (id: string) => {
    const { supabase } = await import('../lib/supabase')
    await supabase.from('saved_palettes').delete().eq('id', id)
    setPalettes(p => p.filter(x => x.id !== id))
    showToast('Deleted')
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date))
  }

  const slotsText = isPro ? 'Unlimited saves' : `${palettes.length} of 3 free slots used`

  if (!isSignedIn) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <div className="rounded-full flex items-center justify-center mb-5" style={{ width: 56, height: 56, backgroundColor: BRAND_VIOLET }}>
          <Heart size={28} color="#ffffff" />
        </div>
        <h2 className="text-[24px] font-bold" style={{ color: BRAND_DARK }}>Your collection starts here</h2>
        <p className="text-[14px] mt-2 mb-6 max-w-[320px]" style={{ color: '#6B7280' }}>
          Save your favorites and export to Figma or Tailwind CSS. 3 free saves, unlimited with Pro.
        </p>
        <button
          onClick={onSignIn}
          className="flex items-center justify-center gap-2.5 text-white text-[16px] font-bold transition-all hover:opacity-90"
          style={{ height: 52, padding: '0 32px', borderRadius: 12, backgroundColor: BRAND_VIOLET }}
        >
          Sign in to get started
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[13px]" style={{ color: '#9CA3AF' }}>Loading...</span>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ padding: 32 }}>
      <div className="max-w-[640px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[24px] font-bold" style={{ color: BRAND_DARK }}>Library</h2>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Your saved palettes</p>
          </div>
          <span className="text-[12px]" style={{ color: '#9CA3AF' }}>{slotsText}</span>
        </div>

        {palettes.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Heart size={32} style={{ color: '#d1d5db' }} />
            <p className="text-[15px] font-medium mt-4" style={{ color: '#6B7280' }}>No saved palettes yet</p>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Use the heart icon in Studio to save palettes here</p>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {palettes.map(p => (
              <div key={p.id} className="bg-white overflow-hidden" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
                <button
                  onClick={() => onLoad(p.colors)}
                  className="w-full flex h-14 overflow-hidden"
                  style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                  aria-label={`Load palette: ${p.name}`}
                >
                  {p.colors.map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </button>
                <div className="flex items-center justify-between px-3 py-2">
                  <div>
                    <span className="text-[13px] font-semibold block" style={{ color: BRAND_DARK }}>{p.name || 'Untitled'}</span>
                    <span className="text-[10px]" style={{ color: '#D1D5DB' }}>Saved {timeAgo(p.created_at)}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors"
                    style={{ minWidth: 36, minHeight: 36 }}
                    aria-label={`Delete ${p.name}`}
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isPro && palettes.length >= 3 && (
          <button
            onClick={() => onProGate('save_limit', 'library')}
            className="w-full mt-4 text-white text-[13px] font-semibold transition-all hover:opacity-90"
            style={{ height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${BRAND_VIOLET}, #9b82ff)` }}
          >
            Go Pro for unlimited saves
          </button>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PROFILE SECTION (full-page inside bento)
// ═══════════════════════════════════════════════════════════════
function ProfileSection({
  user, isSignedIn, isPro, onSignIn, onSignOut, onProGate, onManageSubscription,
}: {
  user: { id: string; email?: string | null; user_metadata?: { full_name?: string; avatar_url?: string } } | null
  isSignedIn: boolean
  isPro: boolean
  onSignIn: () => Promise<{ error: Error | null }>
  onSignOut: () => void
  onProGate: () => void
  onManageSubscription: () => void
}) {
  const [accountOpen, setAccountOpen] = useState(false)
  const [legalOpen, setLegalOpen] = useState(false)

  if (!isSignedIn) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <h2 className="text-[28px] font-bold" style={{ color: BRAND_DARK }}>Welcome to Paletta</h2>
        <p className="text-[14px] mt-2 mb-6 max-w-[320px]" style={{ color: '#6B7280' }}>
          The color palette generator built for accessibility
        </p>
        <button
          onClick={() => onSignIn()}
          className="flex items-center justify-center gap-2.5 text-white text-[16px] font-bold transition-all hover:opacity-90 mb-8"
          style={{ height: 52, padding: '0 32px', borderRadius: 12, backgroundColor: BRAND_VIOLET }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#8fa8ff"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#7ee6a1"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fdd663"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#f28b82"/>
          </svg>
          Continue with Google
        </button>

        {/* Pro features */}
        <div className="w-full max-w-[360px] overflow-hidden" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
          {[
            { icon: Sparkles, title: 'Unlimited AI palettes' },
            { icon: Eye, title: 'All 5 vision simulations' },
            { icon: Heart, title: 'Unlimited saves + export' },
          ].map((f, i) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="flex items-center justify-between px-4" style={{ minHeight: 52, borderTop: i > 0 ? '1px solid #F3F4F6' : undefined }}>
                <div className="flex items-center gap-3">
                  <Icon size={20} style={{ color: BRAND_VIOLET }} />
                  <span className="text-[14px] font-semibold" style={{ color: BRAND_DARK }}>{f.title}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5" style={{ backgroundColor: BRAND_VIOLET, color: '#ffffff', borderRadius: 6 }}>PRO</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ padding: 32 }}>
      <div className="max-w-[480px] mx-auto">
        {/* Avatar + info */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="rounded-full flex items-center justify-center text-white text-[20px] font-bold shrink-0"
            style={{ width: 56, height: 56, background: `linear-gradient(135deg, ${BRAND_VIOLET}, #9b82ff)` }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[20px] font-bold truncate" style={{ color: BRAND_DARK }}>{name}</span>
              {isPro && (
                <span className="shrink-0 text-[10px] font-bold text-white px-3 py-1" style={{ backgroundColor: BRAND_VIOLET, borderRadius: 6 }}>PRO</span>
              )}
            </div>
            {user?.email && <span className="text-[13px] block truncate mt-0.5" style={{ color: '#9CA3AF' }}>{user.email}</span>}
            {!isPro && <span className="text-[12px] block mt-0.5" style={{ color: '#D1D5DB' }}>Free plan</span>}
          </div>
        </div>

        {/* Upgrade */}
        {!isPro && (
          <button
            onClick={onProGate}
            className="w-full text-white text-[14px] font-semibold transition-all hover:opacity-90 mb-5 flex items-center justify-between px-5"
            style={{ height: 48, borderRadius: 12, backgroundColor: BRAND_VIOLET }}
          >
            <span>Upgrade to Pro</span>
            <span className="text-[13px] opacity-80">$5/mo</span>
          </button>
        )}

        {/* Account accordion */}
        <div className="overflow-hidden mb-3" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
          <button
            onClick={() => setAccountOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 hover:bg-gray-50 transition-colors"
            style={{ minHeight: 52 }}
          >
            <span className="text-[15px] font-semibold" style={{ color: BRAND_DARK }}>Account</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
              style={{ transform: accountOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div className="border-t border-gray-100 overflow-hidden transition-all duration-200" style={{ maxHeight: accountOpen ? 200 : 0, opacity: accountOpen ? 1 : 0 }}>
            {isPro && (
              <button onClick={onManageSubscription} className="w-full text-left px-4 text-[14px] font-medium hover:bg-gray-50 transition-colors" style={{ color: BRAND_DARK, minHeight: 52 }}>
                Manage subscription
              </button>
            )}
            <button onClick={onSignOut} className="w-full text-left px-4 text-[14px] font-medium hover:bg-gray-50 transition-colors" style={{ color: '#EF4444', minHeight: 52 }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Legal accordion */}
        <div className="overflow-hidden mb-3" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
          <button
            onClick={() => setLegalOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 hover:bg-gray-50 transition-colors"
            style={{ minHeight: 52 }}
          >
            <span className="text-[15px] font-semibold" style={{ color: BRAND_DARK }}>Legal</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
              style={{ transform: legalOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div className="border-t border-gray-100 flex flex-col overflow-hidden transition-all duration-200" style={{ maxHeight: legalOpen ? 300 : 0, opacity: legalOpen ? 1 : 0 }}>
            <a href="/privacy-policy" className="px-4 text-[14px] font-medium no-underline hover:bg-gray-50 flex items-center" style={{ color: BRAND_DARK, minHeight: 52 }}>Privacy Policy</a>
            <a href="/terms-of-service" className="px-4 text-[14px] font-medium no-underline hover:bg-gray-50 flex items-center border-t border-gray-100" style={{ color: BRAND_DARK, minHeight: 52 }}>Terms of Service</a>
            <a href="/cookie-policy" className="px-4 text-[14px] font-medium no-underline hover:bg-gray-50 flex items-center border-t border-gray-100" style={{ color: BRAND_DARK, minHeight: 52 }}>Cookie Policy</a>
          </div>
        </div>

        {/* Support */}
        <div className="overflow-hidden" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
          <a href="mailto:hello@usepaletta.io" className="flex items-center justify-between px-4 no-underline hover:bg-gray-50 transition-colors" style={{ minHeight: 52 }}>
            <span className="text-[15px] font-semibold" style={{ color: BRAND_DARK }}>Support</span>
            <span className="text-[12px]" style={{ color: '#9CA3AF' }}>hello@usepaletta.io</span>
          </a>
        </div>
      </div>
    </div>
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
        className={`flex items-center transition-all duration-150 ease-in-out${pulse ? ' dock-pulse' : ''}`}
        style={{
          width: isCollapsed ? 48 : '100%',
          height: 48,
          flexShrink: 0,
          borderRadius: 12,
          padding: expanded ? '0 14px' : '0',
          gap: expanded ? 12 : 0,
          justifyContent: expanded ? 'flex-start' : 'center',
          backgroundColor: primary
            ? BRAND_VIOLET
            : active
              ? 'rgba(108,71,255,0.08)'
              : 'transparent',
          color: primary ? '#ffffff' : active ? BRAND_VIOLET : '#374151',
          fontWeight: active || primary ? 600 : 500,
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
          <>
            <span className="text-[14px] whitespace-nowrap">{label}</span>
            {badge && (
              <span
                className="text-[8px] font-bold text-white flex items-center justify-center"
                style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 4, backgroundColor: BRAND_VIOLET, padding: '0 5px' }}
              >
                {badge}
              </span>
            )}
            {proBadge && (
              <span
                className="text-[8px] font-bold text-white"
                style={{ marginLeft: 'auto', borderRadius: 4, backgroundColor: BRAND_VIOLET, padding: '2px 5px' }}
              >
                PRO
              </span>
            )}
          </>
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
        className="rounded-full flex items-center justify-center text-[13px] font-bold text-white transition-all hover:ring-2 hover:ring-black/10"
        style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${BRAND_VIOLET}, #9b82ff)` }}
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
function ColorInfoPopover({ hex, anchorRect, onClose }: { hex: string; anchorRect: DOMRect; onClose: () => void }) {
  const name = getColorName(hex)
  const { rgb, hsl } = getColorInfo(hex)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const copyValue = async (label: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val)
      setCopied(label)
      setTimeout(() => setCopied(null), 1200)
    } catch { /* silent */ }
  }

  // Position to the right of the anchor button; if too close to right edge, show to the left
  const popoverWidth = 210
  const spaceRight = window.innerWidth - anchorRect.right
  const showRight = spaceRight > popoverWidth + 16
  const top = anchorRect.top + anchorRect.height / 2
  const left = showRight ? anchorRect.right + 8 : anchorRect.left - popoverWidth - 8

  return (
    <>
      {/* Click-outside overlay */}
      <div className="fixed inset-0 z-[79]" onClick={onClose} />
      <div
        className="fixed z-[80] bg-white"
        style={{
          top,
          left,
          transform: 'translateY(-50%)',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.06)',
          width: popoverWidth,
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={`Color details for ${hex}`}
      >
        <div style={{ height: 6, backgroundColor: hex }} />
        <div style={{ padding: '12px 16px' }}>
          <p className="text-[15px] font-bold m-0" style={{ color: BRAND_DARK }}>{name}</p>
          <div className="mt-2 flex flex-col gap-1">
            <InfoRow label="HEX" value={hex.toUpperCase()} copied={copied === 'HEX'} onClick={() => copyValue('HEX', hex.toUpperCase())} />
            <InfoRow label="RGB" value={rgb} copied={copied === 'RGB'} onClick={() => copyValue('RGB', rgb)} />
            <InfoRow label="HSL" value={hsl} copied={copied === 'HSL'} onClick={() => copyValue('HSL', hsl)} />
          </div>
        </div>
      </div>
    </>
  )
}

function InfoRow({ label, value, copied, onClick }: { label: string; value: string; copied: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full text-left transition-all hover:bg-gray-50 -mx-1 px-1 rounded"
      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px' }}
      aria-label={`Copy ${label} value`}
    >
      <span className="text-[10px] font-bold tracking-wider opacity-40 w-7" style={{ color: BRAND_DARK }}>{label}</span>
      <span className="text-[12px] font-mono" style={{ color: copied ? '#16a34a' : '#374151' }}>
        {copied ? 'Copied!' : value}
      </span>
    </button>
  )
}

// ─── Shade Specimen Grid (bento overlay) ─────────────────────
function shadeContrastRatio(bg: string, fg: string): number {
  try {
    const parse = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
    const lum = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }
    const [r1, g1, b1] = parse(bg)
    const [r2, g2, b2] = parse(fg)
    const l1 = lum(r1, g1, b1), l2 = lum(r2, g2, b2)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  } catch { return 1 }
}

function ShadesSpecimen({ hex, onClose }: { hex: string; onClose: () => void }) {
  const shades = useMemo(() => generateShades(hex, 10), [hex])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [entering, setEntering] = useState(true)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  useEffect(() => {
    requestAnimationFrame(() => setEntering(false))
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleCopy = async (shade: string, i: number) => {
    try {
      await navigator.clipboard.writeText(shade.toUpperCase())
      setCopiedIdx(i)
      showToast('Copied!')
      setTimeout(() => setCopiedIdx(null), 1200)
    } catch { /* silent */ }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 74, backgroundColor: 'rgba(0,0,0,0.15)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="absolute left-1/2"
        style={{
          top: 60,
          zIndex: 75,
          transform: `translateX(-50%) translateY(${entering ? '-8px' : '0'})`,
          opacity: entering ? 0 : 1,
          transition: 'transform 200ms ease-out, opacity 200ms ease-out',
          width: '90%',
          maxWidth: 900,
          borderRadius: 24,
          backgroundColor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 16px 60px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.06)',
          padding: 24,
        }}
        role="dialog"
        aria-label="Shade scale"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h2 className="text-[16px] font-bold m-0" style={{ color: BRAND_DARK }}>Shade scale</h2>

          <div className="flex items-center" style={{ gap: 10 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: hex, flexShrink: 0,
              }}
            />
            <span className="text-[13px] font-mono" style={{ color: '#6b7280' }}>
              {hex.toUpperCase()}
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex items-center justify-center transition-all hover:bg-gray-100"
            style={{ width: 36, height: 36, padding: 0, borderRadius: 8, flexShrink: 0 }}
            aria-label="Close shade scale"
          >
            <X size={20} strokeWidth={1.5} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* 2×5 Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {shades.map((shade, i) => {
            const label = TAILWIND_SHADE_LABELS[i]
            const isBase = label === 500
            const labelColor = readableOn(shade)
            const isCopied = copiedIdx === i
            const isHovered = hoveredIdx === i
            const whiteRatio = shadeContrastRatio(shade, '#ffffff')
            const blackRatio = shadeContrastRatio(shade, '#000000')
            const whitePass = whiteRatio >= 4.5
            const blackPass = blackRatio >= 4.5
            const ratioLabel = `${whiteRatio.toFixed(1)}:1`
            const ratingLabel = whiteRatio >= 7 ? 'AAA' : whiteRatio >= 4.5 ? 'AA' : whiteRatio >= 3 ? 'AA18' : 'Fail'

            return (
              <button
                key={label}
                onClick={() => handleCopy(shade, i)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative flex flex-col items-center justify-end cursor-pointer"
                style={{
                  height: 80,
                  borderRadius: 12,
                  backgroundColor: shade,
                  paddingBottom: 8,
                  border: isBase
                    ? '2px solid #ffffff'
                    : isCopied
                      ? `2px solid ${BRAND_VIOLET}`
                      : '1px solid rgba(0,0,0,0.06)',
                  boxShadow: isBase
                    ? '0 0 0 2px rgba(108,71,255,0.3)'
                    : isCopied
                      ? '0 0 0 2px rgba(108,71,255,0.2)'
                      : undefined,
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 150ms ease, border 300ms ease, box-shadow 300ms ease',
                }}
                aria-label={`Copy shade ${label}: ${shade}`}
              >
                {/* Hover contrast tooltip */}
                {isHovered && (
                  <div
                    className="absolute font-mono"
                    style={{
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginBottom: 6,
                      backgroundColor: '#1F2937',
                      color: '#ffffff',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 10,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    {ratioLabel} {ratingLabel} {whitePass ? '\u2713' : ''}
                  </div>
                )}

                {/* Contrast dots */}
                <div className="absolute flex" style={{ top: 6, right: 6, gap: 3 }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    opacity: whitePass ? 1 : 0.3,
                    border: '0.5px solid rgba(0,0,0,0.1)',
                  }} />
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    backgroundColor: '#000000',
                    opacity: blackPass ? 1 : 0.3,
                  }} />
                </div>

                {/* Copy icon on hover */}
                {isHovered && !isCopied && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ borderRadius: 12 }}>
                    <Copy size={16} strokeWidth={1.5} style={{ color: labelColor, opacity: 0.7 }} />
                  </div>
                )}

                {/* Copied checkmark */}
                {isCopied && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ borderRadius: 12 }}>
                    <Check size={16} strokeWidth={2} style={{ color: labelColor }} />
                  </div>
                )}

                {/* Labels */}
                <span className="text-[10px]" style={{ color: labelColor, lineHeight: 1.2, fontWeight: isBase ? 700 : 600 }}>
                  {isBase ? '500 \u00b7 Base' : String(label)}
                </span>
                <span className="text-[10px] font-mono" style={{ color: labelColor, opacity: 0.7, lineHeight: 1.2 }}>
                  {shade.toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
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
      <div className="flex flex-col" style={{ gap: 4, marginBottom: 8 }}>
        {links.map(l => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] transition-all hover:underline"
            style={{ color: '#9ca3af', textDecoration: 'none', padding: '0 14px' }}
          >
            {l.label}
          </a>
        ))}
        <p className="text-[10px] m-0" style={{ color: '#d1d5db', padding: '4px 14px 0' }}>
          Built with Paletta
        </p>
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

// ─── AI Modal Dialog (centered modal — quick access, opens full AiPrompt) ─
function AiModalDialog({
  onClose, onOpenFull, isPro, aiRemaining,
}: {
  onClose: () => void
  onOpenFull: () => void
  isPro: boolean
  aiRemaining: number
}) {
  const [prompt, setPrompt] = useState('')
  const [entering, setEntering] = useState(true)

  useEffect(() => {
    requestAnimationFrame(() => setEntering(false))
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'opacity 150ms ease-out',
          opacity: entering ? 0 : 1,
        }}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md bg-white shadow-2xl"
        style={{
          borderRadius: 16,
          padding: 24,
          transition: 'transform 150ms ease-out, opacity 150ms ease-out',
          transform: entering ? 'scale(0.95)' : 'scale(1)',
          opacity: entering ? 0 : 1,
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="AI palette"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 m-0">AI palette</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <label htmlFor="ai-modal-prompt" className="sr-only">AI prompt</label>
            <input
              id="ai-modal-prompt"
              autoFocus
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && prompt.trim()) onOpenFull() }}
              placeholder="Describe a mood or theme…"
              className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none transition-all"
              style={{ color: BRAND_DARK }}
              onFocus={e => { e.currentTarget.style.borderColor = BRAND_VIOLET; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(108,71,255,0.15)' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none' }}
            />
            <button
              onClick={onOpenFull}
              className="h-9 px-4 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90"
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
                className="px-2.5 py-1 text-xs font-medium transition-all hover:bg-gray-200"
                style={{ borderRadius: 6, backgroundColor: '#f3f4f6', color: '#374151' }}
              >
                {chip}
              </button>
            ))}
          </div>

          <p className="text-xs m-0" style={{ color: '#9ca3af' }}>
            {isPro ? '✦ Unlimited prompts' : `${aiRemaining}/day free · Unlimited with Pro`}
          </p>
        </div>
      </div>
    </div>
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
  const [entering, setEntering] = useState(true)

  useEffect(() => {
    requestAnimationFrame(() => setEntering(false))
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onFile(file)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'opacity 150ms ease-out',
          opacity: entering ? 0 : 1,
        }}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-lg bg-white shadow-2xl"
        style={{
          borderRadius: 16,
          padding: 24,
          transition: 'transform 150ms ease-out, opacity 150ms ease-out',
          transform: entering ? 'scale(0.95)' : 'scale(1)',
          opacity: entering ? 0 : 1,
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Extract colors from image"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 m-0">
            Extract from image
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drop zone */}
        <div
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed transition-all cursor-pointer"
          style={{
            height: 180,
            borderRadius: 12,
            borderColor: dragOver ? `${BRAND_VIOLET}66` : '#e5e7eb',
            backgroundColor: dragOver ? `${BRAND_VIOLET}08` : '#f9fafb',
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <p className="text-sm font-medium m-0" style={{ color: '#6b7280' }}>Analyzing…</p>
          ) : (
            <>
              <Image size={32} style={{ color: '#d1d5db' }} />
              <p className="text-sm font-medium m-0" style={{ color: '#374151' }}>
                Drop image here
              </p>
              <p className="text-xs m-0" style={{ color: '#9ca3af' }}>
                or click to browse · PNG, JPG, WebP
              </p>
            </>
          )}
        </div>

        <p className="text-xs mt-3 m-0" style={{ color: '#9ca3af' }}>
          Colors are extracted using k-means clustering
        </p>
      </div>
    </div>
  )
}

// ─── Preview Mode ────────────────────────────────────────────
function PreviewMode({
  swatches, isPro, onClose, onGenerate, onExport, onUndo, onRedo, onProGate, onLock, visionFilter,
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
  visionFilter?: string
}) {
  const hexes = swatches.map(s => s.hex)
  const c = (i: number) => hexes[i % hexes.length]
  const [entering, setEntering] = useState(true)

  useEffect(() => {
    requestAnimationFrame(() => setEntering(false))
  }, [])

  const handleCopyCSS = async () => {
    const css = hexes.map((h, i) => `  --color-${i + 1}: ${h};`).join('\n')
    try {
      await navigator.clipboard.writeText(`:root {\n${css}\n}`)
      showToast('CSS variables copied!')
    } catch { /* silent */ }
  }

  return (
    <div className="absolute inset-0 flex flex-col" style={{ overflow: 'hidden' }}>
      {/* ─ Export actions bar ─ */}
      <div
        className="flex-none flex items-center justify-between"
        style={{
          height: 44,
          padding: '0 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <span className="text-[13px] font-semibold" style={{ color: BRAND_DARK }}>Preview</span>
        <div className="flex items-center" style={{ gap: 6 }}>
          <button
            onClick={() => onExport()}
            className="flex items-center transition-all hover:bg-gray-50"
            style={{
              height: 36, padding: '0 12px', gap: 6, borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.06)', color: BRAND_DARK, fontSize: 12, fontWeight: 500,
            }}
            aria-label="Export Tailwind config"
          >
            <Download size={16} strokeWidth={1.5} />
            Export Tailwind
          </button>
          <button
            onClick={handleCopyCSS}
            className="flex items-center transition-all hover:bg-gray-50"
            style={{
              height: 36, padding: '0 12px', gap: 6, borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.06)', color: BRAND_DARK, fontSize: 12, fontWeight: 500,
            }}
            aria-label="Copy CSS variables"
          >
            <Copy size={16} strokeWidth={1.5} />
            Copy CSS
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center transition-all hover:bg-gray-100"
            style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
            aria-label="Exit preview mode"
          >
            <X size={20} strokeWidth={1.5} style={{ color: '#6b7280' }} />
          </button>
        </div>
      </div>

      {/* ─ Mockup grid ─ */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          backgroundColor: '#f9f9f8',
          padding: 24,
          paddingBottom: 80,
          opacity: entering ? 0 : 1,
          transition: 'opacity 300ms ease 100ms',
          filter: visionFilter,
        }}
      >
        <div
          className="grid mx-auto"
          style={{ gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 1000 }}
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
            onProClick={() => { onProGate('preview_dashboard', 'preview_grid'); analytics.track('pro_gate_hit', { feature: 'preview_dashboard' }) }}
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
              onProClick={() => { onProGate('preview_mobile', 'preview_grid'); analytics.track('pro_gate_hit', { feature: 'preview_mobile' }) }}
            >
              <MobileAppMockup c={c} />
            </MockupCard>
          </div>
        </div>
      </div>

      {/* ─ Floating control footer ─ */}
      <div
        className="absolute z-20 flex items-center"
        style={{
          bottom: 12,
          left: 12,
          right: 12,
          height: 52,
          borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.04)',
          padding: '4px 8px',
          gap: 6,
          transform: entering ? 'translateY(20px)' : 'translateY(0)',
          opacity: entering ? 0 : 1,
          transition: 'transform 200ms ease-out 100ms, opacity 200ms ease-out 100ms',
        }}
      >
        {/* Color swatches */}
        <div className="flex items-center" style={{ gap: 6 }}>
          {swatches.map(s => (
            <button
              key={s.id}
              onClick={() => onLock(s.id)}
              className="relative flex items-center justify-center transition-all hover:scale-105"
              style={{
                width: 36, height: 36, padding: 0, borderRadius: 8,
                backgroundColor: s.hex, border: '1px solid rgba(0,0,0,0.08)',
              }}
              aria-label={`${s.hex} ${s.locked ? '(locked)' : '(unlocked)'}`}
            >
              {s.locked && (
                <Lock size={12} style={{ color: readableOn(s.hex) }} />
              )}
            </button>
          ))}
          {/* Add button removed — color count changes not supported in Preview mode */}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, backgroundColor: 'rgba(0,0,0,0.08)', margin: '0 6px' }} />

        {/* Tool buttons */}
        <div className="flex items-center" style={{ gap: 6 }}>
          <DarkTooltip label="Generate" position="top">
            <button
              onClick={onGenerate}
              className="flex items-center justify-center transition-all hover:bg-black/[0.06]"
              style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
              aria-label="Generate new palette"
            >
              <Shuffle size={20} strokeWidth={1.5} style={{ color: '#374151' }} />
            </button>
          </DarkTooltip>
          <DarkTooltip label="Undo" position="top">
            <button
              onClick={onUndo}
              className="flex items-center justify-center transition-all hover:bg-black/[0.06]"
              style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
              aria-label="Undo"
            >
              <Undo2 size={20} strokeWidth={1.5} style={{ color: '#374151' }} />
            </button>
          </DarkTooltip>
          <DarkTooltip label="Redo" position="top">
            <button
              onClick={onRedo}
              className="flex items-center justify-center transition-all hover:bg-black/[0.06]"
              style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
              aria-label="Redo"
            >
              <Redo2 size={20} strokeWidth={1.5} style={{ color: '#374151' }} />
            </button>
          </DarkTooltip>
        </div>

        <div className="flex-1" />

        {/* Generate + Export */}
        <button
          onClick={onGenerate}
          className="flex items-center text-[13px] font-medium transition-all hover:bg-gray-200"
          style={{
            height: 36, padding: '0 16px', gap: 6, borderRadius: 8,
            backgroundColor: '#f3f4f6', border: '1px solid rgba(0,0,0,0.06)', color: BRAND_DARK,
          }}
        >
          <Sparkles size={16} strokeWidth={1.5} />
          Generate
        </button>
        <button
          onClick={onExport}
          className="flex items-center text-white text-[13px] font-semibold transition-all hover:opacity-90"
          style={{
            height: 36, padding: '0 16px', gap: 6, borderRadius: 8,
            backgroundColor: BRAND_VIOLET,
          }}
        >
          <Download size={16} strokeWidth={1.5} />
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
    <div className="overflow-hidden" style={{ borderRadius: 12, backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3" style={{ height: 28, backgroundColor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex" style={{ gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#eab308' }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e' }} />
        </div>
        <div className="flex-1 h-4 rounded" style={{ backgroundColor: '#e5e7eb', maxWidth: 180 }} />
      </div>

      {/* Content */}
      <div className="relative">
        <div style={{ filter: blurred ? 'blur(4px)' : undefined, opacity: blurred ? 0.5 : 1 }}>
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
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: 12,
                padding: '16px 24px',
              }}
            >
              <Lock size={24} style={{ color: BRAND_VIOLET }} />
              <span className="text-[13px] font-semibold" style={{ color: BRAND_DARK }}>
                {label} preview
              </span>
              <span
                className="text-[9px] font-bold px-2 py-0.5 text-white"
                style={{ backgroundColor: BRAND_VIOLET, borderRadius: 4 }}
              >
                PRO
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Label */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <span className="text-[12px] font-medium" style={{ color: BRAND_DARK }}>{label}</span>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5"
          style={{
            borderRadius: 4,
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
