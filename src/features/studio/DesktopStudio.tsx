import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronDown, Image, Star, Heart,
  Lock, Unlock, Copy, Check, Pencil, GripVertical, Code,
  Share2, Link2, Grid3X3,
  Plus, Minus, Undo2, Redo2,
  Shuffle, Palette, Triangle, Contrast, Droplet, Eye, Sparkles, Loader2,
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
import IconButton from '@/components/ui/IconButton'
// Tabs import removed — Preview is its own section now
import { Badge } from '@/components/ui/badge'
import CookieConsent from '@/components/CookieConsent'
import DropdownSectionHeader from '@/components/ui/DropdownSectionHeader'
import {
  readableOn, getColorName, getContrastBadge,
  makeSwatch,
  encodePalette, decodePalette, buildShareUrl,
  SEMANTIC_ROLES,
} from '@/lib/colorEngine'
import { extractColorsFromFile } from '@/lib/kMeans'
import { BRAND_VIOLET } from '@/lib/tokens'
import { PRO_GATES, isLensModeFree } from '@/lib/proFeatures'
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
import { OnboardingTour } from '@/components/OnboardingTour'
// Cross-feature imports
import { LibraryView } from '@/features/library/LibraryView'
import { ProfileView } from '@/features/profile/ProfileView'

// ─── Types ───────────────────────────────────────────────────
type SectionId = 'studio' | 'preview' | 'library' | 'profile'
// ViewMode removed — Preview is now its own section
type HarmonyMode = 'random' | 'analogous' | 'monochromatic' | 'complementary' | 'triadic'

const HARMONIES: { mode: HarmonyMode; label: string; short: string; desc: string; icon: typeof Shuffle; iconBg: string }[] = [
  { mode: 'random', label: 'Random', short: 'Random', desc: 'No rules, pure exploration', icon: Shuffle, iconBg: 'hsl(var(--muted-foreground) / 0.12)' },
  { mode: 'analogous', label: 'Analogous', short: 'Analogous', desc: 'Colors next to each other on the wheel', icon: Palette, iconBg: 'hsla(25, 95%, 53%, 0.12)' },
  { mode: 'triadic', label: 'Triadic', short: 'Triadic', desc: 'Three evenly spaced colors', icon: Triangle, iconBg: 'hsla(142, 71%, 45%, 0.12)' },
  { mode: 'complementary', label: 'Complementary', short: 'Compl.', desc: 'Opposite sides of the wheel', icon: Contrast, iconBg: 'hsla(217, 91%, 60%, 0.12)' },
  { mode: 'monochromatic', label: 'Monochromatic', short: 'Mono', desc: 'Shades of a single hue', icon: Droplet, iconBg: 'hsla(263, 100%, 64%, 0.12)' },
]

const VISION_MODES: { mode: VisionMode; label: string; short: string; desc: string }[] = [
  { mode: 'normal', label: 'Normal Vision', short: 'Normal', desc: 'Full color spectrum' },
  { mode: 'protanopia', label: 'Protanopia', short: 'Protanopia', desc: 'Red-green · reds appear dark or missing' },
  { mode: 'deuteranopia', label: 'Deuteranopia', short: 'Deuteranopia', desc: 'Red-green · most common (~5% of men)' },
  { mode: 'tritanopia', label: 'Tritanopia', short: 'Tritanopia', desc: 'Blue-yellow confusion' },
  { mode: 'achromatopsia', label: 'Achromatopsia', short: 'Achrom.', desc: 'Grayscale only · no color perception' },
]

const DOCK_STORAGE_KEY = 'paletta_dock_expanded'

// ─── Main Component ──────────────────────────────────────────
export default function DesktopStudio() {
  // Global state
  const { isPro, showPaymentModal, setShowPaymentModal } = usePro()
  const { user, session, isSignedIn, signInWithGoogle, signOut } = useAuth()
  const {
    swatches, harmonyMode, count,
    generate, lockSwatch, editSwatch, setHarmonyMode, setCount,
    undo, redo, setSwatches, reorderSwatches,
  } = usePaletteStore()

  // Local UI state
  const [dockExpanded, setDockExpanded] = useState(() => {
    const stored = localStorage.getItem(DOCK_STORAGE_KEY)
    return stored !== null ? stored === 'true' : true
  })
  const [section, setSection] = useState<SectionId>('studio')
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
  // Inline hex editing removed — users edit via the color picker popover
  const [imageUploading, setImageUploading] = useState(false)

  const [dockPulse, setDockPulse] = useState(() => !sessionStorage.getItem('paletta_dock_pulsed'))
  const [coachVisible, setCoachVisible] = useState(false)

  // Drag-to-reorder state
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const dragRef = useRef<number | null>(null)
  const overRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback((index: number) => {
    dragRef.current = index
    overRef.current = index
    setDragIdx(index)
    setOverIdx(index)
  }, [])

  useEffect(() => {
    if (dragIdx === null) return
    const handleMove = (e: PointerEvent) => {
      const el = canvasRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const fraction = (e.clientX - rect.left) / rect.width
      const idx = Math.max(0, Math.min(swatches.length - 1, Math.floor(fraction * swatches.length)))
      overRef.current = idx
      setOverIdx(idx)
    }
    const handleUp = () => {
      const from = dragRef.current
      const to = overRef.current
      if (from !== null && to !== null && from !== to) {
        reorderSwatches(from, to)
      }
      dragRef.current = null
      overRef.current = null
      setDragIdx(null)
      setOverIdx(null)
    }
    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
    document.addEventListener('pointercancel', handleUp)
    return () => {
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
      document.removeEventListener('pointercancel', handleUp)
    }
  }, [dragIdx, swatches.length, reorderSwatches])

  // Compute visual reorder during drag
  const displayOrder = (() => {
    const indices = swatches.map((_, i) => i)
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) return indices
    const order = [...indices]
    const [removed] = order.splice(dragIdx, 1)
    order.splice(overIdx, 0, removed)
    return order
  })()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const trackedRef = useRef(false)

  // Color count gating — computed from reactive state
  const isAtFreeCap = !isPro && swatches.length >= PRO_GATES.MAX_FREE_COLORS
  const isAtProMax = isPro && swatches.length >= PRO_GATES.MAX_PRO_COLORS
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
      if (e.code === 'Space' && (section === 'studio' || section === 'preview')) { e.preventDefault(); triggerGenerate('spacebar') }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); undo() }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); redo() }
      if (e.key === '1' && (section === 'studio' || section === 'preview')) setSection('studio')
      if (e.key === '2' && (section === 'studio' || section === 'preview')) setSection('preview')
      if (e.key === 'Escape') {
        closeDialog()
        setLensOn(false); setShadesOpen(null); setInfoOpen(null); setInfoAnchorRect(null)
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
      if ((savedCount ?? 0) >= PRO_GATES.MAX_FREE_SAVES) { openProModal('save_limit', 'toolbar'); return }
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
    const max = isPro ? PRO_GATES.MAX_PRO_COLORS : PRO_GATES.MAX_FREE_COLORS
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
      const url = await createPortalSession(user.email, session?.access_token)
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

  const handleHarmonySelect = (mode: HarmonyMode) => {
    setHarmonyMode(mode)
    closeDialog()
    triggerGenerate('button')
  }

  const visionFilter = visionMode !== 'normal' ? `url(#vision-${visionMode})` : undefined

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
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-card focus:text-primary focus:rounded-button focus:border focus:border-primary focus:font-medium"
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
              {/* ─── Action Bar (top-right of bento) ─── */}
              <ActionBar
                isPro={isPro}
                isSignedIn={isSignedIn}
                user={user}
                aiRemaining={aiRemaining}
                coachVisible={coachVisible}
                shareCopied={shareCopied}
                canNativeShare={canNativeShare}
                onAiToggle={() => activeDialog === 'ai-full' ? closeDialog() : openDialog('ai-full')}
                onExtract={() => {
                  if (!isPro) { openProModal('image_extraction', 'action_bar'); return }
                  activeDialog === 'extract' ? closeDialog() : openDialog('extract')
                }}
                onSave={handleSave}
                onShare={handleShare}
                onProGate={() => openProModal(undefined, 'action_bar')}
                onSignIn={() => openDialog('sign-in')}
                onSignOut={signOut}
                onManage={handleManageSubscription}
                onCoachDismiss={() => setCoachVisible(false)}
                onCoachTry={() => { setCoachVisible(false); openDialog('ai-full') }}
              />

              {/* ─── Colors View ─── */}
              {(
                <main id="main-canvas" className="absolute inset-0 overflow-hidden" style={{ filter: lensOn ? visionFilter : undefined }}>
                  <div ref={canvasRef} className="flex h-full" style={{ touchAction: dragIdx !== null ? 'none' : undefined }}>
                    {displayOrder.map((swatchIdx) => {
                      const s = swatches[swatchIdx]
                      const textColor = readableOn(s.hex)
                      const contrast = getContrastBadge(s.hex)
                      const isCopied = copiedId === s.id
                      const showShades = shadesOpen === s.id
                      const showInfo = infoOpen === s.id
                      const positionIdx = displayOrder.indexOf(swatchIdx)
                      // Swatch-adaptive button overlays — white on dark swatches, black on light
                      const isLightSwatch = textColor === '#000000'
                      const btnBg = isLightSwatch ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.15)'
                      const btnBgActive = isLightSwatch ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.25)'
                      return (
                        <div
                          key={s.id}
                          className="relative flex-1 flex flex-col items-center justify-center transition-all group/swatch"
                          style={{
                            backgroundColor: s.hex,
                            paddingTop: 70,
                            paddingBottom: 72,
                            opacity: dragIdx === swatchIdx ? 0.6 : 1,
                            zIndex: dragIdx === swatchIdx ? 20 : undefined,
                          }}
                        >
                          <div className="flex flex-col items-center justify-center gap-3">
                            {/* WCAG badge — theme-independent: dark overlay + white text */}
                            <div
                              className="px-2.5 py-1 rounded-button font-mono font-semibold"
                              style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11 }}
                            >
                              {contrast.level} {contrast.ratio}:1 {contrast.pass ? '✓' : '✗'}
                            </div>

                            {/* Accessibility Lens: Aa text previews */}
                            {lensOn && (
                              <div className="flex gap-2">
                                <span className="text-[14px] font-bold px-2 py-0.5 rounded-badge" style={{ backgroundColor: 'hsl(var(--card))', color: s.hex }}>Aa</span>
                                <span className="text-[14px] font-bold px-2 py-0.5 rounded-badge" style={{ backgroundColor: 'hsl(var(--foreground))', color: s.hex }}>Aa</span>
                              </div>
                            )}

                            {/* Combined role / color name label */}
                            <span
                              className="text-[13px] font-medium text-center leading-tight px-2"
                              style={{ color: textColor, wordBreak: 'break-word' }}
                            >
                              {SEMANTIC_ROLES[positionIdx]?.role ?? `Color ${positionIdx + 1}`}
                              <span style={{ opacity: 0.5 }}> / </span>
                              {getColorName(s.hex)}
                            </span>

                            {/* Hex code — read-only secondary label */}
                            <span
                              className="font-mono text-[12px] font-normal tracking-wide"
                              style={{ color: textColor, opacity: 0.7 }}
                            >
                              {s.hex.toUpperCase()}
                            </span>

                            {/* Action buttons — ordered by usage frequency */}
                            <div className="flex flex-col items-center" style={{ gap: 6 }}>
                              {/* 1. Copy hex (most used) */}
                              <DarkTooltip label={isCopied ? 'Copied' : 'Copy hex'} position="right">
                                <IconButton
                                  icon={isCopied
                                    ? <Check size={16} strokeWidth={1.5} style={{ color: textColor }} />
                                    : <Copy size={16} strokeWidth={1.5} style={{ color: textColor }} />}
                                  onClick={() => copyHex(s.id, s.hex)}
                                  label={isCopied ? 'Copied' : `Copy ${s.hex}`}
                                  size={36}
                                  className="rounded-button bg-transparent"
                                  style={{ backgroundColor: btnBg }}
                                />
                              </DarkTooltip>
                              {/* 2. Edit color (opens picker popover) */}
                              <DarkTooltip label="Edit color" position="right">
                                <IconButton
                                  icon={<Pencil size={16} strokeWidth={1.5} style={{ color: textColor }} />}
                                  onClick={(e) => {
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                    if (infoOpen === s.id) { setInfoOpen(null); setInfoAnchorRect(null) }
                                    else { setInfoOpen(s.id); setInfoAnchorRect(rect) }
                                  }}
                                  label="Edit color"
                                  size={36}
                                  className="rounded-button bg-transparent"
                                  style={{ backgroundColor: showInfo ? btnBgActive : btnBg }}
                                  aria-expanded={showInfo}
                                />
                              </DarkTooltip>
                              {/* 3. Shade scale (Pro) */}
                              <DarkTooltip label={isPro ? 'Shade scale' : 'Shade scale (Pro)'} position="right">
                                <IconButton
                                  icon={<Grid3X3 size={16} strokeWidth={1.5} style={{ color: textColor }} />}
                                  onClick={() => {
                                    if (!isPro) { openProModal('shade_scale', 'swatch_action'); return }
                                    setShadesOpen(shadesOpen === s.id ? null : s.id); if (shadesOpen !== s.id) openDialog('shades'); else closeDialog()
                                  }}
                                  label={isPro ? 'View shade scale' : 'Shade scale (Pro feature)'}
                                  size={36}
                                  className="rounded-button bg-transparent"
                                  style={{ backgroundColor: showShades ? btnBgActive : btnBg }}
                                  aria-expanded={showShades}
                                />
                              </DarkTooltip>
                              {/* 4. Lock color */}
                              <DarkTooltip label={s.locked ? 'Unlock' : 'Lock'} position="right">
                                <IconButton
                                  icon={s.locked
                                    ? <Lock size={16} strokeWidth={1.5} style={{ color: textColor }} />
                                    : <Unlock size={16} strokeWidth={1.5} style={{ color: textColor }} />}
                                  onClick={() => lockSwatch(s.id)}
                                  label={s.locked ? 'Unlock color' : 'Lock color'}
                                  size={36}
                                  className="rounded-button bg-transparent"
                                  style={{ backgroundColor: btnBg }}
                                />
                              </DarkTooltip>
                              {/* 5. Drag handle (least frequent) */}
                              <DarkTooltip label="Drag to reorder" position="right">
                                <div
                                  className="flex items-center justify-center transition-all cursor-grab active:cursor-grabbing"
                                  style={{ width: 36, height: 36, padding: 0, borderRadius: 8, backgroundColor: btnBg, touchAction: 'none' }}
                                  onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); handleDragStart(swatchIdx) }}
                                  role="button"
                                  aria-label="Drag to reorder"
                                  tabIndex={0}
                                >
                                  <GripVertical size={16} strokeWidth={1.5} style={{ color: textColor }} />
                                </div>
                              </DarkTooltip>
                            </div>

                            {s.locked && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-badge" style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' }}>Locked</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </main>
              )}

              {/* ─── Floating Bottom Bar ─── */}
              {activeDialog === null && (
                <ColorsBottomBar
                  harmonyMode={harmonyMode}
                  onHarmonySelect={handleHarmonySelect}
                  lensOn={lensOn}
                  visionMode={visionMode}
                  isPro={isPro}
                  onToggleLens={() => setLensOn(v => !v)}
                  onVisionChange={setVisionMode}
                  onProGate={() => openProModal('vision_sim', 'lens_bar')}
                  onUndo={undo}
                  onRedo={redo}
                  count={count}
                  isAtFreeCap={isAtFreeCap}
                  isAtProMax={isAtProMax}
                  isColorGated={isColorGated}
                  onCountDown={() => { if (count > 3) setCount(count - 1) }}
                  onCountUp={() => {
                    const liveCount = usePaletteStore.getState().swatches.length
                    const liveMax = isPro ? PRO_GATES.MAX_PRO_COLORS : PRO_GATES.MAX_FREE_COLORS
                    if (!isPro && liveCount >= PRO_GATES.MAX_FREE_COLORS) { openProModal('color_count', 'canvas_bar'); return }
                    if (liveCount >= liveMax) return
                    setCount(liveCount + 1)
                  }}
                  onGenerate={() => triggerGenerate('button')}
                  onGetCode={() => openDialog('export')}
                />
              )}
            </>
          )}

          {/* ═══ PREVIEW SECTION ═══ */}
          {section === 'preview' && (
            <>
              {/* ─── Action Bar (top-right of bento) ─── */}
              <ActionBar
                isPro={isPro}
                isSignedIn={isSignedIn}
                user={user}
                aiRemaining={aiRemaining}
                coachVisible={coachVisible}
                shareCopied={shareCopied}
                canNativeShare={canNativeShare}
                onAiToggle={() => activeDialog === 'ai-full' ? closeDialog() : openDialog('ai-full')}
                onExtract={() => {
                  if (!isPro) { openProModal('image_extraction', 'action_bar'); return }
                  activeDialog === 'extract' ? closeDialog() : openDialog('extract')
                }}
                onSave={handleSave}
                onShare={handleShare}
                onProGate={() => openProModal(undefined, 'action_bar')}
                onSignIn={() => openDialog('sign-in')}
                onSignOut={signOut}
                onManage={handleManageSubscription}
                onCoachDismiss={() => setCoachVisible(false)}
                onCoachTry={() => { setCoachVisible(false); openDialog('ai-full') }}
              />

              <PreviewMode
                swatches={swatches}
                isPro={isPro}
                onProGate={openProModal}
                visionFilter={lensOn ? visionFilter : undefined}
              />

              {/* Floating Bottom Bar */}
              {activeDialog === null && (
                <PreviewBottomBar
                  swatches={swatches}
                  onLock={lockSwatch}
                  onUndo={undo}
                  onRedo={redo}
                  count={count}
                  isAtFreeCap={isAtFreeCap}
                  isAtProMax={isAtProMax}
                  isColorGated={isColorGated}
                  onCountDown={() => { if (count > 3) setCount(count - 1) }}
                  onCountUp={() => {
                    const liveCount = usePaletteStore.getState().swatches.length
                    const liveMax = isPro ? PRO_GATES.MAX_PRO_COLORS : PRO_GATES.MAX_FREE_COLORS
                    if (!isPro && liveCount >= PRO_GATES.MAX_FREE_COLORS) { openProModal('color_count', 'canvas_bar'); return }
                    if (liveCount >= liveMax) return
                    setCount(liveCount + 1)
                  }}
                  onGenerate={() => triggerGenerate('button')}
                  onGetCode={() => openDialog('export')}
                />
              )}
            </>
          )}

          {/* ═══ LIBRARY SECTION ═══ */}
          {section === 'library' && (
            <LibraryView
              isSignedIn={isSignedIn}
              userId={user?.id}
              isPro={isPro}
              onLoad={(hexes, name) => { setSwatches(hexes.map(h => makeSwatch(h))); setSection('studio'); showToast(`Loaded · ${name || 'Untitled'}`) }}
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
      <OnboardingTour />

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

      {/* Color picker + info popover — fixed positioned, outside overflow containers */}
      {infoOpen && infoAnchorRect && (() => {
        const sw = swatches.find(s => s.id === infoOpen)
        if (!sw) return null
        return (
          <ColorInfoPopover
            hex={sw.hex}
            swatchId={sw.id}
            anchorRect={infoAnchorRect}
            onClose={() => { setInfoOpen(null); setInfoAnchorRect(null) }}
            onEditSwatch={editSwatch}
          />
        )
      })()}

      {/* SEO content below fold — scrollable past the app viewport */}
      <SEOContent />
      </div>{/* close outer w-screen wrapper */}
    </>
  )
}

// ─── Floating Bottom Bar for Colors View ───
const FLOATING_BAR_STYLE: React.CSSProperties = {
  height: 48,
  borderRadius: 12,
  backgroundColor: 'hsl(var(--card) / 0.95)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
  border: '1px solid hsl(var(--border-light))',
  padding: '0 12px',
}

// ─── Shared Action Bar (top-right of bento, used by Studio + Preview) ────
function ActionBar({
  isPro, isSignedIn, user, aiRemaining, coachVisible,
  shareCopied, canNativeShare,
  onAiToggle, onExtract, onSave, onShare, onProGate, onSignIn, onSignOut, onManage,
  onCoachDismiss, onCoachTry,
}: {
  isPro: boolean
  isSignedIn: boolean
  user: { email?: string; user_metadata?: { avatar_url?: string } } | null
  aiRemaining: number
  coachVisible: boolean
  shareCopied: boolean
  canNativeShare: boolean
  onAiToggle: () => void
  onExtract: () => void
  onSave: () => void
  onShare: () => void
  onProGate: () => void
  onSignIn: () => void
  onSignOut: () => void
  onManage: () => void
  onCoachDismiss: () => void
  onCoachTry: () => void
}) {
  return (
    <div
      className="absolute flex items-center justify-end"
      style={{ top: 12, left: 12, right: 12, zIndex: 30 }}
    >
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
        {/* AI */}
        <div className="relative">
          <DarkTooltip label="AI palette" position="bottom">
            <button
              onClick={onAiToggle}
              className="flex items-center gap-1 text-foreground transition-all hover:bg-surface/50"
              style={{ height: 36, padding: '0 10px', borderRadius: 8 }}
              aria-label="AI palette"
            >
              <Star size={16} strokeWidth={1.5} />
              <span className="text-[12px] font-medium">AI</span>
              {!isPro && (
                <span
                  className="text-[10px] font-bold text-primary-foreground px-1.5 py-0.5 rounded-badge"
                  style={{ backgroundColor: BRAND_VIOLET }}
                >
                  {aiRemaining}
                </span>
              )}
            </button>
          </DarkTooltip>
          <AiCoachMark
            visible={coachVisible}
            onDismiss={onCoachDismiss}
            onTry={onCoachTry}
            position="below"
          />
        </div>

        {/* Extract */}
        <DarkTooltip label="Extract from image" position="bottom">
          <button
            onClick={onExtract}
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
          <IconButton
            icon={<Heart size={16} strokeWidth={1.5} />}
            onClick={onSave}
            label="Save palette"
            size={36}
            className="rounded-button bg-transparent text-foreground"
          />
        </DarkTooltip>

        {/* Share / Copy link */}
        <DarkTooltip label={canNativeShare ? "Share" : "Copy link"} position="bottom">
          <IconButton
            icon={shareCopied
              ? <Check size={16} strokeWidth={1.5} style={{ color: 'hsl(var(--success))' }} />
              : canNativeShare
                ? <Share2 size={16} strokeWidth={1.5} />
                : <Link2 size={16} strokeWidth={1.5} />
            }
            onClick={onShare}
            label={canNativeShare ? "Share palette" : "Copy link"}
            size={36}
            className="rounded-button bg-transparent text-foreground"
          />
        </DarkTooltip>

        {/* Divider */}
        <div style={{ width: 1, height: 20, backgroundColor: 'hsl(var(--border-light))' }} />

        {/* Go Pro */}
        {!isPro && (
          <Button
            variant="default"
            size="default"
            onClick={onProGate}
            className="text-[12px] font-semibold"
          >
            Go Pro
          </Button>
        )}

        {/* Auth */}
        {isSignedIn && user?.email ? (
          <UserMenu email={user.email} isPro={isPro} avatarUrl={user.user_metadata?.avatar_url} onSignOut={onSignOut} onManage={onManage} />
        ) : (
          <Button
            variant="outline"
            size="default"
            onClick={onSignIn}
            className="text-[13px] font-medium border-primary text-primary hover:bg-surface"
          >
            Sign In
          </Button>
        )}
      </div>
    </div>
  )
}

function ColorsBottomBar({
  harmonyMode, onHarmonySelect,
  lensOn, visionMode, isPro,
  onToggleLens, onVisionChange, onProGate,
  onUndo, onRedo,
  count, isAtFreeCap, isAtProMax, isColorGated,
  onCountDown, onCountUp, onGenerate, onGetCode,
}: {
  harmonyMode: HarmonyMode
  onHarmonySelect: (mode: HarmonyMode) => void
  lensOn: boolean
  visionMode: VisionMode
  isPro: boolean
  onToggleLens: () => void
  onVisionChange: (mode: VisionMode) => void
  onProGate: () => void
  onUndo: () => void
  onRedo: () => void
  count: number
  isAtFreeCap: boolean
  isAtProMax: boolean
  isColorGated: boolean
  onCountDown: () => void
  onCountUp: () => void
  onGenerate: () => void
  onGetCode: () => void
}) {
  // Harmony dropdown
  const [harmonyOpen, setHarmonyOpen] = useState(false)
  const harmonyBtnRef = useRef<HTMLButtonElement>(null)
  const harmonyDropRef = useRef<HTMLDivElement>(null)
  const [harmonyPos, setHarmonyPos] = useState({ bottom: 0, left: 0 })

  // Vision dropdown
  const [visionOpen, setVisionOpen] = useState(false)
  const visionBtnRef = useRef<HTMLButtonElement>(null)
  const visionDropRef = useRef<HTMLDivElement>(null)
  const [visionPos, setVisionPos] = useState({ bottom: 0, left: 0 })

  // Generate loading state
  const [generating, setGenerating] = useState(false)
  const handleGenerate = () => {
    if (generating) return
    setGenerating(true)
    onGenerate()
    setTimeout(() => setGenerating(false), 200)
  }

  const toggleHarmony = () => {
    if (!harmonyOpen && harmonyBtnRef.current) {
      const rect = harmonyBtnRef.current.getBoundingClientRect()
      setHarmonyPos({ bottom: window.innerHeight - rect.top + 8, left: rect.left })
    }
    setHarmonyOpen(o => !o)
    setVisionOpen(false)
  }

  const toggleVision = () => {
    if (!visionOpen && visionBtnRef.current) {
      const rect = visionBtnRef.current.getBoundingClientRect()
      setVisionPos({ bottom: window.innerHeight - rect.top + 8, left: rect.left })
    }
    setVisionOpen(o => !o)
    setHarmonyOpen(false)
  }

  const selectHarmony = (mode: HarmonyMode) => {
    onHarmonySelect(mode)
    setHarmonyOpen(false)
  }

  const selectVision = (v: typeof VISION_MODES[number]) => {
    if (!isLensModeFree(v.mode) && !isPro) { setVisionOpen(false); onProGate(); return }
    if (v.mode === 'normal') {
      if (lensOn) onToggleLens()
    } else {
      if (!lensOn) onToggleLens()
      onVisionChange(v.mode)
    }
    setVisionOpen(false)
  }

  // Close dropdowns on outside click
  useEffect(() => {
    if (!harmonyOpen && !visionOpen) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (harmonyOpen && !harmonyBtnRef.current?.contains(t) && !harmonyDropRef.current?.contains(t)) setHarmonyOpen(false)
      if (visionOpen && !visionBtnRef.current?.contains(t) && !visionDropRef.current?.contains(t)) setVisionOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [harmonyOpen, visionOpen])

  // Close on Escape
  useEffect(() => {
    if (!harmonyOpen && !visionOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setHarmonyOpen(false); setVisionOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [harmonyOpen, visionOpen])

  const activeHarmonyLabel = HARMONIES.find(h => h.mode === harmonyMode)?.label ?? 'Random'
  const activeVisionLabel = lensOn
    ? (VISION_MODES.find(v => v.mode === visionMode)?.short ?? 'Normal')
    : 'Normal'

  return (
    <>
      <div
        className="absolute z-20 left-3 right-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
        style={{ bottom: 12 }}
      >
        <div className="flex items-center justify-between" style={FLOATING_BAR_STYLE}>
          {/* LEFT — Dropdown pills */}
          <div className="flex items-center gap-2">
            {/* Harmony pill */}
            <button
              ref={harmonyBtnRef}
              onClick={toggleHarmony}
              className="flex items-center gap-1.5 transition-all duration-150 hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.98]"
              style={{ height: 36, padding: '0 12px', borderRadius: 12, border: '0.5px solid hsl(var(--border))' }}
              aria-label="Harmony mode"
              aria-haspopup="listbox"
              aria-expanded={harmonyOpen}
            >
              <span className="text-[13px] text-muted-foreground">Harmony:</span>
              <span className="text-[13px] font-medium text-foreground">{activeHarmonyLabel}</span>
              <ChevronDown size={14} className="text-muted-foreground" style={{ transform: harmonyOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }} />
            </button>

            {/* Vision pill */}
            <button
              ref={visionBtnRef}
              onClick={toggleVision}
              className="flex items-center gap-1.5 transition-all duration-150 hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.98]"
              style={{ height: 36, padding: '0 12px', borderRadius: 12, border: '0.5px solid hsl(var(--border))' }}
              aria-label="Vision simulation"
              aria-haspopup="listbox"
              aria-expanded={visionOpen}
            >
              <span className="text-[13px] text-muted-foreground">Vision:</span>
              <span className="text-[13px] font-medium" style={{ color: lensOn && visionMode !== 'normal' ? BRAND_VIOLET : 'hsl(var(--foreground))' }}>{activeVisionLabel}</span>
              <ChevronDown size={14} className="text-muted-foreground" style={{ transform: visionOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }} />
            </button>
          </div>

          {/* RIGHT — Controls */}
          <div className="flex items-center" style={{ gap: 16 }}>
            {/* Undo / Redo */}
            <div className="flex items-center gap-1">
              <IconButton
                icon={<Undo2 size={18} />}
                onClick={onUndo}
                label="Undo"
                size={32}
                className="rounded-button bg-transparent"
              />
              <IconButton
                icon={<Redo2 size={18} />}
                onClick={onRedo}
                label="Redo"
                size={32}
                className="rounded-button bg-transparent"
              />
            </div>

            {/* Count selector */}
            <div className="flex items-center">
              <button
                onClick={onCountDown}
                className="flex items-center justify-center transition-all duration-150 hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.98]"
                style={{ width: 28, height: 28, borderRadius: 8, opacity: count <= 3 ? 0.3 : 1 }}
                disabled={count <= 3}
                aria-label="Remove color"
              >
                <Minus size={14} className="text-muted-foreground" />
              </button>
              <span className="text-[13px] font-medium text-foreground tabular-nums" style={{ minWidth: 18, textAlign: 'center' }}>{count}</span>
              <button
                onClick={onCountUp}
                className={`relative flex items-center justify-center transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.98] ${isAtProMax ? 'cursor-not-allowed' : 'cursor-pointer'} ${!isColorGated ? 'hover:bg-surface' : ''}`}
                style={{ width: 28, height: 28, borderRadius: 8, opacity: !isColorGated ? 1 : isAtFreeCap ? 0.5 : 0.3 }}
                disabled={isAtProMax}
                aria-label={isAtFreeCap ? 'Upgrade to Pro for more colors' : isAtProMax ? 'Maximum colors reached' : 'Add color'}
              >
                <Plus size={14} className="text-muted-foreground" />
                {isAtFreeCap && (
                  <span className="absolute flex items-center justify-center" style={{ bottom: -6, right: -8 }}>
                    <Badge variant="pro" className="text-[8px] px-1 py-0 leading-tight">PRO</Badge>
                  </span>
                )}
              </button>
            </div>

            {/* Get code — secondary CTA */}
            <DarkTooltip label="CSS · Tailwind · SVG" position="top">
              <button
                onClick={onGetCode}
                data-tour-id="get-code"
                className="flex items-center gap-1.5 transition-all duration-150 border border-border hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
                style={{ height: 36, padding: '0 14px', borderRadius: 8 }}
                aria-label="Get code"
              >
                <Code size={14} className="text-foreground" />
                <span className="text-[13px] font-semibold text-foreground">Get code</span>
              </button>
            </DarkTooltip>

            {/* Generate — purple CTA */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              data-tour-id="generate"
              className="flex items-center gap-1.5 transition-all duration-150 bg-primary hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:opacity-80 disabled:pointer-events-none"
              style={{ height: 36, padding: '0 14px', borderRadius: 8 }}
              aria-label="Generate new palette"
            >
              {generating
                ? <Loader2 size={14} className="text-primary-foreground animate-spin" />
                : <Sparkles size={14} className="text-primary-foreground" />}
              <span className="text-[13px] font-semibold text-primary-foreground">{generating ? 'Generating...' : 'Generate'}</span>
              {!generating && <kbd className="inline-flex items-center justify-center text-[11px] font-mono text-primary-foreground/60" style={{ padding: '2px 6px', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' }}>space</kbd>}
            </button>
          </div>
        </div>
      </div>

      {/* Harmony dropdown (portal, opens upward) — rich 2-line items */}
      {harmonyOpen && createPortal(
        <div
          ref={harmonyDropRef}
          role="listbox"
          aria-label="Harmony modes"
          className="fixed z-[200] bg-card overflow-hidden"
          style={{
            bottom: harmonyPos.bottom,
            left: harmonyPos.left,
            minWidth: 280,
            borderRadius: 12,
            border: '1px solid hsl(var(--border-light))',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          }}
        >
          <DropdownSectionHeader title="Harmony Mode" subtitle="Choose how colors relate to each other on the wheel" />
          <div style={{ padding: 8 }}>
            {HARMONIES.map(h => {
              const isActive = harmonyMode === h.mode
              const Icon = h.icon
              return (
                <button
                  key={h.mode}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => selectHarmony(h.mode)}
                  className="w-full text-left transition-colors duration-150 hover:bg-surface"
                  style={{
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderRadius: 8,
                    background: isActive ? 'hsla(263, 100%, 64%, 0.08)' : undefined,
                  }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: isActive ? 'hsla(263, 100%, 64%, 0.12)' : h.iconBg,
                    }}
                  >
                    <Icon size={16} className={isActive ? 'text-primary' : 'text-foreground'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-foreground whitespace-nowrap">{h.label}</div>
                    <div className="text-[13px] text-muted-foreground whitespace-nowrap">{h.desc}</div>
                  </div>
                  {isActive && <Check size={14} className="text-primary flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      )}

      {/* Vision dropdown (portal, opens upward) — rich 2-line items */}
      {visionOpen && createPortal(
        <div
          ref={visionDropRef}
          role="listbox"
          aria-label="Vision simulation modes"
          className="fixed z-[200] bg-card overflow-hidden"
          style={{
            bottom: visionPos.bottom,
            left: visionPos.left,
            minWidth: 280,
            borderRadius: 12,
            border: '1px solid hsl(var(--border-light))',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          }}
        >
          <DropdownSectionHeader title="Accessibility Lens" subtitle="See how people with color vision differences experience your palette" />
          <div style={{ padding: 8 }}>
            {VISION_MODES.map(v => {
              const isActive = lensOn ? visionMode === v.mode : v.mode === 'normal'
              const needsPro = !isLensModeFree(v.mode) && !isPro
              return (
                <button
                  key={v.mode}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => selectVision(v)}
                  className="w-full text-left transition-colors duration-150 hover:bg-surface"
                  style={{
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderRadius: 8,
                    background: isActive ? 'hsla(263, 100%, 64%, 0.08)' : undefined,
                    opacity: needsPro ? 0.5 : 1,
                  }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: isActive
                        ? 'hsla(263, 100%, 64%, 0.12)'
                        : 'hsl(var(--muted-foreground) / 0.08)',
                    }}
                  >
                    <Eye size={16} className={isActive ? 'text-primary' : 'text-foreground'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-foreground whitespace-nowrap">{v.label}</div>
                    <div className="text-[13px] text-muted-foreground whitespace-nowrap">{v.desc}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {needsPro && <Badge variant="pro">PRO</Badge>}
                    {isActive && <Check size={14} className="text-primary" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

// ─── Floating Bottom Bar for Preview View ───
function PreviewBottomBar({
  swatches, onLock,
  onUndo, onRedo,
  count, isAtFreeCap, isAtProMax, isColorGated,
  onCountDown, onCountUp, onGenerate, onGetCode,
}: {
  swatches: { id: string; hex: string; locked: boolean }[]
  onLock: (id: string) => void
  onUndo: () => void
  onRedo: () => void
  count: number
  isAtFreeCap: boolean
  isAtProMax: boolean
  isColorGated: boolean
  onCountDown: () => void
  onCountUp: () => void
  onGenerate: () => void
  onGetCode: () => void
}) {
  return (
    <div
      className="absolute z-20 left-3 right-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
      style={{ bottom: 12 }}
    >
      <div className="flex items-center justify-between" style={FLOATING_BAR_STYLE}>
        {/* LEFT — Color swatches */}
        <div className="flex items-center" style={{ gap: 6 }}>
          {swatches.map(s => (
            <button
              key={s.id}
              onClick={() => onLock(s.id)}
              className="relative flex items-center justify-center transition-all active:scale-[0.98] hover:scale-105"
              style={{
                width: 32, height: 32, padding: 0, borderRadius: 8,
                backgroundColor: s.hex, border: '1px solid rgba(0,0,0,0.08)',
              }}
              aria-label={`${s.hex} ${s.locked ? '(locked)' : '(unlocked)'}`}
            >
              {s.locked && (
                <Lock size={10} style={{ color: readableOn(s.hex) }} />
              )}
            </button>
          ))}
        </div>

        {/* RIGHT — Controls */}
        <div className="flex items-center" style={{ gap: 16 }}>
          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={onUndo}
              className="flex items-center justify-center transition-all duration-150 hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.98]"
              style={{ width: 32, height: 32, borderRadius: 8 }}
              aria-label="Undo"
            >
              <Undo2 size={18} className="text-muted-foreground" />
            </button>
            <button
              onClick={onRedo}
              className="flex items-center justify-center transition-all duration-150 hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.98]"
              style={{ width: 32, height: 32, borderRadius: 8 }}
              aria-label="Redo"
            >
              <Redo2 size={18} className="text-muted-foreground" />
            </button>
          </div>

          {/* Count selector */}
          <div className="flex items-center">
            <button
              onClick={onCountDown}
              className="flex items-center justify-center transition-all duration-150 hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.98]"
              style={{ width: 28, height: 28, borderRadius: 8, opacity: count <= 3 ? 0.3 : 1 }}
              disabled={count <= 3}
              aria-label="Remove color"
            >
              <Minus size={14} className="text-muted-foreground" />
            </button>
            <span className="text-[13px] font-medium text-foreground tabular-nums" style={{ minWidth: 18, textAlign: 'center' }}>{count}</span>
            <button
              onClick={onCountUp}
              className={`relative flex items-center justify-center transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:scale-[0.98] ${isAtProMax ? 'cursor-not-allowed' : 'cursor-pointer'} ${!isColorGated ? 'hover:bg-surface' : ''}`}
              style={{ width: 28, height: 28, borderRadius: 8, opacity: !isColorGated ? 1 : isAtFreeCap ? 0.5 : 0.3 }}
              disabled={isAtProMax}
              aria-label={isAtFreeCap ? 'Upgrade to Pro for more colors' : isAtProMax ? 'Maximum colors reached' : 'Add color'}
            >
              <Plus size={14} className="text-muted-foreground" />
              {isAtFreeCap && (
                <span className="absolute flex items-center justify-center" style={{ bottom: -6, right: -8 }}>
                  <Badge variant="pro" className="text-[8px] px-1 py-0 leading-tight">PRO</Badge>
                </span>
              )}
            </button>
          </div>

          {/* Get code — outline button */}
          <button
            onClick={onGetCode}
            className="flex items-center gap-1.5 transition-all duration-150 border border-border hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
            style={{ height: 36, padding: '0 14px', borderRadius: 8 }}
            aria-label="Get code"
          >
            <Code size={14} className="text-foreground" />
            <span className="text-[13px] font-semibold text-foreground">Get code</span>
          </button>

          {/* Generate — purple CTA */}
          <button
            onClick={onGenerate}
            className="flex items-center gap-1.5 transition-all duration-150 bg-primary hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
            style={{ height: 36, padding: '0 14px', borderRadius: 8 }}
            aria-label="Generate new palette"
          >
            <Sparkles size={14} className="text-primary-foreground" />
            <span className="text-[13px] font-semibold text-primary-foreground">Generate</span>
            <kbd className="inline-flex items-center justify-center text-[11px] font-mono text-primary-foreground/60" style={{ padding: '2px 6px', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' }}>space</kbd>
          </button>
        </div>
      </div>
    </div>
  )
}
