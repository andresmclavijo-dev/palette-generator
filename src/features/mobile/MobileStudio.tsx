import { useCallback, useEffect, useMemo, useState } from 'react'
import { Minus, Plus, Copy, Check, Lock, Unlock, Sparkles, ImagePlus, Heart, Link, Download, Grid3X3, Info } from 'lucide-react'
import { usePaletteStore } from '@/store/paletteStore'
import { usePro } from '@/hooks/usePro'
import { useAuth } from '@/hooks/useAuth'
import {
  readableOn, getColorName, getContrastBadge, makeSwatch,
} from '@/lib/colorEngine'
import type { HarmonyMode } from '@/lib/colorEngine'
import type { VisionMode } from '@/components/palette/VisionSimulator'
import { VisionFilterDefs } from '@/components/palette/VisionSimulator'
import { showToast } from '@/utils/toast'
import { analytics } from '@/lib/posthog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MobileBottomSheet } from './MobileBottomSheet'
import AiPrompt, { AI_MAX_FREE, getAiUsageToday } from '@/components/palette/AiPrompt'
import ExportPanel from '@/components/palette/ExportPanel'
import { ProUpgradeModal } from '@/features/pro/ProUpgradeModal'
import SignInModal from '@/components/ui/SignInModal'
import SaveNameModal from '@/components/ui/SaveNameModal'
import PaymentSuccessModal from '@/components/ui/PaymentSuccessModal'
import type { MobileTab } from './MobileShell'

// ─── Constants ───
const HARMONY_OPTIONS: { mode: HarmonyMode; label: string; desc: string; icon: string }[] = [
  { mode: 'random', label: 'Random', desc: 'No constraints — pure variety', icon: '🎲' },
  { mode: 'analogous', label: 'Analogous', desc: 'Adjacent on the color wheel', icon: '🌈' },
  { mode: 'monochromatic', label: 'Monochromatic', desc: 'One hue, varied lightness', icon: '🔵' },
  { mode: 'complementary', label: 'Complementary', desc: 'Opposite colors for contrast', icon: '🔴' },
  { mode: 'triadic', label: 'Triadic', desc: 'Three equally spaced hues', icon: '🔺' },
]

const VISION_MODES: { mode: VisionMode; label: string; emoji: string; pro: boolean }[] = [
  { mode: 'normal', label: 'Normal', emoji: '👁', pro: false },
  { mode: 'protanopia', label: 'Protanopia', emoji: '🔴', pro: false },
  { mode: 'deuteranopia', label: 'Deuteranopia', emoji: '🟢', pro: true },
  { mode: 'tritanopia', label: 'Tritanopia', emoji: '🔵', pro: true },
  { mode: 'achromatopsia', label: 'Achromatopsia', emoji: '⚫', pro: true },
]

interface MobileStudioProps {
  onNavigate: (tab: MobileTab) => void
}

export function MobileStudio(_props: MobileStudioProps) {
  const { isPro, showPaymentModal, setShowPaymentModal } = usePro()
  const { user, signInWithGoogle } = useAuth()

  const {
    swatches, harmonyMode, count, generate,
    lockSwatch, setHarmonyMode, setCount, setSwatches,
  } = usePaletteStore()

  // ─── Sheet state (single-sheet rule) ───
  const [activeSheet, setActiveSheet] = useState<
    'harmony' | 'color-detail' | 'ai' | 'export' | 'save' | 'pro' | 'sign-in' | null
  >(null)
  const [viewMode, setViewMode] = useState<'colors' | 'preview'>('colors')
  const [activeColorIdx, setActiveColorIdx] = useState(0)
  const [visionMode, setVisionMode] = useState<VisionMode>('normal')
  const [validateOn, setValidateOn] = useState(false)
  const [copiedHex, setCopiedHex] = useState<string | null>(null)
  const [saveNameOpen, setSaveNameOpen] = useState(false)

  const visionFilter = visionMode !== 'normal' ? `url(#vision-${visionMode})` : undefined

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
  }, [generate, harmonyMode, count])

  const handleCopyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex.toUpperCase())
      setCopiedHex(hex)
      showToast('Copied!')
      setTimeout(() => setCopiedHex(null), 1200)
    } catch { /* silent */ }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('Link copied!')
    } catch { /* silent */ }
  }

  const defaultPaletteName = useMemo(() => {
    const names = swatches.map(s => getColorName(s.hex)).filter(Boolean)
    return names.slice(0, 3).join(' · ') || 'Untitled'
  }, [swatches])

  const handleSave = () => {
    if (!user) { setActiveSheet('sign-in'); return }
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
    const max = isPro ? 8 : 5
    setSwatches(hexes.slice(0, max).map(h => makeSwatch(h)))
    analytics.track('palette_generated', { method: 'ai', style: harmonyMode, color_count: hexes.length })
  }

  const handleToggleValidate = () => {
    if (validateOn) {
      setValidateOn(false)
      setVisionMode('normal')
    } else {
      setValidateOn(true)
    }
  }

  const handleVisionSelect = (mode: VisionMode) => {
    if (mode === 'normal') {
      setVisionMode('normal')
      setValidateOn(false)
    } else {
      setVisionMode(mode)
    }
  }

  const activeSwatch = swatches[activeColorIdx]

  // ─── Render ───
  return (
    <div className="flex flex-col h-full">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
        <button
          onClick={() => setActiveSheet('harmony')}
          className="flex items-center gap-1 text-[15px] font-bold tracking-tight text-foreground"
          aria-label={`Harmony: ${harmonyMode}. Tap to change.`}
        >
          Harmony: {HARMONY_OPTIONS.find(h => h.mode === harmonyMode)?.label}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="ml-0.5 text-muted" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <button
          onClick={handleToggleValidate}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
            validateOn
              ? 'bg-primary text-primary-foreground'
              : 'border border-border text-muted-foreground'
          }`}
          style={{ minHeight: 32 }}
          aria-label={validateOn ? 'Disable accessibility validation' : 'Enable accessibility validation'}
          aria-pressed={validateOn}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
          Validate
        </button>
      </div>

      {/* Segmented control */}
      <div className="flex mx-4 mb-2 rounded-button bg-surface p-0.5">
        {(['colors', 'preview'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 py-1.5 text-[13px] font-medium rounded-button transition-all ${
              viewMode === mode ? 'bg-card shadow-sm text-foreground' : 'text-muted'
            }`}
          >
            {mode === 'colors' ? 'Colors' : 'Preview'}
          </button>
        ))}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {viewMode === 'colors' ? (
          <>
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
                    className="flex-1 flex flex-col items-center justify-end relative"
                    style={{ backgroundColor: swatch.hex, paddingBottom: 12, minHeight: 44 }}
                    onClick={() => { setActiveColorIdx(i); setActiveSheet('color-detail') }}
                    aria-label={`${getColorName(swatch.hex)} ${swatch.hex}. Tap for details.`}
                  >
                    {swatch.locked && (
                      <Lock size={12} style={{ color: textColor, opacity: 0.5, position: 'absolute', top: 10 }} aria-label="Locked" />
                    )}
                    {/* WCAG badge */}
                    <span className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm mb-1">
                      <span className="text-[10px] font-bold text-foreground">{badge.level}</span>
                      <span className="text-[9px] text-muted-foreground">{badge.ratio.toFixed(1)}</span>
                      {badge.pass && <span className="text-[9px] text-success">✓</span>}
                    </span>
                    {/* Hex */}
                    <span className="bg-white/90 backdrop-blur-sm rounded-md px-1.5 py-0.5 shadow-sm">
                      <span className="text-[10px] font-semibold font-mono text-foreground tracking-wide">
                        {swatch.hex.toUpperCase().slice(0, 7)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Vision filter strip */}
            {validateOn && (
              <div
                className="mx-3 mt-2 flex gap-1.5 overflow-x-auto scrollbar-none rounded-xl bg-white/90 border border-border/30 px-2 py-2"
                style={{ WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)' }}
              >
                {VISION_MODES.map(({ mode, label, emoji, pro }) => {
                  const isActive = visionMode === mode
                  const isLocked = pro && !isPro
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        if (isLocked) { openProModal('vision_sim', 'mobile_strip'); return }
                        handleVisionSelect(mode)
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-surface text-muted-foreground'
                      }`}
                      style={{ minHeight: 32 }}
                      aria-label={`${label}${isLocked ? ' (Pro)' : ''}`}
                      aria-pressed={isActive}
                    >
                      <span aria-hidden="true">{emoji}</span>
                      {label}
                      {isLocked && <Badge variant="pro" className="text-[7px] px-1 py-0">PRO</Badge>}
                    </button>
                  )
                })}
                <button
                  onClick={() => { setVisionMode('normal'); setValidateOn(false) }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground whitespace-nowrap"
                  style={{ minHeight: 32 }}
                  aria-label="Close vision simulation"
                >
                  ✕ Done
                </button>
              </div>
            )}

            {/* Action tools row */}
            <div className="flex items-center justify-center gap-1 px-3 pt-2.5 pb-1">
              {/* AI */}
              <button
                onClick={() => setActiveSheet('ai')}
                className="relative flex flex-col items-center px-3 py-1.5 rounded-xl transition-colors active:bg-surface"
                style={{ minWidth: 48, minHeight: 44 }}
                aria-label="AI palette"
              >
                <Sparkles size={20} className="text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground mt-0.5">AI</span>
                {!isPro && (
                  <span className="absolute top-0.5 right-1 min-w-[14px] h-[14px] rounded-full bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center">
                    {Math.max(0, AI_MAX_FREE - getAiUsageToday())}
                  </span>
                )}
              </button>
              {/* Extract */}
              <button
                onClick={() => openProModal('image_extraction', 'mobile_tools')}
                className="relative flex flex-col items-center px-3 py-1.5 rounded-xl transition-colors active:bg-surface"
                style={{ minWidth: 48, minHeight: 44 }}
                aria-label="Extract palette from image"
              >
                <ImagePlus size={20} className="text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground mt-0.5">Extract</span>
                {!isPro && (
                  <span className="absolute top-0 right-0.5">
                    <Badge variant="pro" className="text-[7px] px-1 py-0">PRO</Badge>
                  </span>
                )}
              </button>
              {/* Save */}
              <button
                onClick={handleSave}
                className="flex flex-col items-center px-3 py-1.5 rounded-xl transition-colors active:bg-surface"
                style={{ minWidth: 48, minHeight: 44 }}
                aria-label="Save palette"
              >
                <Heart size={20} className="text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground mt-0.5">Save</span>
              </button>
              {/* Share */}
              <button
                onClick={handleShare}
                className="flex flex-col items-center px-3 py-1.5 rounded-xl transition-colors active:bg-surface"
                style={{ minWidth: 48, minHeight: 44 }}
                aria-label="Share palette link"
              >
                <Link size={20} className="text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground mt-0.5">Share</span>
              </button>
              {/* Export */}
              <button
                onClick={() => setActiveSheet('export')}
                className="flex flex-col items-center px-3 py-1.5 rounded-xl transition-colors active:bg-surface"
                style={{ minWidth: 48, minHeight: 44 }}
                aria-label="Export palette"
              >
                <Download size={20} className="text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground mt-0.5">Export</span>
              </button>
            </div>
          </>
        ) : (
          /* Preview view */
          <div className="flex-1 overflow-auto px-3 pb-3" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="flex flex-col gap-3">
              {[
                { title: 'Landing Page', height: 190, free: true },
                { title: 'Dashboard', height: 150, free: false },
                { title: 'Mobile App', height: 150, free: false },
              ].map(({ title, height, free }) => (
                <div
                  key={title}
                  className="rounded-[20px] overflow-hidden shadow-sm relative"
                  style={{
                    height,
                    background: `linear-gradient(135deg, ${swatches[0]?.hex || '#6C47FF'} 0%, ${swatches[Math.min(2, swatches.length - 1)]?.hex || '#4ECDC4'} 50%, ${swatches[Math.min(4, swatches.length - 1)]?.hex || '#FFE66D'} 100%)`,
                  }}
                >
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span className="text-white text-[13px] font-bold drop-shadow-sm">{title}</span>
                    <span className={`text-[9px] font-bold rounded-md px-2 py-0.5 ${free ? 'bg-success-bg text-success' : 'bg-primary/10 text-primary'}`}>
                      {free ? 'FREE' : 'PRO'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generate bar */}
      <div className="flex items-center gap-2.5 px-3 pb-2 pt-1">
        <button
          onClick={() => { if (count > 3) setCount(count - 1) }}
          disabled={count <= 3}
          className="flex items-center justify-center border border-border rounded-[10px] disabled:opacity-30 transition-all active:scale-95"
          style={{ width: 38, height: 38 }}
          aria-label="Remove color"
        >
          <Minus size={16} className="text-foreground" />
        </button>
        <span className="text-base font-extrabold text-foreground tabular-nums" style={{ minWidth: 20, textAlign: 'center' }}>{count}</span>
        <button
          onClick={() => {
            if (!isPro && count >= 5) { openProModal('color_count', 'mobile_bar'); return }
            if (count < (isPro ? 8 : 5)) setCount(count + 1)
          }}
          disabled={isPro ? count >= 8 : false}
          className="relative flex items-center justify-center border border-border rounded-[10px] disabled:opacity-30 transition-all active:scale-95"
          style={{ width: 38, height: 38 }}
          aria-label={!isPro && count >= 5 ? 'Upgrade to Pro for more colors' : 'Add color'}
        >
          <Plus size={16} className="text-foreground" />
          {!isPro && count >= 5 && (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-foreground/75 flex items-center justify-center">
              <Lock size={8} className="text-white" />
            </span>
          )}
        </button>

        <Button
          onClick={triggerGenerate}
          className="flex-1 h-12 rounded-[14px] text-[15px] font-bold shadow-lg"
          style={{ boxShadow: '0 4px 20px rgba(108,71,255,0.3)' }}
          aria-label="Generate new palette"
        >
          Generate
        </Button>
      </div>

      {/* ─── Bottom Sheets ─── */}

      {/* Harmony sheet */}
      <MobileBottomSheet
        open={activeSheet === 'harmony'}
        onClose={closeSheet}
        title="Color Harmony"
        subtitle="How colors relate to each other"
      >
        <div className="flex flex-col gap-1.5 pb-4">
          {HARMONY_OPTIONS.map(({ mode, label, desc, icon }) => {
            const isActive = harmonyMode === mode
            return (
              <button
                key={mode}
                onClick={() => { setHarmonyMode(mode); closeSheet() }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                  isActive ? 'bg-surface' : ''
                }`}
                aria-label={`${label}: ${desc}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="text-lg" aria-hidden="true">{icon}</span>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-foreground">{label}</div>
                  <div className="text-[12px] text-muted">{desc}</div>
                </div>
                {isActive && (
                  <Check size={16} className="text-primary shrink-0" aria-hidden="true" />
                )}
              </button>
            )
          })}
        </div>
      </MobileBottomSheet>

      {/* Color Detail sheet */}
      <MobileBottomSheet
        open={activeSheet === 'color-detail'}
        onClose={closeSheet}
        title="Color Detail"
      >
        {activeSwatch && (() => {
          const hex = activeSwatch.hex
          const textColor = readableOn(hex)
          const badge = getContrastBadge(hex)
          const name = getColorName(hex)
          return (
            <div className="flex flex-col gap-4 pb-4">
              {/* Contrast specimen */}
              <div
                className="flex flex-col items-center justify-center rounded-xl"
                style={{ height: 100, backgroundColor: hex }}
              >
                <span style={{ fontSize: 36, fontWeight: 800, color: textColor, lineHeight: 1 }}>Aa</span>
                <span className="text-[12px] font-medium mt-1" style={{ color: textColor, opacity: 0.8 }}>
                  {badge.ratio.toFixed(1)}:1 · {badge.level}
                </span>
              </div>

              {/* Info */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[20px] font-bold font-mono text-foreground">{hex.toUpperCase()}</div>
                  <div className="text-[13px] text-muted">{name}</div>
                </div>
                <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${badge.pass ? 'bg-success-bg text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {badge.level} {badge.pass ? '✓' : '✗'}
                </span>
              </div>

              {/* Action grid — 2×2 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopyHex(hex)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-surface transition-all active:scale-[0.98]"
                  aria-label={`Copy ${hex}`}
                >
                  {copiedHex === hex ? <Check size={16} className="text-success" /> : <Copy size={16} className="text-muted-foreground" />}
                  <span className="text-[13px] font-medium text-foreground">{copiedHex === hex ? 'Copied' : 'Copy hex'}</span>
                </button>
                <button
                  onClick={() => { closeSheet(); openProModal('shade_scale', 'mobile_detail') }}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-surface/50 transition-all active:scale-[0.98]"
                  aria-label="Shade scale (Pro feature)"
                >
                  <Grid3X3 size={16} className="text-muted/50" />
                  <span className="text-[13px] font-medium text-muted/60">Shades</span>
                  <Badge variant="pro" className="text-[7px] px-1 py-0 ml-auto">PRO</Badge>
                </button>
                <button
                  onClick={() => lockSwatch(activeSwatch.id)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-surface transition-all active:scale-[0.98]"
                  aria-label={activeSwatch.locked ? 'Unlock color' : 'Lock color'}
                >
                  {activeSwatch.locked ? <Lock size={16} className="text-primary" /> : <Unlock size={16} className="text-muted-foreground" />}
                  <span className="text-[13px] font-medium text-foreground">{activeSwatch.locked ? 'Locked' : 'Lock color'}</span>
                </button>
                <button
                  onClick={() => { closeSheet(); openProModal('color_info', 'mobile_detail') }}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl bg-surface/50 transition-all active:scale-[0.98]"
                  aria-label="Color info (Pro feature)"
                >
                  <Info size={16} className="text-muted/50" />
                  <span className="text-[13px] font-medium text-muted/60">Info</span>
                  <Badge variant="pro" className="text-[7px] px-1 py-0 ml-auto">PRO</Badge>
                </button>
              </div>
            </div>
          )
        })()}
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
