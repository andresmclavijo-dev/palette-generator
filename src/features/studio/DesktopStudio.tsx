import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronDown, Eye, Image, Star, Heart,
  Lock, Unlock, Copy, Check, Info,
  Share2, Link2, Download, Grid3X3,
  Plus, Minus,
} from 'lucide-react'
import { usePaletteStore } from '@/store/paletteStore'
import { usePro } from '@/hooks/usePro'
import { useAuth } from '@/hooks/useAuth'
import { VisionFilterDefs } from '@/components/palette/VisionSimulator'
import type { VisionMode } from '@/components/palette/VisionSimulator'
import AiPrompt, { getAiRemaining } from '@/components/palette/AiPrompt'
import ExportPanel from '@/components/palette/ExportPanel'
import { ProUpgradeModal } from '@/features/pro/ProUpgradeModal'
import SignInModal from '@/components/ui/SignInModal'
import PaymentSuccessModal from '@/components/ui/PaymentSuccessModal'
import SavedPalettesPanel from '@/components/ui/SavedPalettesPanel'
import SaveNameModal from '@/components/ui/SaveNameModal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import CookieConsent from '@/components/CookieConsent'
import {
  readableOn, getColorName, getContrastBadge,
  makeSwatch,
  encodePalette, decodePalette, parseHex, buildShareUrl,
} from '@/lib/colorEngine'
import { extractColorsFromFile } from '@/lib/kMeans'
import { BRAND_VIOLET } from '@/lib/tokens'
import { showToast } from '@/utils/toast'
import { analytics } from '@/lib/posthog'
import { createCheckoutSession, createPortalSession } from '@/lib/stripe'
import SEOContent from '@/components/SEOContent'

// Studio sub-components
import { DarkTooltip } from './DarkTooltip'
import { Dock } from './Dock'
import { ExtractDialog } from './ExtractDialog'
import { ShadesSpecimen } from './ShadesSpecimen'
import { ColorInfoPopover } from './ColorInfoPopover'
import { PreviewMode } from './PreviewMode'
import { UserMenu } from './UserMenu'
import { AiCoachMark, incrementGenerateCount } from '@/components/AiCoachMark'
// Cross-feature imports
import { LibraryView } from '@/features/library/LibraryView'
import { ProfileView } from '@/features/profile/ProfileView'

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
  const [lensOn, setLensOn] = useState(false)
  const [visionMode, setVisionMode] = useState<VisionMode>('normal')
  // Unified dialog state — only one dialog open at a time
  type DialogType = 'extract' | 'harmony' | 'export' | 'ai-full' | 'pro' | 'sign-in' | 'saved' | 'save-name' | 'shortcuts' | 'shades' | null
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
  const [coachVisible, setCoachVisible] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const trackedRef = useRef(false)

  // Color count gating — computed from reactive state
  const isAtFreeCap = !isPro && swatches.length >= 5
  const isAtProMax = isPro && swatches.length >= 8
  const isColorGated = isAtFreeCap || isAtProMax

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
    // Coach mark: show after 5th generate (non-Pro only)
    if (!isPro && method !== 'ai' && incrementGenerateCount()) {
      setCoachVisible(true)
    }
  }, [generate, harmonyMode, count, isPro])

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
        setLensOn(false); setShadesOpen(null); setInfoOpen(null)
        setEditingId(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [triggerGenerate, undo, redo, section, closeDialog])

  // Handlers
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  const handleShare = async () => {
    const shareUrl = buildShareUrl(swatches.map(s => s.hex))
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Paletta — Color Palette', text: 'Check out this color palette', url: shareUrl })
        analytics.track('palette_shared', { method: 'native' })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareCopied(true)
      showToast('Link copied!')
      setTimeout(() => setShareCopied(false), 2000)
      analytics.track('palette_shared', { method: 'clipboard' })
    } catch { /* silent */ }
  }

  const handleSave = async () => {
    if (!user) { openDialog('sign-in'); return }
    if (!isPro) {
      const { supabase } = await import('@/lib/supabase')
      const { count: savedCount } = await supabase
        .from('saved_palettes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if ((savedCount ?? 0) >= 3) { openProModal('save_limit', 'toolbar'); return }
    }
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
      const { supabase } = await import('@/lib/supabase')
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
    const max = isPro ? 8 : 5
    const clamped = hexes.slice(0, max)

    // Save scroll position — dialog close + state update can cause focus
    // restoration to scroll the page down to the SEO section below the fold
    const scrollY = window.scrollY

    setSwatches(clamped.map(h => makeSwatch(h)))
    analytics.track('palette_generated', { method: 'ai', style: harmonyMode, color_count: clamped.length })

    // Restore scroll position after React re-render + Radix focus restoration
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY })
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    })
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
      showToast(`Copied ${hex.toUpperCase()}`, hex)
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
      <div className="w-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* App shell — fixed viewport height */}
      <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* Cookie banner — in normal flow, pushes app down */}
      <CookieConsent />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Skip link */}
        <a
          href="#main-canvas"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-card focus:text-primary focus:rounded-lg focus:border focus:border-primary focus:font-medium"
        >
          Skip to main content
        </a>
        <h1 className="absolute w-px h-px overflow-hidden" style={{ clip: 'rect(0,0,0,0)' }}>
          Paletta — Free Color Palette Generator
        </h1>

        {/* ─── Side Dock ─── */}
        <Dock
          expanded={dockExpanded}
          section={section}
          dockPulse={dockPulse}
          onToggle={toggleDock}
          onSectionChange={setSection}
        />

        {/* ─── Main Area (bento container) ─── */}
        <div
          className="relative flex-1 min-w-0 overflow-hidden"
          style={{
            margin: '12px 12px 12px 0',
            borderRadius: 24,
            background: 'hsl(var(--card))',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 20px 50px -12px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)',
          }}
        >
          {/* ═══ STUDIO SECTION ═══ */}
          {section === 'studio' && (
            <>
              {/* ─── Action Bar (top of bento) — always visible ─── */}
              <div
                className="absolute flex items-center justify-between"
                style={{ top: 12, left: 12, right: 12, zIndex: 30 }}
              >
                {/* LEFT GROUP — 3 pills */}
                <div className="flex items-center" style={{ gap: 6 }}>
                  {/* Pill 1: Harmony dropdown */}
                  <DropdownMenu
                    open={activeDialog === 'harmony'}
                    onOpenChange={(open) => open ? openDialog('harmony') : closeDialog()}
                  >
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center gap-1.5 text-[13px] font-medium text-foreground transition-all hover:bg-surface/50"
                        style={{
                          height: 36,
                          padding: '0 12px',
                          borderRadius: 8,
                          backgroundColor: 'hsl(var(--card) / 0.95)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                          border: '1px solid hsl(var(--border-light))',
                        }}
                        aria-label="Harmony mode"
                      >
                        Harmony: {HARMONIES.find(h => h.mode === harmonyMode)?.label ?? 'Random'}
                        <ChevronDown size={14} className="text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[220px]">
                      {HARMONIES.map(h => (
                        <DropdownMenuItem
                          key={h.mode}
                          onClick={() => handleHarmonySelect(h.mode)}
                          className="flex-col items-start gap-0.5 py-2.5"
                          style={{
                            backgroundColor: harmonyMode === h.mode ? 'hsl(var(--info-bg))' : undefined,
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[13px] font-semibold" style={{ color: harmonyMode === h.mode ? BRAND_VIOLET : 'hsl(var(--foreground))' }}>
                              {h.label}
                            </span>
                            {harmonyMode === h.mode && <Check size={14} className="text-primary" />}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{h.desc}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Pill 2: View mode segmented control */}
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                    <TabsList
                      style={{
                        backgroundColor: 'hsl(var(--card) / 0.95)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        border: '1px solid hsl(var(--border-light))',
                      }}
                    >
                      <TabsTrigger value="colors">Colors</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Pill 3: Accessibility Lens toggle */}
                  <button
                    onClick={() => setLensOn(v => !v)}
                    className="flex items-center transition-all hover:bg-surface/50"
                    style={{
                      height: 36,
                      padding: '0 12px',
                      borderRadius: 8,
                      backgroundColor: lensOn ? BRAND_VIOLET : 'hsl(var(--card) / 0.95)',
                      backdropFilter: lensOn ? undefined : 'blur(12px)',
                      WebkitBackdropFilter: lensOn ? undefined : 'blur(12px)',
                      boxShadow: lensOn ? 'none' : '0 2px 12px rgba(0,0,0,0.06)',
                      border: lensOn ? 'none' : '1px solid hsl(var(--border-light))',
                      gap: 6,
                      color: lensOn ? 'white' : 'hsl(var(--muted-foreground))',
                    }}
                    aria-pressed={lensOn}
                    aria-label="Toggle accessibility lens"
                  >
                    <Eye size={16} strokeWidth={1.5} />
                    <span className="text-[13px] font-medium">Lens</span>
                    {lensOn && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5"
                        style={{
                          borderRadius: 6,
                          backgroundColor: a11yGrade === 'A' ? 'hsl(var(--success-bg))' : a11yGrade === 'B' ? 'hsl(var(--warning-bg))' : 'hsl(var(--error-bg))',
                          color: a11yGrade === 'A' ? 'hsl(var(--success))' : a11yGrade === 'B' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))',
                        }}
                      >
                        {a11yGrade}
                      </span>
                    )}
                  </button>
                </div>

                {/* RIGHT GROUP — single pill */}
                <div
                  className="flex items-center bg-card/95"
                  style={{
                    borderRadius: 12,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: '1px solid hsl(var(--border-light))',
                    padding: 4,
                    gap: 6,
                  }}
                  role="toolbar"
                  aria-label="Palette actions"
                >
                  {/* Action bar tooltips use position="bottom" — bar sits at viewport top edge, "top" would clip */}
                  {/* AI */}
                  <div className="relative">
                    <DarkTooltip label="AI palette" position="bottom">
                      <button
                        onClick={() => activeDialog === 'ai-full' ? closeDialog() : openDialog('ai-full')}
                        className="flex items-center gap-1 text-foreground transition-all hover:bg-surface/50"
                        style={{ height: 36, padding: '0 10px', borderRadius: 8 }}
                        aria-label="AI palette"
                      >
                        <Star size={16} strokeWidth={1.5} />
                        <span className="text-[12px] font-medium">AI</span>
                        {!isPro && (
                          <span
                            className="text-[10px] font-bold text-white px-1.5 py-0.5"
                            style={{ borderRadius: 6, backgroundColor: BRAND_VIOLET }}
                          >
                            {aiRemaining}
                          </span>
                        )}
                      </button>
                    </DarkTooltip>
                    <AiCoachMark
                      visible={coachVisible}
                      onDismiss={() => setCoachVisible(false)}
                      onTry={() => { setCoachVisible(false); openDialog('ai-full') }}
                      position="below"
                    />
                  </div>

                  {/* Extract */}
                  <DarkTooltip label="Extract from image" position="bottom">
                    <button
                      onClick={() => {
                        if (!isPro) { openProModal('image_extraction', 'action_bar'); return }
                        activeDialog === 'extract' ? closeDialog() : openDialog('extract')
                      }}
                      className="flex items-center gap-1 text-foreground transition-all hover:bg-surface/50"
                      style={{ height: 36, padding: '0 10px', borderRadius: 8 }}
                      aria-label="Extract colors from image"
                    >
                      <Image size={16} strokeWidth={1.5} />
                      {!isPro && (
                        <Badge variant="pro">PRO</Badge>
                      )}
                    </button>
                  </DarkTooltip>

                  {/* Divider */}
                  <div style={{ width: 1, height: 20, backgroundColor: 'hsl(var(--border-light))' }} />

                  {/* Save */}
                  <DarkTooltip label="Save palette" position="bottom">
                    <button
                      onClick={handleSave}
                      className="flex items-center justify-center text-foreground transition-all hover:bg-surface/50 active:scale-[0.98]"
                      style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
                      aria-label="Save palette"
                    >
                      <Heart size={16} strokeWidth={1.5} />
                    </button>
                  </DarkTooltip>

                  {/* Share / Copy link */}
                  <DarkTooltip label={canNativeShare ? "Share" : "Copy link"} position="bottom">
                    <button
                      onClick={handleShare}
                      className="flex items-center justify-center text-foreground transition-all hover:bg-surface/50 active:scale-[0.98]"
                      style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
                      aria-label={canNativeShare ? "Share palette" : "Copy link"}
                    >
                      {shareCopied
                        ? <Check size={16} strokeWidth={1.5} style={{ color: 'hsl(var(--success))' }} />
                        : canNativeShare
                          ? <Share2 size={16} strokeWidth={1.5} />
                          : <Link2 size={16} strokeWidth={1.5} />
                      }
                    </button>
                  </DarkTooltip>

                  {/* Export */}
                  <DarkTooltip label="Export" position="bottom">
                    <button
                      onClick={() => activeDialog === 'export' ? closeDialog() : openDialog('export')}
                      className="flex items-center justify-center text-foreground transition-all hover:bg-surface/50 active:scale-[0.98]"
                      style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
                      aria-label="Export palette"
                    >
                      <Download size={16} strokeWidth={1.5} />
                    </button>
                  </DarkTooltip>

                  {/* Divider */}
                  <div style={{ width: 1, height: 20, backgroundColor: 'hsl(var(--border-light))' }} />

                  {/* Go Pro */}
                  {!isPro && (
                    <Button
                      variant="default"
                      size="default"
                      onClick={() => { openProModal(undefined, 'action_bar') }}
                      className="text-[12px] font-semibold"
                    >
                      Go Pro
                    </Button>
                  )}

                  {/* Auth */}
                  {isSignedIn && user?.email ? (
                    <UserMenu email={user.email} isPro={isPro} avatarUrl={user.user_metadata?.avatar_url} onSignOut={signOut} onManage={handleManageSubscription} />
                  ) : (
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => openDialog('sign-in')}
                      className="text-[13px] font-medium"
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </div>

              {/* ─── Accessibility Lens: Vision Picker Bar ─── */}
              {lensOn && (
                <div
                  className="absolute flex items-center"
                  style={{
                    top: 60, left: 12, zIndex: 70,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: '1px solid rgba(0,0,0,0.04)',
                    padding: 3, gap: 2,
                  }}
                  role="radiogroup"
                  aria-label="Accessibility lens modes"
                >
                  {VISION_MODES.map(v => {
                    const needsPro = v.pro && !isPro
                    const isActive = visionMode === v.mode
                    return (
                      <button
                        key={v.mode}
                        onClick={() => {
                          if (needsPro) { openProModal('vision_sim', 'lens_bar'); return }
                          setVisionMode(v.mode)
                        }}
                        className="text-[11px] transition-all"
                        style={{
                          height: 32, padding: '0 10px', borderRadius: 8,
                          fontWeight: isActive ? 600 : 400,
                          backgroundColor: isActive ? 'hsl(var(--card))' : 'transparent',
                          boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : undefined,
                          color: needsPro ? 'hsl(var(--muted-foreground))' : isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                          opacity: needsPro ? 0.6 : 1,
                        }}
                        role="radio"
                        aria-checked={isActive}
                        aria-label={v.label}
                      >
                        {v.label.replace(' Vision', '')}
                        {needsPro && (
                          <Badge variant="pro" className="ml-1">PRO</Badge>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* ─── Colors View ─── */}
              {viewMode === 'colors' && (
                <main id="main-canvas" className="absolute inset-0 overflow-hidden" style={{ filter: lensOn ? visionFilter : undefined }}>
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
                              style={{ backgroundColor: 'rgba(0,0,0,0.45)', fontSize: lensOn ? 18 : 11 }}
                            >
                              {contrast.level} {contrast.ratio}:1 {contrast.pass ? '✓' : '✗'}
                            </div>

                            {/* Accessibility Lens: Aa text previews */}
                            {lensOn && (
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
                                  className="flex items-center justify-center transition-all active:scale-[0.98]"
                                  style={{ width: 36, height: 36, padding: 0, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' }}
                                  aria-label={isCopied ? 'Copied' : `Copy ${s.hex}`}
                                >
                                  {isCopied
                                    ? <Check size={16} strokeWidth={1.5} style={{ color: textColor }} />
                                    : <Copy size={16} strokeWidth={1.5} style={{ color: textColor }} />}
                                </button>
                              </DarkTooltip>
                              <DarkTooltip label="Color details" position="right">
                                <button
                                  onClick={(e) => {
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                    if (infoOpen === s.id) { setInfoOpen(null); setInfoAnchorRect(null) }
                                    else { setInfoOpen(s.id); setInfoAnchorRect(rect) }
                                  }}
                                  className="flex items-center justify-center transition-all active:scale-[0.98]"
                                  style={{ width: 36, height: 36, padding: 0, borderRadius: 8, backgroundColor: showInfo ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)' }}
                                  aria-label="Color info"
                                  aria-expanded={showInfo}
                                >
                                  <Info size={16} strokeWidth={1.5} style={{ color: textColor }} />
                                </button>
                              </DarkTooltip>
                              <DarkTooltip label="Shade scale" position="right">
                                <button
                                  onClick={() => { setShadesOpen(shadesOpen === s.id ? null : s.id); if (shadesOpen !== s.id) openDialog('shades'); else closeDialog() }}
                                  className="flex items-center justify-center transition-all active:scale-[0.98]"
                                  style={{ width: 36, height: 36, padding: 0, borderRadius: 8, backgroundColor: showShades ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)' }}
                                  aria-label="View shade scale"
                                  aria-expanded={showShades}
                                >
                                  <Grid3X3 size={16} strokeWidth={1.5} style={{ color: textColor }} />
                                </button>
                              </DarkTooltip>
                              <DarkTooltip label={s.locked ? 'Unlock' : 'Lock'} position="right">
                                <button
                                  onClick={() => lockSwatch(s.id)}
                                  className="flex items-center justify-center transition-all active:scale-[0.98]"
                                  style={{ width: 36, height: 36, padding: 0, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)' }}
                                  aria-label={s.locked ? 'Unlock color' : 'Lock color'}
                                >
                                  {s.locked
                                    ? <Lock size={16} strokeWidth={1.5} style={{ color: textColor }} />
                                    : <Unlock size={16} strokeWidth={1.5} style={{ color: textColor }} />}
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
                  onGenerate={() => triggerGenerate('button')}
                  onExport={() => openDialog('export')}
                  onUndo={undo}
                  onRedo={redo}
                  onProGate={openProModal}
                  onLock={lockSwatch}
                  visionFilter={lensOn ? visionFilter : undefined}
                />
              )}

              {/* Bottom bar — color count + spacebar hint */}
              {viewMode === 'colors' && activeDialog !== 'ai-full' && activeDialog !== 'export' && activeDialog !== 'shades' && (
                <div
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center"
                  style={{ gap: 6, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '4px 6px' }}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { if (count > 3) setCount(count - 1) }}
                      className="flex items-center justify-center transition-all hover:bg-white/10 active:scale-[0.98]"
                      style={{ width: 32, height: 32, padding: 0, borderRadius: 8, opacity: count <= 3 ? 0.3 : 1 }}
                      disabled={count <= 3}
                      aria-label="Remove color"
                    >
                      <Minus size={16} style={{ color: '#fff' }} />
                    </button>
                    <span className="text-[14px] font-mono font-semibold text-white tabular-nums" style={{ minWidth: 20, textAlign: 'center' }}>{count}</span>
                    <button
                      onClick={() => {
                        const liveCount = usePaletteStore.getState().swatches.length
                        const liveMax = isPro ? 8 : 5
                        if (!isPro && liveCount >= 5) { openProModal('color_count', 'canvas_bar'); return }
                        if (liveCount >= liveMax) return
                        setCount(liveCount + 1)
                      }}
                      className={`relative flex items-center justify-center transition-all active:scale-[0.98] ${isAtProMax ? 'cursor-not-allowed' : 'cursor-pointer'} ${!isColorGated ? 'hover:bg-white/10' : ''}`}
                      style={{ width: 32, height: 32, padding: 0, borderRadius: 8, opacity: !isColorGated ? 1 : isAtFreeCap ? 0.5 : 0.3 }}
                      disabled={isAtProMax}
                      aria-label={isAtFreeCap ? 'Upgrade to Pro for more colors' : isAtProMax ? 'Maximum colors reached' : 'Add color'}
                    >
                      <Plus size={16} style={{ color: '#fff' }} />
                      {isAtFreeCap && (
                        <span className="absolute flex items-center justify-center rounded-full" style={{ bottom: -6, right: -6, width: 16, height: 16, backgroundColor: 'rgba(0,0,0,0.75)' }}>
                          <Lock size={10} style={{ color: '#fff' }} />
                        </span>
                      )}
                    </button>
                  </div>
                  <div style={{ width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
                  <div className="flex items-center gap-2">
                    <kbd className="inline-flex items-center justify-center text-[11px] font-mono font-semibold" style={{ padding: '2px 8px', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}>Space</kbd>
                    <span className="text-[12px] font-medium text-white/70">generate</span>
                  </div>
                  <div style={{ width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
                  <ShortcutsPopover
                    open={activeDialog === 'shortcuts'}
                    onToggle={() => activeDialog === 'shortcuts' ? closeDialog() : openDialog('shortcuts')}
                  />
                </div>
              )}
            </>
          )}

          {/* ═══ LIBRARY SECTION ═══ */}
          {section === 'library' && (
            <LibraryView
              isSignedIn={isSignedIn}
              userId={user?.id}
              isPro={isPro}
              onLoad={(hexes, name) => { setSwatches(hexes.map(h => makeSwatch(h))); setSection('studio'); setViewMode('colors'); showToast(`Loaded · ${name || 'Untitled'}`) }}
              onProGate={openProModal}
              onSignIn={() => openDialog('sign-in')}
            />
          )}

          {/* ═══ PROFILE SECTION ═══ */}
          {section === 'profile' && (
            <ProfileView
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

      <ExportPanel open={activeDialog === 'export'} hexes={swatches.map(s => s.hex)} onClose={closeDialog} onProGate={() => openProModal()} />

      <ExtractDialog
        open={activeDialog === 'extract'}
        uploading={imageUploading}
        onFile={handleImageUpload}
        onClose={closeDialog}
        fileInputRef={fileInputRef}
      />

      <SignInModal open={activeDialog === 'sign-in'} onClose={closeDialog} onGoogleSignIn={signInWithGoogle} />
      <ProUpgradeModal open={activeDialog === 'pro'} onClose={closeDialog} paletteColors={swatches.map(s => s.hex)} />
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

      {/* Shade scale modal */}
      {(() => {
        const sw = shadesOpen ? swatches.find(s => s.id === shadesOpen) : null
        return (
          <ShadesSpecimen
            open={activeDialog === 'shades' && !!sw}
            hex={sw?.hex ?? '#000000'}
            onClose={() => { setShadesOpen(null); closeDialog() }}
          />
        )
      })()}

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

// ─── Shortcuts Popover (portal-rendered to escape overflow-hidden) ───
const SHORTCUTS = [
  { key: 'Space', desc: 'Generate palette' },
  { key: '⌘ Z', desc: 'Undo' },
  { key: '⇧ ⌘ Z', desc: 'Redo' },
  { key: '1', desc: 'Colors view' },
  { key: '2', desc: 'Preview view' },
  { key: 'Esc', desc: 'Close panel' },
]

function ShortcutsPopover({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ bottom: 0, right: 0 })

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ bottom: window.innerHeight - rect.top + 8, right: window.innerWidth - rect.right })
    }
  }, [open])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target) || panelRef.current?.contains(target)) return
      onToggle()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onToggle])

  return (
    <>
      <button
        ref={btnRef}
        onClick={onToggle}
        className="flex items-center justify-center transition-all hover:bg-white/10 active:scale-[0.98]"
        style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }}
        aria-label="Keyboard shortcuts"
        aria-expanded={open}
      >
        <span className="text-[14px]" style={{ color: 'rgba(255,255,255,0.7)' }} aria-hidden="true">?</span>
      </button>
      {open && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[200] bg-card"
          style={{
            bottom: pos.bottom,
            right: pos.right,
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            border: '1px solid hsl(var(--border-light))',
            width: 220,
            padding: 16,
          }}
          role="dialog"
          aria-label="Keyboard shortcuts"
        >
          <p className="text-[12px] font-medium m-0 mb-2" style={{ color: BRAND_VIOLET }}>Keyboard shortcuts</p>
          {SHORTCUTS.map(s => (
            <div key={s.key} className="flex items-center justify-between py-2">
              <span className="text-[12px] text-foreground">{s.desc}</span>
              <kbd className="text-[10px] font-mono px-2 py-0.5 rounded-md" style={{ backgroundColor: 'hsl(var(--border-light))', color: 'hsl(var(--muted-foreground))' }}>{s.key}</kbd>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
