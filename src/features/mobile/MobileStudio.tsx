import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, Copy, Check, Lock, Unlock, Sparkles, ImagePlus, Heart, Link2, Share2, Download, Grid3X3, Info, Shuffle, Palette, Circle, Contrast, Triangle, Eye, ChevronRight, ChevronLeft, Code } from 'lucide-react'
import { usePaletteStore } from '@/store/paletteStore'
import { usePro } from '@/hooks/usePro'
import { useAuth } from '@/hooks/useAuth'
import {
  readableOn, getColorName, getContrastBadge, getColorInfo, makeSwatch, buildShareUrl,
  SEMANTIC_ROLES, parseHex,
} from '@/lib/colorEngine'
import type { HarmonyMode } from '@/lib/colorEngine'
import type { VisionMode } from '@/components/palette/VisionSimulator'
import { VisionFilterDefs } from '@/components/palette/VisionSimulator'
import { showToast } from '@/utils/toast'
import { analytics } from '@/lib/posthog'
import { cn } from '@/lib/utils'
import { PRO_GATES, isLensModeFree } from '@/lib/proFeatures'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MobileBottomSheet } from './MobileBottomSheet'
import AiPrompt, { AI_MAX_FREE, getAiUsageToday } from '@/components/palette/AiPrompt'
import ExportPanel from '@/components/palette/ExportPanel'
import { ProUpgradeModal } from '@/features/pro/ProUpgradeModal'
import SignInModal from '@/components/ui/SignInModal'
import SaveNameModal from '@/components/ui/SaveNameModal'
import PaymentSuccessModal from '@/components/ui/PaymentSuccessModal'
import { AiCoachMark, incrementGenerateCount } from '@/components/AiCoachMark'
import { HexColorPicker } from 'react-colorful'
import type { MobileTab } from './MobileShell'

// ─── Constants ───
const HARMONY_OPTIONS: { mode: HarmonyMode; label: string; desc: string; Icon: typeof Shuffle }[] = [
  { mode: 'random', label: 'Random', desc: 'No rules, pure exploration', Icon: Shuffle },
  { mode: 'analogous', label: 'Analogous', desc: 'Colors next to each other on the wheel', Icon: Palette },
  { mode: 'monochromatic', label: 'Monochromatic', desc: 'Shades of a single hue', Icon: Circle },
  { mode: 'complementary', label: 'Complementary', desc: 'Opposite sides of the wheel', Icon: Contrast },
  { mode: 'triadic', label: 'Triadic', desc: 'Three evenly spaced colors', Icon: Triangle },
]

const VISION_MODES: { mode: VisionMode; label: string; desc: string }[] = [
  { mode: 'normal', label: 'Normal Vision', desc: 'Full color spectrum' },
  { mode: 'protanopia', label: 'Protanopia', desc: 'Red-green · reds appear dark or missing' },
  { mode: 'deuteranopia', label: 'Deuteranopia', desc: 'Red-green · most common (~5% of men)' },
  { mode: 'tritanopia', label: 'Tritanopia', desc: 'Blue-yellow confusion' },
  { mode: 'achromatopsia', label: 'Achromatopsia', desc: 'Grayscale only · no color perception' },
]

interface MobileStudioProps {
  onNavigate: (tab: MobileTab) => void
}

export function MobileStudio(_props: MobileStudioProps) {
  const { isPro, showPaymentModal, setShowPaymentModal } = usePro()
  const { user, signInWithGoogle } = useAuth()

  const {
    swatches, harmonyMode, count, generate,
    lockSwatch, editSwatch, reorderSwatches, setHarmonyMode, setCount, setSwatches,
  } = usePaletteStore()

  // ─── Sheet state (single-sheet rule) ───
  const [activeSheet, setActiveSheet] = useState<
    'harmony' | 'lens' | 'tools' | 'color-detail' | 'ai' | 'export' | 'extract' | 'save' | 'pro' | 'sign-in' | null
  >(null)
  const [activeColorIdx, setActiveColorIdx] = useState(0)
  const [visionMode, setVisionMode] = useState<VisionMode>('normal')
  const [copiedHex, setCopiedHex] = useState<string | null>(null)
  const [saveNameOpen, setSaveNameOpen] = useState(false)
  const [coachVisible, setCoachVisible] = useState(false)
  const [editingHex, setEditingHex] = useState(false)
  const [hexDraft, setHexDraft] = useState('')
  const [pickerColor, setPickerColor] = useState<string | null>(null)
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const visionFilter = visionMode !== 'normal' ? `url(#vision-${visionMode})` : undefined

  // Sync local picker color when active swatch changes
  const activeSwatch = swatches[activeColorIdx]
  useEffect(() => {
    if (activeSwatch) setPickerColor(activeSwatch.hex)
  }, [activeSwatch?.id, activeSwatch?.hex]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup debounce timer
  useEffect(() => () => { if (commitTimer.current) clearTimeout(commitTimer.current) }, [])

  const closeSheet = useCallback(() => setActiveSheet(null), [])

  const openProModal = useCallback((feature?: string, source?: string) => {
    if (feature) analytics.track('pro_gate_hit', { feature, source: source ?? 'mobile' })
    analytics.track('pro_modal_opened')
    setActiveSheet('pro')
  }, [])

  // Auto-close Pro modal when user becomes Pro
  useEffect(() => {
    if (isPro && activeSheet === 'pro') closeSheet()
  }, [isPro, activeSheet, closeSheet])

  const triggerGenerate = useCallback(() => {
    generate()
    analytics.track('palette_generated', { method: 'button', style: harmonyMode, color_count: count })
    if (!localStorage.getItem('paletta_first_generate_at')) {
      localStorage.setItem('paletta_first_generate_at', String(Date.now()))
    }
    if (!isPro && incrementGenerateCount()) {
      setCoachVisible(true)
    }
  }, [generate, harmonyMode, count, isPro])

  const handleCopyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex.toUpperCase())
      setCopiedHex(hex)
      showToast(`Copied ${hex.toUpperCase()}`, hex)
      setTimeout(() => setCopiedHex(null), 1200)
    } catch { /* silent */ }
  }

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
      showToast('Link copied!')
      analytics.track('palette_shared', { method: 'clipboard' })
    } catch { /* silent */ }
  }

  const defaultPaletteName = useMemo(() => {
    const names = swatches.map(s => getColorName(s.hex)).filter(Boolean)
    return names.slice(0, 3).join(' · ') || 'Untitled'
  }, [swatches])

  const [savedCount, setSavedCount] = useState<number | null>(null)

  // Fetch saved palette count for free-tier gate
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { count } = await supabase
          .from('saved_palettes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        setSavedCount(count ?? 0)
      } catch { /* silent */ }
    })()
  }, [user])

  const handleSave = () => {
    if (!user) { setActiveSheet('sign-in'); return }
    if (!isPro && (savedCount ?? 0) >= PRO_GATES.MAX_FREE_SAVES) {
      openProModal('save_limit', 'mobile_studio')
      return
    }
    setSaveNameOpen(true)
  }

  const handleSaveConfirm = async (name: string) => {
    setSaveNameOpen(false)
    if (!user) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const colors = swatches.map(s => s.hex).filter(Boolean)
      if (colors.length === 0) { showToast('Nothing to save'); return }
      const { data: existing } = await supabase
        .from('saved_palettes').select('id, colors').eq('user_id', user.id)
      const isDuplicate = existing?.some(
        (p: { colors: string[] }) => JSON.stringify(p.colors) === JSON.stringify(colors)
      )
      if (isDuplicate) { showToast('Already saved'); return }
      const { error } = await supabase.from('saved_palettes').insert({ user_id: user.id, name, colors })
      if (error) throw error
      showToast('Saved ✓')
      analytics.track('palette_saved', { palette_count: (existing?.length ?? 0) + 1, is_pro: isPro })
    } catch {
      showToast('Save failed')
    }
  }

  const handleAiPalette = (hexes: string[]) => {
    const max = isPro ? PRO_GATES.MAX_PRO_COLORS : PRO_GATES.MAX_FREE_COLORS
    setSwatches(hexes.slice(0, max).map(h => makeSwatch(h)))
    analytics.track('palette_generated', { method: 'ai', style: harmonyMode, color_count: hexes.length })
  }

  const handleVisionSelect = (mode: VisionMode) => {
    setVisionMode(mode)
    setActiveSheet(null)
  }

  // ─── Render ───
  return (
    <div className="flex flex-col h-full">
      {/* Minimal brand header */}
      <div className="flex items-center justify-center" style={{ height: 48 }}>
        <img
          src="/logo.svg"
          alt="Paletta"
          className="shrink-0"
          style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Swatch canvas */}
        <div
          className="mx-3 rounded-bento overflow-hidden bg-card shadow-lg flex flex-1"
          style={{ filter: visionFilter }}
        >
          {swatches.map((swatch, i) => {
            const textColor = readableOn(swatch.hex)
            const badge = getContrastBadge(swatch.hex)
            return (
              <button
                key={swatch.id}
                className="flex-1 min-w-0 flex flex-col items-center justify-end relative overflow-hidden"
                style={{ backgroundColor: swatch.hex, paddingBottom: 12, minHeight: 44 }}
                onClick={() => { setActiveColorIdx(i); setActiveSheet('color-detail') }}
                aria-label={`${getColorName(swatch.hex)} ${swatch.hex}. Tap for details.`}
              >
                {swatch.locked && (
                  <Lock size={12} style={{ color: textColor, opacity: 0.5, position: 'absolute', top: 10 }} aria-label="Locked" />
                )}
                {/* Semantic role name — primary label */}
                <span
                  className="text-[11px] font-semibold mb-0.5 truncate max-w-[calc(100%-8px)]"
                  style={{ color: textColor }}
                >
                  {SEMANTIC_ROLES[i]?.role ?? `Color ${i + 1}`}
                </span>
                {/* Hex code — secondary label */}
                <span
                  className="text-[9px] font-mono font-normal mb-1 truncate max-w-[calc(100%-8px)]"
                  style={{ color: textColor, opacity: 0.6 }}
                >
                  {swatch.hex.toUpperCase().slice(0, 7)}
                </span>
                {/* WCAG badge */}
                <div className="bg-card shadow-sm rounded-full px-1.5 py-0.5 flex items-center gap-0.5 border border-black/5 max-w-[calc(100%-8px)]">
                  <span className={cn('font-bold text-foreground leading-none truncate', swatches.length > 6 ? 'text-[10px]' : 'text-[10px]')}>{badge.level}</span>
                  {swatches.length <= 6 && (
                    <span className="text-[10px] font-medium text-muted-foreground leading-none">{badge.ratio.toFixed(1)}</span>
                  )}
                  {badge.pass && <span className="text-[10px] text-success font-bold leading-none">✓</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Two-row action bar */}
      <div
        className="flex flex-col bg-card shrink-0"
        style={{
          margin: '6px 12px 0',
          borderRadius: 16,
          border: '0.5px solid hsl(var(--border))',
        }}
      >
        {/* Row 1: Tools + count selector */}
        <div
          className="flex items-center justify-center gap-2"
          style={{ padding: '8px 12px', borderBottom: '0.5px solid hsl(var(--border))' }}
        >
          {/* Tools pill */}
          <div className="relative">
            <button
              onClick={() => setActiveSheet('tools')}
              className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground border border-border rounded-button transition-all duration-150 active:scale-[0.98]"
              style={{ height: 32, paddingLeft: 12, paddingRight: 10 }}
              aria-label="Open tools menu"
            >
              Tools
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <AiCoachMark
              visible={coachVisible}
              onDismiss={() => setCoachVisible(false)}
              onTry={() => { setCoachVisible(false); setActiveSheet('ai') }}
              position="above"
            />
          </div>

          {/* Count controls */}
          <button
            onClick={() => { if (count > 3) setCount(count - 1) }}
            disabled={count <= 3}
            className="flex items-center justify-center border border-border rounded-button disabled:opacity-30 transition-all active:scale-[0.98]"
            style={{ width: 28, height: 28 }}
            aria-label="Remove color"
          >
            <Minus size={14} className="text-foreground" />
          </button>
          <span className="text-[14px] font-extrabold text-foreground tabular-nums" style={{ minWidth: 18, textAlign: 'center' }}>{count}</span>
          <button
            onClick={() => {
              if (!isPro && count >= PRO_GATES.MAX_FREE_COLORS) { openProModal('color_count', 'mobile_bar'); return }
              if (count < (isPro ? PRO_GATES.MAX_PRO_COLORS : PRO_GATES.MAX_FREE_COLORS)) setCount(count + 1)
            }}
            disabled={isPro ? count >= PRO_GATES.MAX_PRO_COLORS : false}
            className="relative flex items-center justify-center border border-border rounded-button disabled:opacity-30 transition-all active:scale-[0.98]"
            style={{ width: 28, height: 28 }}
            aria-label={!isPro && count >= PRO_GATES.MAX_FREE_COLORS ? 'Upgrade to Pro for more colors' : 'Add color'}
          >
            <Plus size={14} className="text-foreground" />
            {!isPro && count >= PRO_GATES.MAX_FREE_COLORS && (
              <span className="absolute -bottom-1.5 -right-2">
                <Badge variant="pro" className="text-[8px] px-1 py-0 leading-tight">PRO</Badge>
              </span>
            )}
          </button>
        </div>

        {/* Row 2: Get code + Generate — equal width */}
        <div className="flex items-center gap-2" style={{ padding: '8px 12px' }}>
          <button
            onClick={() => setActiveSheet('export')}
            data-tour-id="get-code"
            className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-button transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            style={{ height: 44, borderRadius: 8 }}
            aria-label="Get code"
          >
            <Code size={16} className="text-foreground" />
            <span className="text-[14px] font-semibold text-foreground">Get code</span>
          </button>
          <Button
            onClick={triggerGenerate}
            data-tour-id="generate"
            size="lg"
            className="flex-1 text-[14px] font-bold gap-1.5"
            style={{ height: 44, borderRadius: 8, boxShadow: '0 4px 20px rgba(108,71,255,0.3)' }}
            aria-label="Generate new palette"
          >
            <Sparkles size={16} className="text-primary-foreground" />
            Generate
          </Button>
        </div>
      </div>

      {/* ─── Bottom Sheets ─── */}

      {/* Harmony sheet */}
      <MobileBottomSheet
        open={activeSheet === 'harmony'}
        onClose={closeSheet}
        title="Color Harmony"
        subtitle="How colors relate to each other"
      >
        <div className="flex flex-col gap-1 pb-4">
          {HARMONY_OPTIONS.map(({ mode, label, desc, Icon }) => {
            const isActive = harmonyMode === mode
            return (
              <button
                key={mode}
                onClick={() => { setHarmonyMode(mode); closeSheet() }}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-xl text-left transition-all',
                  isActive ? 'bg-primary/5 border border-primary/20' : 'hover:bg-surface'
                )}
                aria-label={`${label}: ${desc}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    isActive ? 'bg-primary/10' : 'bg-surface'
                  )}>
                    <Icon size={20} className={cn(
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-foreground">{label}</div>
                    <div className="text-[13px] text-muted-foreground">{desc}</div>
                  </div>
                </div>
                {isActive && (
                  <Check size={20} className="text-primary shrink-0" strokeWidth={2} aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      </MobileBottomSheet>

      {/* Lens sheet */}
      <MobileBottomSheet
        open={activeSheet === 'lens'}
        onClose={closeSheet}
        title="Accessibility Lens"
        subtitle="See how people with color vision differences experience your palette"
      >
        <div className="flex flex-col gap-1 pb-4">
          {VISION_MODES.map(({ mode, label, desc }) => {
            const isActive = visionMode === mode
            const isLocked = !isLensModeFree(mode) && !isPro
            return (
              <button
                key={mode}
                onClick={() => {
                  if (isLocked) { closeSheet(); openProModal('vision_sim', 'mobile_lens_sheet'); return }
                  handleVisionSelect(mode)
                }}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-xl text-left transition-all',
                  isActive ? 'bg-primary/5 border border-primary/20' : 'hover:bg-surface'
                )}
                aria-label={`${label}: ${desc}${isLocked ? ' (Pro)' : ''}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    isActive ? 'bg-primary/10' : 'bg-surface'
                  )}>
                    <Eye size={20} className={cn(
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-foreground">{label}</div>
                    <div className="text-[13px] text-muted-foreground">{desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isLocked && <Badge variant="pro">PRO</Badge>}
                  {isActive && <Check size={20} className="text-primary" strokeWidth={2} aria-hidden="true" />}
                </div>
              </button>
            )
          })}
        </div>
      </MobileBottomSheet>

      {/* Tools sheet */}
      <MobileBottomSheet
        open={activeSheet === 'tools'}
        onClose={closeSheet}
        title="Tools"
        subtitle="Settings and actions for your palette"
        full
      >
        <div className="flex flex-col gap-0.5 pb-4">
          {/* ── Settings section ── */}

          {/* Harmony Mode */}
          <button
            onClick={() => setActiveSheet('harmony')}
            className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all hover:bg-surface"
            aria-label={`Harmony Mode: ${HARMONY_OPTIONS.find(h => h.mode === harmonyMode)?.label}. Tap to change.`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface">
                <Shuffle size={18} className="text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">Harmony Mode</div>
                <div className="text-[13px] text-muted-foreground">{HARMONY_OPTIONS.find(h => h.mode === harmonyMode)?.label}</div>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </button>

          {/* Accessibility Lens */}
          <button
            onClick={() => setActiveSheet('lens')}
            className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all hover:bg-surface"
            aria-label={`Accessibility Lens: ${VISION_MODES.find(v => v.mode === visionMode)?.label}. Tap to change.`}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center',
                visionMode !== 'normal' ? 'bg-primary/10' : 'bg-surface'
              )}>
                <Eye size={18} className={cn(
                  visionMode !== 'normal' ? 'text-primary' : 'text-muted-foreground'
                )} strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">Accessibility Lens</div>
                <div className={cn('text-[13px]', visionMode !== 'normal' ? 'text-primary font-medium' : 'text-muted-foreground')}>
                  {visionMode === 'normal' ? 'Normal' : VISION_MODES.find(v => v.mode === visionMode)?.label}
                </div>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </button>

          {/* ── Separator ── */}
          <div className="border-t border-border my-1.5 mx-3" />

          {/* ── Actions section ── */}

          {/* AI Palette */}
          <button
            onClick={() => { closeSheet(); setActiveSheet('ai') }}
            className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all hover:bg-surface"
            aria-label="AI Palette: Generate colors from a description"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface">
                <Sparkles size={18} className="text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">AI Palette</div>
                <div className="text-[13px] text-muted-foreground">Generate from a description</div>
              </div>
            </div>
            {!isPro && (
              <span className="text-[11px] font-bold bg-primary text-primary-foreground rounded-full px-2 py-0.5 shrink-0">
                {Math.max(0, AI_MAX_FREE - getAiUsageToday())}
              </span>
            )}
          </button>

          {/* Extract from Image */}
          <button
            onClick={() => {
              closeSheet()
              if (!isPro) { openProModal('image_extraction', 'mobile_tools'); return }
              setActiveSheet('extract')
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all hover:bg-surface"
            aria-label="Extract from Image: Pull colors from a photo"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface">
                <ImagePlus size={18} className="text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">Extract from Image</div>
                <div className="text-[13px] text-muted-foreground">Pull colors from a photo</div>
              </div>
            </div>
            {!isPro && (
              <Badge variant="pro" className="shrink-0">PRO</Badge>
            )}
          </button>

          {/* Save */}
          <button
            onClick={() => { closeSheet(); handleSave() }}
            className="w-full flex items-center p-3 rounded-xl text-left transition-all hover:bg-surface"
            aria-label="Save palette to your Library"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface">
                <Heart size={18} className="text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">Save</div>
                <div className="text-[13px] text-muted-foreground">Save palette to your Library</div>
              </div>
            </div>
          </button>

          {/* Share */}
          <button
            onClick={() => { closeSheet(); handleShare() }}
            className="w-full flex items-center p-3 rounded-xl text-left transition-all hover:bg-surface"
            aria-label={canNativeShare ? 'Share palette' : 'Copy shareable link'}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface">
                {canNativeShare
                  ? <Share2 size={18} className="text-muted-foreground" strokeWidth={1.5} />
                  : <Link2 size={18} className="text-muted-foreground" strokeWidth={1.5} />
                }
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">Share</div>
                <div className="text-[13px] text-muted-foreground">Copy shareable link</div>
              </div>
            </div>
          </button>

          {/* Get code */}
          <button
            onClick={() => { closeSheet(); setActiveSheet('export') }}
            className="w-full flex items-center p-3 rounded-xl text-left transition-all hover:bg-surface"
            aria-label="Get code as CSS, Tailwind, or SVG"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface">
                <Download size={18} className="text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-foreground">Get code</div>
                <div className="text-[13px] text-muted-foreground">CSS, Tailwind, or SVG</div>
              </div>
            </div>
          </button>
        </div>
      </MobileBottomSheet>

      {/* Color Detail sheet */}
      <MobileBottomSheet
        open={activeSheet === 'color-detail'}
        onClose={() => { closeSheet(); setEditingHex(false); setPickerColor(null) }}
        title="Color Detail"
        full
      >
        {activeSwatch && (() => {
          const hex = pickerColor ?? activeSwatch.hex
          const textColor = readableOn(hex)
          const badge = getContrastBadge(hex)
          const name = getColorName(hex)
          const isFirst = activeColorIdx === 0
          const isLast = activeColorIdx === swatches.length - 1

          const confirmHexEdit = () => {
            const parsed = parseHex(hexDraft)
            if (parsed) editSwatch(activeSwatch.id, parsed)
            setEditingHex(false)
          }

          const handleMove = (direction: -1 | 1) => {
            const newIdx = activeColorIdx + direction
            if (newIdx < 0 || newIdx >= swatches.length) return
            reorderSwatches(activeColorIdx, newIdx)
            setActiveColorIdx(newIdx)
          }

          return (
            <div className="flex flex-col gap-4 pb-4">
              {/* Contrast specimen */}
              <div
                className="flex flex-col items-center justify-center rounded-xl relative"
                style={{ height: 100, backgroundColor: hex }}
              >
                <span style={{ fontSize: 36, fontWeight: 800, color: textColor, lineHeight: 1 }}>Aa</span>
                <span className="text-[12px] font-medium mt-1" style={{ color: textColor, opacity: 0.8 }}>
                  {badge.ratio.toFixed(1)}:1 · {badge.level}
                </span>
              </div>

              {/* Reorder arrows */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => handleMove(-1)}
                  disabled={isFirst}
                  className="flex items-center justify-center transition-all active:scale-[0.98]"
                  style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'hsl(var(--surface))', opacity: isFirst ? 0.3 : 1 }}
                  aria-label="Move left"
                >
                  <ChevronLeft size={20} className="text-foreground" />
                </button>
                <span className="text-[13px] font-medium text-muted-foreground">
                  Position {activeColorIdx + 1} of {swatches.length}
                </span>
                <button
                  onClick={() => handleMove(1)}
                  disabled={isLast}
                  className="flex items-center justify-center transition-all active:scale-[0.98]"
                  style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: 'hsl(var(--surface))', opacity: isLast ? 0.3 : 1 }}
                  aria-label="Move right"
                >
                  <ChevronRight size={20} className="text-foreground" />
                </button>
              </div>

              {/* Info — role name leads, hex follows */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[16px] font-semibold text-foreground">
                    {SEMANTIC_ROLES[activeColorIdx]?.role ?? `Color ${activeColorIdx + 1}`}
                    <span className="text-muted-foreground font-normal"> / </span>
                    {name}
                  </div>
                  {editingHex ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[14px] font-mono text-muted-foreground">#</span>
                      <input
                        autoFocus
                        value={hexDraft}
                        onChange={e => setHexDraft(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase())}
                        onBlur={confirmHexEdit}
                        onKeyDown={e => {
                          if (e.key === 'Enter') confirmHexEdit()
                          if (e.key === 'Escape') setEditingHex(false)
                        }}
                        maxLength={6}
                        className="bg-transparent text-[14px] font-mono text-foreground outline-none border-b-2 border-primary w-20"
                        aria-label="Edit hex value"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => { setHexDraft(hex.replace('#', '').toUpperCase()); setEditingHex(true) }}
                      className="text-[14px] font-mono text-muted-foreground mt-0.5 transition-all active:opacity-70"
                      aria-label={`Edit hex value ${hex}`}
                    >
                      {hex.toUpperCase()}
                    </button>
                  )}
                </div>
                <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${badge.pass ? 'bg-success-bg text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {badge.level} {badge.pass ? '✓' : '✗'}
                </span>
              </div>

              {/* Action grid — 2×2 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopyHex(hex)}
                  className="flex items-center gap-2.5 px-3 rounded-button bg-surface transition-all duration-150 ease-[cubic-bezier(0,0,0.2,1)] hover:text-primary hover:scale-[1.08] active:scale-[0.96] motion-reduce:transform-none"
                  style={{ minHeight: 44 }}
                  aria-label={`Copy ${hex}`}
                >
                  {copiedHex === hex ? <Check size={16} className="text-success" /> : <Copy size={16} className="text-muted-foreground" />}
                  <span className="text-[13px] font-medium text-foreground">{copiedHex === hex ? 'Copied' : 'Copy hex'}</span>
                </button>
                <button
                  onClick={() => lockSwatch(activeSwatch.id)}
                  className="flex items-center gap-2.5 px-3 rounded-button bg-surface transition-all duration-150 ease-[cubic-bezier(0,0,0.2,1)] hover:text-primary hover:scale-[1.08] active:scale-[0.96] motion-reduce:transform-none"
                  style={{ minHeight: 44 }}
                  aria-label={activeSwatch.locked ? 'Unlock color' : 'Lock color'}
                >
                  {activeSwatch.locked ? <Lock size={16} className="text-primary" /> : <Unlock size={16} className="text-muted-foreground" />}
                  <span className="text-[13px] font-medium text-foreground">{activeSwatch.locked ? 'Locked' : 'Lock color'}</span>
                </button>
                <button
                  onClick={() => {
                    const info = getColorInfo(hex)
                    showToast(`RGB: ${info.rgb} · HSL: ${info.hsl}`)
                  }}
                  className="flex items-center gap-2.5 px-3 rounded-button bg-surface transition-all duration-150 ease-[cubic-bezier(0,0,0.2,1)] hover:text-primary hover:scale-[1.08] active:scale-[0.96] motion-reduce:transform-none"
                  style={{ minHeight: 44 }}
                  aria-label="Color info"
                >
                  <Info size={16} className="text-muted-foreground" />
                  <span className="text-[13px] font-medium text-foreground">Info</span>
                </button>
                <button
                  onClick={() => {
                    if (isPro) {
                      closeSheet()
                      showToast('Shades coming soon')
                    } else {
                      closeSheet()
                      openProModal('shade_scale', 'mobile_detail')
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2.5 px-3 rounded-button transition-all duration-150 ease-[cubic-bezier(0,0,0.2,1)] hover:text-primary hover:scale-[1.08] active:scale-[0.96] motion-reduce:transform-none",
                    isPro ? "bg-surface" : "bg-surface/50"
                  )}
                  style={{ minHeight: 44 }}
                  aria-label={isPro ? "View shade scale" : "Shade scale (Pro feature)"}
                >
                  <Grid3X3 size={16} className={isPro ? "text-muted-foreground" : "text-muted/50"} />
                  <span className={cn("text-[13px] font-medium", isPro ? "text-foreground" : "text-muted-foreground/60")}>Shades</span>
                  {!isPro && <Badge variant="pro" className="ml-auto">PRO</Badge>}
                </button>
              </div>

              {/* Color picker — always visible, debounced store commit */}
              <div className="react-colorful-wrapper rounded-xl overflow-hidden">
                <HexColorPicker
                  color={pickerColor ?? hex}
                  onChange={(newHex) => {
                    setPickerColor(newHex)
                    if (commitTimer.current) clearTimeout(commitTimer.current)
                    commitTimer.current = setTimeout(() => {
                      editSwatch(activeSwatch.id, newHex)
                    }, 80)
                  }}
                />
              </div>
            </div>
          )
        })()}
      </MobileBottomSheet>

      {/* Extract placeholder sheet */}
      <MobileBottomSheet
        open={activeSheet === 'extract'}
        onClose={closeSheet}
        title="Image Extraction"
        subtitle="Extract a palette from any photo"
      >
        <div className="text-center py-8">
          <ImagePlus size={40} className="mx-auto text-muted-foreground mb-4" strokeWidth={1} />
          <p className="text-[15px] text-foreground font-semibold mb-1">Coming soon</p>
          <p className="text-[13px] text-muted-foreground">Image extraction is being optimized for mobile. Use desktop for now.</p>
        </div>
      </MobileBottomSheet>

      {/* AI dialog (reuse existing) */}
      <AiPrompt
        open={activeSheet === 'ai'}
        onClose={closeSheet}
        onPalette={handleAiPalette}
        onFallback={triggerGenerate}
        onProGate={() => { closeSheet(); openProModal('ai_palette', 'mobile') }}
        onUsageChange={() => {}}
        onError={msg => showToast(msg)}
        colorCount={count}
      />

      {/* Export dialog (reuse existing) */}
      <ExportPanel
        open={activeSheet === 'export'}
        hexes={swatches.map(s => s.hex)}
        onClose={closeSheet}
        onProGate={() => { closeSheet(); openProModal('export', 'mobile') }}
      />

      {/* Pro modal */}
      <ProUpgradeModal
        open={activeSheet === 'pro'}
        onClose={closeSheet}
        paletteColors={swatches.map(s => s.hex)}
      />

      {/* Sign in modal */}
      <SignInModal
        open={activeSheet === 'sign-in'}
        onClose={closeSheet}
        onGoogleSignIn={signInWithGoogle}
      />

      {/* Save name modal */}
      <SaveNameModal
        open={saveNameOpen}
        defaultName={defaultPaletteName}
        onConfirm={handleSaveConfirm}
        onClose={() => setSaveNameOpen(false)}
      />

      {/* Payment success */}
      <PaymentSuccessModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} />

      {/* Vision filter SVG defs */}
      <VisionFilterDefs />
    </div>
  )
}
