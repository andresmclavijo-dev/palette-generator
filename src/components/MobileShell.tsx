import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, Eye, LayoutDashboard, Heart, User,
  Lock, Unlock, Copy, Check, RefreshCw,
} from 'lucide-react'
import { usePaletteStore } from '../store/paletteStore'
import { usePro } from '../hooks/usePro'
import { useAuth } from '../hooks/useAuth'
import { readableOn, isLight, getColorName, getContrastBadge, makeSwatch } from '../lib/colorEngine'
import type { HarmonyMode } from '../lib/colorEngine'
import type { VisionMode } from './palette/VisionSimulator'
import { VisionFilterDefs } from './palette/VisionSimulator'
import { BRAND_VIOLET } from '../lib/tokens'
import { analytics } from '../lib/posthog'
import { showToast } from '../utils/toast'
import { createCheckoutSession, createPortalSession } from '../lib/stripe'
import EmptyStateOverlay from './EmptyStateOverlay'
import ExportPanel from './palette/ExportPanel'
import ProUpgradeModal from './ui/ProUpgradeModal'
import SignInModal from './ui/SignInModal'
import SaveNameModal from './ui/SaveNameModal'
import PaymentSuccessModal from './ui/PaymentSuccessModal'
import CookieConsent from './CookieConsent'
import AiPrompt from './palette/AiPrompt'
import PreviewModal from './palette/PreviewModal'

// ─── Types ──────────────────────────────────────────────
type MobileTab = 'generate' | 'simulate' | 'preview' | 'library' | 'profile'

const HARMONY_LABELS: Record<HarmonyMode, string> = {
  random: 'Random',
  analogous: 'Analogous',
  monochromatic: 'Mono',
  complementary: 'Complement',
  triadic: 'Triadic',
}

const HARMONY_MODES: { value: HarmonyMode; label: string; desc: string }[] = [
  { value: 'random',         label: 'Random',         desc: 'No rules, pure exploration' },
  { value: 'analogous',      label: 'Analogous',      desc: 'Neighbors on the color wheel' },
  { value: 'monochromatic',  label: 'Monochromatic',  desc: 'Shades of a single hue' },
  { value: 'complementary',  label: 'Complementary',  desc: 'Opposite sides of the wheel' },
  { value: 'triadic',        label: 'Triadic',        desc: 'Three evenly spaced hues' },
]

const VISION_MODES: { value: VisionMode; label: string; desc: string; free: boolean }[] = [
  { value: 'normal',        label: 'Normal Vision',  desc: 'Default color rendering',  free: true },
  { value: 'protanopia',    label: 'Protanopia',     desc: 'Red-blind color vision',   free: true },
  { value: 'deuteranopia',  label: 'Deuteranopia',   desc: 'Green-blind color vision', free: false },
  { value: 'tritanopia',    label: 'Tritanopia',     desc: 'Blue-blind color vision',  free: false },
  { value: 'achromatopsia', label: 'Achromatopsia',  desc: 'Complete color blindness',  free: false },
]

// ─── Main Component ─────────────────────────────────────
export default function MobileShell() {
  const [activeTab, setActiveTab] = useState<MobileTab>('generate')
  const [harmonyOpen, setHarmonyOpen] = useState(false)
  const [visionMode, setVisionMode] = useState<VisionMode>('normal')
  const [exportOpen, setExportOpen] = useState(false)
  const [proModalOpen, setProModalOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [saveNameOpen, setSaveNameOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [emptyDismissed, setEmptyDismissed] = useState(() => !!localStorage.getItem('paletta_has_generated'))
  const [emptyMethod, setEmptyMethod] = useState<'spacebar' | 'button' | 'ai'>('button')

  const { isPro, showPaymentModal, setShowPaymentModal } = usePro()
  const { user, isSignedIn, signInWithGoogle, signOut } = useAuth()
  const {
    swatches, harmonyMode, count, historyIndex, history,
    generate, lockSwatch, setHarmonyMode, setCount, undo, redo, setSwatches,
  } = usePaletteStore()

  // Auto-close Pro modal when user becomes Pro
  useEffect(() => { if (isPro) setProModalOpen(false) }, [isPro])

  // After OAuth redirect: pending checkout
  const pendingHandled = useRef(false)
  useEffect(() => {
    if (!user || pendingHandled.current) return
    const pending = localStorage.getItem('paletta_pending_checkout') as 'monthly' | 'yearly' | null
    if (!pending) return
    pendingHandled.current = true
    localStorage.removeItem('paletta_pending_checkout')
    showToast('Redirecting to checkout…')
    createCheckoutSession(pending, user.id, user.email ?? undefined)
      .then(url => { window.location.href = url })
      .catch(() => showToast('Something went wrong — please try again'))
  }, [user])

  const openProModal = useCallback((feature?: string, source?: string) => {
    if (feature) analytics.track('pro_gate_hit', { feature, source: source ?? 'mobile' })
    analytics.track('pro_modal_opened')
    setProModalOpen(true)
  }, [])

  const triggerGenerate = useCallback(() => {
    generate()
    if (!emptyDismissed) { setEmptyMethod('button'); setEmptyDismissed(true) }
    analytics.track('palette_generated', { method: 'button', style: harmonyMode, color_count: count })
    if (!localStorage.getItem('paletta_first_generate_at')) {
      localStorage.setItem('paletta_first_generate_at', String(Date.now()))
      const sessionStart = Number(sessionStorage.getItem('paletta_session_start') || Date.now())
      analytics.track('first_generate', { time_to_first_generate_ms: Date.now() - sessionStart })
    }
  }, [generate, harmonyMode, count, emptyDismissed])

  const switchTab = (tab: MobileTab) => {
    setActiveTab(tab)
    setHarmonyOpen(false)
    analytics.track('mobile_tab_switched', { tab })
  }

  const handleSave = () => {
    if (!isPro) { openProModal('save_limit', 'mobile_generate'); return }
    if (!user) { setSignInOpen(true); return }
    setSaveNameOpen(true)
  }

  const handleSaveConfirm = async (name: string) => {
    setSaveNameOpen(false)
    if (!user) return
    try {
      const { supabase } = await import('../lib/supabase')
      const colors = swatches.map(s => s.hex).filter(Boolean)
      if (colors.length === 0) { showToast('Nothing to save'); return }
      const { data: existing } = await supabase
        .from('saved_palettes').select('id, colors').eq('user_id', user.id)
      const isDup = existing?.some(
        (p: { colors: string[] }) => JSON.stringify(p.colors) === JSON.stringify(colors)
      )
      if (isDup) { showToast('Palette already saved'); return }
      const { error } = await supabase.from('saved_palettes').insert({ user_id: user.id, name, colors })
      if (error) throw error
      showToast('Palette saved ✓')
      analytics.track('palette_saved', { palette_count: (existing?.length ?? 0) + 1, is_pro: isPro })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Save failed:', msg)
      showToast('Save failed — try again')
    }
  }

  const handleAiPalette = (hexes: string[]) => {
    setSwatches(hexes.map(h => makeSwatch(h)))
    if (!emptyDismissed) { setEmptyMethod('ai'); setEmptyDismissed(true) }
    analytics.track('palette_generated', { method: 'ai', style: harmonyMode, color_count: hexes.length })
  }

  const defaultPaletteName = swatches.map(s => getColorName(s.hex)).filter(Boolean).slice(0, 3).join(' · ') || 'Untitled'

  const visionFilter = visionMode !== 'normal' ? `url(#vision-${visionMode})` : undefined
  const showHarmonyBtn = activeTab === 'generate' || activeTab === 'simulate' || activeTab === 'preview'

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: '#FAFAF8' }}>
      {/* ─── Floating Header ─── */}
      <div
        className="fixed left-3.5 right-3.5 z-50 flex items-center justify-between px-3 py-2"
        style={{
          top: 54,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 18,
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-lg text-white font-bold text-sm"
            style={{ width: 26, height: 26, backgroundColor: BRAND_VIOLET }}
          >
            P
          </div>
          <span className="text-[15px] font-semibold" style={{ color: '#1a1a2e' }}>Paletta</span>
        </div>

        {showHarmonyBtn && (
          <button
            onClick={() => setHarmonyOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-[13px] font-medium text-gray-700 active:bg-gray-200 transition-colors"
            aria-label="Change harmony mode"
            aria-expanded={harmonyOpen}
          >
            {HARMONY_LABELS[harmonyMode]}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"
              style={{ transform: harmonyOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        )}
      </div>

      {/* ─── Harmony Dropdown Overlay ─── */}
      {harmonyOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setHarmonyOpen(false)}>
          <div className="absolute inset-0 bg-black/10" />
          <div
            className="absolute left-3.5 right-3.5 bg-white overflow-hidden"
            style={{
              top: 108,
              borderRadius: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {HARMONY_MODES.map((m, i) => {
              const isActive = harmonyMode === m.value
              return (
                <button
                  key={m.value}
                  onClick={() => { setHarmonyMode(m.value); setHarmonyOpen(false) }}
                  className="w-full text-left transition-colors active:bg-gray-100"
                  style={{
                    padding: '14px 16px',
                    background: isActive ? 'rgba(108,71,255,0.08)' : undefined,
                    borderTop: i > 0 ? '1px solid #F3F4F6' : undefined,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold" style={{ color: isActive ? BRAND_VIOLET : '#1a1a2e' }}>
                      {m.label}
                    </span>
                    {isActive && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND_VIOLET} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <p className="text-[13px] mt-0.5 m-0" style={{ color: '#6B7280' }}>{m.desc}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 overflow-hidden" style={{ paddingTop: 100, paddingBottom: 80 }}>
        {activeTab === 'generate' && (
          <GenerateView
            swatches={swatches}
            visionFilter={visionFilter}
            emptyDismissed={emptyDismissed}
            emptyMethod={emptyMethod}
            onGenerate={triggerGenerate}
            onLock={lockSwatch}
            onSave={handleSave}
            isPro={isPro}
            count={count}
            onCountChange={setCount}
            historyIndex={historyIndex}
            historyLength={history.length}
            onUndo={undo}
            onRedo={redo}
          />
        )}
        {activeTab === 'simulate' && (
          <SimulateView
            swatches={swatches}
            visionMode={visionMode}
            onVisionChange={setVisionMode}
            onGenerate={triggerGenerate}
            isPro={isPro}
            onProGate={() => openProModal('vision_sim', 'mobile_simulate')}
          />
        )}
        {activeTab === 'preview' && (
          <PreviewView
            onGenerate={triggerGenerate}
            onProGate={openProModal}
            onOpenPreviewModal={() => setPreviewModalOpen(true)}
          />
        )}
        {activeTab === 'library' && (
          <LibraryView
            user={user}
            isSignedIn={isSignedIn}
            isPro={isPro}
            onSignIn={() => setSignInOpen(true)}
            onProGate={() => openProModal('save_limit', 'mobile_library')}
            onLoad={(hexes) => { setSwatches(hexes.map(h => makeSwatch(h))); switchTab('generate') }}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            isSignedIn={isSignedIn}
            isPro={isPro}
            onSignIn={signInWithGoogle}
            onSignOut={signOut}
            onProGate={() => openProModal(undefined, 'mobile_profile')}
            onManageSubscription={async () => {
              if (!user?.email) { showToast('Contact support'); return }
              try { window.location.href = await createPortalSession(user.email) }
              catch { showToast('Contact support') }
            }}
          />
        )}
      </div>

      {/* ─── Bottom Tab Bar ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-start justify-around"
        style={{
          height: 80,
          paddingTop: 8,
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '0.5px solid #E5E7EB',
        }}
        aria-label="Main navigation"
      >
        {([
          { id: 'generate' as MobileTab, icon: Sparkles, label: 'Generate' },
          { id: 'simulate' as MobileTab, icon: Eye, label: 'Simulate' },
          { id: 'preview' as MobileTab, icon: LayoutDashboard, label: 'Preview' },
          { id: 'library' as MobileTab, icon: Heart, label: 'Library' },
          { id: 'profile' as MobileTab, icon: User, label: 'Profile' },
        ]).map(tab => {
          const active = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className="flex flex-col items-center gap-0.5 pt-1"
              style={{ minWidth: 56, minHeight: 44 }}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2 : 1.5}
                style={{ color: active ? BRAND_VIOLET : '#9CA3AF' }}
              />
              <span
                className="text-[10px]"
                style={{ fontWeight: active ? 700 : 500, color: active ? BRAND_VIOLET : '#9CA3AF' }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* ─── Modals & Overlays ─── */}
      {exportOpen && <ExportPanel hexes={swatches.map(s => s.hex)} onClose={() => setExportOpen(false)} />}
      <ProUpgradeModal open={proModalOpen} onClose={() => setProModalOpen(false)} />
      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} onGoogleSignIn={signInWithGoogle} />
      <SaveNameModal open={saveNameOpen} defaultName={defaultPaletteName} onConfirm={handleSaveConfirm} onClose={() => setSaveNameOpen(false)} />
      <PaymentSuccessModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} />
      <PreviewModal open={previewModalOpen} onClose={() => setPreviewModalOpen(false)} onProGate={openProModal} />
      <AiPrompt
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onPalette={handleAiPalette}
        onFallback={triggerGenerate}
        onProGate={openProModal}
        onUsageChange={() => {}}
        onError={(msg) => showToast(msg)}
        colorCount={count}
      />
      <VisionFilterDefs />
      <CookieConsent />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// GENERATE VIEW
// ═══════════════════════════════════════════════════════════
interface GenerateViewProps {
  swatches: { id: string; hex: string; locked: boolean }[]
  visionFilter?: string
  emptyDismissed: boolean
  emptyMethod: 'spacebar' | 'button' | 'ai'
  onGenerate: () => void
  onLock: (id: string) => void
  onSave: () => void
  isPro: boolean
  count: number
  onCountChange: (n: number) => void
  historyIndex: number
  historyLength: number
  onUndo: () => void
  onRedo: () => void
}

function GenerateView({
  swatches, visionFilter, emptyDismissed, emptyMethod,
  onGenerate, onLock, onSave,
  isPro, count, onCountChange,
  historyIndex, historyLength, onUndo, onRedo,
}: GenerateViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyHex = (id: string, hex: string) => {
    navigator.clipboard.writeText(hex).catch(() => {})
    setCopiedId(id)
    showToast('Copied!')
    setTimeout(() => setCopiedId(null), 1500)
  }

  const FREE_COUNTS = [3, 4, 5]
  const mobileCounts = isPro ? [3, 4, 5, 6, 7, 8] : FREE_COUNTS
  const cycleCount = () => {
    const idx = mobileCounts.indexOf(count)
    onCountChange(mobileCounts[(idx + 1) % mobileCounts.length])
  }

  return (
    <div className="relative h-full flex flex-col" style={{ filter: visionFilter }}>
      {/* Empty state overlay */}
      <EmptyStateOverlay dismissed={emptyDismissed} method={emptyMethod} />

      {/* Swatches — full bleed */}
      <div className="flex-1 flex flex-col min-h-0">
        {swatches.map((s) => {
          const textColor = readableOn(s.hex)
          const badge = getContrastBadge(s.hex)
          const isCopied = copiedId === s.id
          return (
            <div
              key={s.id}
              className="flex-1 flex items-center justify-between px-4 relative"
              style={{ backgroundColor: s.hex, minHeight: 48 }}
            >
              {/* Left: hex */}
              <span
                className="text-[14px] font-semibold font-mono tracking-wide"
                style={{ color: textColor }}
              >
                {s.hex}
              </span>

              {/* WCAG badge */}
              {badge.pass && (
                <span
                  className="absolute bottom-1.5 left-4 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    color: textColor,
                  }}
                >
                  {badge.level} {badge.ratio.toFixed(1)}:1
                </span>
              )}

              {/* Right: actions */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => copyHex(s.id, s.hex)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
                  aria-label={isCopied ? 'Copied' : `Copy ${s.hex}`}
                >
                  {isCopied
                    ? <Check size={14} style={{ color: textColor }} />
                    : <Copy size={14} style={{ color: textColor }} />
                  }
                </button>
                <button
                  onClick={() => onLock(s.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
                  aria-label={s.locked ? 'Unlock color' : 'Lock color'}
                >
                  {s.locked
                    ? <Lock size={14} style={{ color: textColor }} />
                    : <Unlock size={14} style={{ color: textColor }} />
                  }
                </button>
              </div>

              {/* Lock overlay */}
              {s.locked && (
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Save heart — bottom left */}
      <button
        onClick={onSave}
        className="absolute bottom-20 left-4 w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
        aria-label="Save palette"
      >
        <Heart size={20} style={{ color: isLight(swatches[swatches.length - 1]?.hex ?? '#000') ? '#1a1a2e' : '#fff' }} />
      </button>

      {/* Bottom controls bar */}
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2"
      >
        {/* Undo */}
        <button
          onClick={onUndo}
          disabled={historyIndex <= 0}
          className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
          aria-label="Undo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isLight(swatches[swatches.length - 1]?.hex ?? '#000') ? '#1a1a2e' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>

        {/* Generate FAB */}
        <button
          onClick={onGenerate}
          className={`flex items-center gap-2.5 rounded-2xl text-white text-[14px] font-semibold shadow-lg active:scale-95 transition-all${!emptyDismissed ? ' pulse-cta' : ''}`}
          style={{ padding: '13px 32px', backgroundColor: BRAND_VIOLET }}
          aria-label="Generate new palette"
        >
          <RefreshCw size={16} strokeWidth={2.5} />
          Generate
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          disabled={historyIndex >= historyLength - 1}
          className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 transition-all"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}
          aria-label="Redo"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isLight(swatches[swatches.length - 1]?.hex ?? '#000') ? '#1a1a2e' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>
          </svg>
        </button>

        {/* Color count */}
        <button
          onClick={cycleCount}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all"
          style={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: isLight(swatches[swatches.length - 1]?.hex ?? '#000') ? '#1a1a2e' : '#fff' }}
          aria-label={`${count} colors, tap to change`}
        >
          {count}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SIMULATE VIEW
// ═══════════════════════════════════════════════════════════
interface SimulateViewProps {
  swatches: { id: string; hex: string; locked: boolean }[]
  visionMode: VisionMode
  onVisionChange: (m: VisionMode) => void
  onGenerate: () => void
  isPro: boolean
  onProGate: () => void
}

function SimulateView({ swatches, visionMode, onVisionChange, onGenerate, isPro, onProGate }: SimulateViewProps) {
  const filter = visionMode !== 'normal' ? `url(#vision-${visionMode})` : undefined

  return (
    <div className="h-full flex flex-col">
      {/* Palette strip */}
      <div className="flex h-28 shrink-0 mx-3.5 rounded-2xl overflow-hidden" style={{ filter }}>
        {swatches.map(s => (
          <div key={s.id} className="flex-1" style={{ backgroundColor: s.hex }} />
        ))}
      </div>

      {/* Vision options */}
      <div className="flex-1 overflow-y-auto mt-4 mx-3.5 bg-white rounded-2xl border border-gray-200">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-[16px] font-bold" style={{ color: '#1a1a2e' }}>Vision simulation</h2>
          <p className="text-[12px] mt-0.5" style={{ color: '#9CA3AF' }}>Preview your palette through different types of color vision</p>
        </div>
        {VISION_MODES.map((m, i) => {
          const isActive = visionMode === m.value
          const needsPro = !m.free && !isPro
          return (
            <button
              key={m.value}
              onClick={() => {
                if (needsPro) { onProGate(); return }
                onVisionChange(m.value)
              }}
              className="w-full text-left transition-colors active:bg-gray-100"
              style={{
                padding: '14px 16px',
                background: isActive ? 'rgba(108,71,255,0.08)' : undefined,
                borderTop: i > 0 ? '1px solid #F3F4F6' : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold" style={{ color: isActive ? BRAND_VIOLET : '#1a1a2e' }}>
                  {m.label}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {needsPro && (
                    <span className="text-[10px] font-bold" style={{ background: 'rgba(108,71,255,0.1)', color: BRAND_VIOLET, padding: '2px 8px', borderRadius: 99 }}>
                      PRO
                    </span>
                  )}
                  {isActive && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND_VIOLET} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-[13px] mt-0.5 m-0" style={{ color: '#6B7280' }}>{m.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Mini Generate FAB */}
      <button
        onClick={onGenerate}
        className="absolute bottom-24 right-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
        style={{ backgroundColor: BRAND_VIOLET }}
        aria-label="Generate new palette"
      >
        <RefreshCw size={20} strokeWidth={2.5} color="#fff" />
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PREVIEW VIEW
// ═══════════════════════════════════════════════════════════
interface PreviewViewProps {
  onGenerate: () => void
  onProGate: (feature?: string, source?: string) => void
  onOpenPreviewModal: () => void
}

function PreviewView({ onGenerate, onProGate, onOpenPreviewModal }: PreviewViewProps) {
  const swatches = usePaletteStore(s => s.swatches)
  const { isPro } = usePro()
  const colors = swatches.slice(0, 5).map(s => s.hex)

  const cards: { name: string; locked: boolean }[] = [
    { name: 'Landing Page', locked: false },
    { name: 'Dashboard', locked: !isPro },
    { name: 'Mobile App', locked: !isPro },
  ]

  return (
    <div className="h-full overflow-y-auto px-3.5 pb-4">
      <div className="mb-4">
        <h2 className="text-[20px] font-bold" style={{ color: '#1a1a2e' }}>Preview your palette</h2>
        <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>See how your colors look in realistic UI templates</p>
      </div>

      <div className="space-y-3">
        {cards.map(card => (
          <button
            key={card.name}
            onClick={() => {
              if (card.locked) { onProGate('preview_template', 'mobile_preview'); return }
              onOpenPreviewModal()
            }}
            className="w-full rounded-2xl border border-gray-200 bg-white overflow-hidden text-left active:scale-[0.98] transition-all"
          >
            {/* Gradient preview area */}
            <div
              className="relative"
              style={{
                height: 160,
                background: `linear-gradient(135deg, ${colors[0] ?? '#3A86FF'}, ${colors[1] ?? '#5E9EFF'}, ${colors[2] ?? '#8AB8FF'})`,
              }}
            >
              {card.locked && (
                <div className="absolute top-3 right-3 text-[10px] font-bold" style={{ background: 'rgba(108,71,255,0.9)', color: '#fff', padding: '3px 10px', borderRadius: 99 }}>
                  PRO
                </div>
              )}
              {card.locked && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(2px)' }}>
                  <Lock size={24} style={{ color: '#6C47FF' }} />
                </div>
              )}
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <LayoutDashboard size={16} style={{ color: '#9CA3AF' }} />
              <span className="text-[14px] font-semibold" style={{ color: '#1a1a2e' }}>{card.name}</span>
              {card.locked && <span className="text-[11px] ml-auto" style={{ color: '#9CA3AF' }}>Upgrade to unlock</span>}
            </div>
          </button>
        ))}
      </div>

      {/* Mini Generate FAB */}
      <button
        onClick={onGenerate}
        className="fixed bottom-24 right-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all z-40"
        style={{ backgroundColor: BRAND_VIOLET }}
        aria-label="Generate new palette"
      >
        <RefreshCw size={20} strokeWidth={2.5} color="#fff" />
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// LIBRARY VIEW
// ═══════════════════════════════════════════════════════════
interface LibraryViewProps {
  user: { id: string; email?: string | null } | null
  isSignedIn: boolean
  isPro: boolean
  onSignIn: () => void
  onProGate: () => void
  onLoad: (hexes: string[]) => void
}

interface SavedPalette {
  id: string
  name: string
  colors: string[]
  created_at: string
}

function LibraryView({ user, isSignedIn, isPro, onSignIn, onProGate, onLoad }: LibraryViewProps) {
  const [palettes, setPalettes] = useState<SavedPalette[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    import('../lib/supabase').then(({ supabase }) =>
      supabase.from('saved_palettes').select('id, name, colors, created_at').eq('user_id', user.id).order('created_at', { ascending: false })
    ).then(({ data }) => {
      if (!cancelled) setPalettes((data ?? []) as SavedPalette[])
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user])

  const handleDelete = async (id: string) => {
    const { supabase } = await import('../lib/supabase')
    await supabase.from('saved_palettes').delete().eq('id', id)
    setPalettes(p => p.filter(x => x.id !== id))
    showToast('Deleted')
  }

  // Signed out
  if (!isSignedIn) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Heart size={28} style={{ color: '#D1D5DB' }} />
        </div>
        <h2 className="text-[20px] font-bold" style={{ color: '#1a1a2e' }}>Save palettes you love</h2>
        <p className="text-[13px] mt-2 mb-6" style={{ color: '#9CA3AF' }}>
          Sign in to save up to 3 palettes for free. Go Pro for unlimited saves.
        </p>
        <button
          onClick={onSignIn}
          className="w-full max-w-[280px] h-12 rounded-2xl bg-white border border-gray-200 text-[14px] font-semibold flex items-center justify-center gap-2 active:bg-gray-50 transition-all"
          style={{ color: '#1a1a2e' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
    )
  }

  // Signed in, loading
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="text-[13px]" style={{ color: '#9CA3AF' }}>Loading…</span>
      </div>
    )
  }

  const limit = isPro ? Infinity : 3
  const slotsText = isPro ? 'Unlimited saves' : `${palettes.length} of 3 free slots used`

  // Signed in, empty
  if (palettes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Heart size={28} style={{ color: '#D1D5DB' }} />
        </div>
        <h2 className="text-[18px] font-bold" style={{ color: '#1a1a2e' }}>No palettes saved yet</h2>
        <p className="text-[13px] mt-2" style={{ color: '#9CA3AF' }}>
          Tap the heart on the Generate tab to save
        </p>
        <p className="text-[12px] mt-4" style={{ color: '#D1D5DB' }}>{slotsText}</p>
      </div>
    )
  }

  // Signed in, has palettes
  return (
    <div className="h-full overflow-y-auto px-3.5 pb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[16px] font-bold" style={{ color: '#1a1a2e' }}>My Palettes</h2>
        <span className="text-[11px]" style={{ color: '#9CA3AF' }}>{slotsText}</span>
      </div>
      <div className="space-y-2.5">
        {palettes.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => onLoad(p.colors)}
              className="w-full flex h-16 rounded-t-2xl overflow-hidden"
            >
              {p.colors.map((c, i) => (
                <div key={i} className="flex-1" style={{ backgroundColor: c }} />
              ))}
            </button>
            <div className="flex items-center justify-between px-3 py-2">
              <div>
                <span className="text-[13px] font-semibold" style={{ color: '#1a1a2e' }}>{p.name}</span>
                <span className="text-[11px] ml-2" style={{ color: '#D1D5DB' }}>
                  {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(p.created_at))}
                </span>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors"
                aria-label={`Delete ${p.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      {!isPro && palettes.length >= limit && (
        <button
          onClick={onProGate}
          className="w-full mt-4 h-11 rounded-2xl text-white text-[13px] font-semibold active:scale-95 transition-all"
          style={{ backgroundColor: BRAND_VIOLET }}
        >
          Go Pro for unlimited saves
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// PROFILE VIEW
// ═══════════════════════════════════════════════════════════
interface ProfileViewProps {
  user: { id: string; email?: string | null; user_metadata?: { full_name?: string; avatar_url?: string } } | null
  isSignedIn: boolean
  isPro: boolean
  onSignIn: () => void
  onSignOut: () => void
  onProGate: () => void
  onManageSubscription: () => void
}

function ProfileView({ user, isSignedIn, isPro, onSignIn, onSignOut, onProGate, onManageSubscription }: ProfileViewProps) {
  const [accountOpen, setAccountOpen] = useState(false)
  const [legalOpen, setLegalOpen] = useState(false)

  // Signed out
  if (!isSignedIn) {
    return (
      <div className="h-full overflow-y-auto px-5 pb-8">
        <div className="pt-4 mb-6">
          <h2 className="text-[22px] font-bold" style={{ color: '#1a1a2e' }}>Welcome to Paletta</h2>
          <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Sign in to unlock saving, AI, and more</p>
        </div>

        <button
          onClick={onSignIn}
          className="w-full h-12 rounded-2xl bg-white border border-gray-200 text-[14px] font-semibold flex items-center justify-center gap-2 active:bg-gray-50 transition-all mb-8"
          style={{ color: '#1a1a2e' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Feature highlights */}
        <div className="space-y-4">
          {[
            { icon: '💾', title: 'Save palettes', desc: '3 free · unlimited with Pro' },
            { icon: '✨', title: 'AI generations', desc: '3/day free · unlimited with Pro' },
            { icon: '👁', title: 'Accessibility suite', desc: '2 free simulations · 5 with Pro' },
          ].map(f => (
            <div key={f.title} className="flex gap-3">
              <span className="text-[20px]">{f.icon}</span>
              <div>
                <span className="text-[14px] font-semibold block" style={{ color: '#1a1a2e' }}>{f.title}</span>
                <span className="text-[12px]" style={{ color: '#9CA3AF' }}>{f.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Legal links */}
        <div className="mt-10 flex flex-col gap-2">
          <Link to="/privacy-policy" className="text-[12px] no-underline" style={{ color: '#D1D5DB' }}>Privacy Policy</Link>
          <Link to="/terms-of-service" className="text-[12px] no-underline" style={{ color: '#D1D5DB' }}>Terms of Service</Link>
          <a href="mailto:hello@usepaletta.io" className="text-[12px] no-underline" style={{ color: '#D1D5DB' }}>Contact</a>
        </div>
      </div>
    )
  }

  // Signed in
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="h-full overflow-y-auto px-5 pb-8">
      {/* Avatar + info */}
      <div className="flex items-center gap-3.5 pt-4 mb-5">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[18px] font-bold"
          style={{ background: `linear-gradient(135deg, ${BRAND_VIOLET}, #9b82ff)` }}
        >
          {initial}
        </div>
        <div>
          <span className="text-[16px] font-bold block" style={{ color: '#1a1a2e' }}>{name}</span>
          <span className="text-[12px]" style={{ color: '#9CA3AF' }}>
            {isPro ? 'Pro' : 'Free plan'}
          </span>
        </div>
      </div>

      {/* Upgrade button */}
      {!isPro && (
        <button
          onClick={onProGate}
          className="w-full h-12 rounded-2xl text-white text-[14px] font-semibold active:scale-95 transition-all mb-5"
          style={{ backgroundColor: BRAND_VIOLET }}
        >
          Upgrade to Pro — $5/mo
        </button>
      )}

      {/* Account accordion */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden mb-3">
        <button
          onClick={() => setAccountOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 transition-colors"
        >
          <span className="text-[14px] font-semibold" style={{ color: '#1a1a2e' }}>Account</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"
            style={{ transform: accountOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {accountOpen && (
          <div className="border-t border-gray-100">
            {isPro && (
              <button
                onClick={onManageSubscription}
                className="w-full text-left px-4 py-3 text-[13px] font-medium active:bg-gray-50 transition-colors"
                style={{ color: '#1a1a2e' }}
              >
                Manage subscription
              </button>
            )}
            <button
              onClick={onSignOut}
              className="w-full text-left px-4 py-3 text-[13px] font-medium active:bg-gray-50 transition-colors"
              style={{ color: '#EF4444' }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Legal accordion */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden mb-3">
        <button
          onClick={() => setLegalOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3.5 active:bg-gray-50 transition-colors"
        >
          <span className="text-[14px] font-semibold" style={{ color: '#1a1a2e' }}>Legal</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"
            style={{ transform: legalOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {legalOpen && (
          <div className="border-t border-gray-100 flex flex-col">
            <Link to="/privacy-policy" className="px-4 py-3 text-[13px] font-medium no-underline active:bg-gray-50" style={{ color: '#1a1a2e' }}>Privacy Policy</Link>
            <Link to="/terms-of-service" className="px-4 py-3 text-[13px] font-medium no-underline active:bg-gray-50 border-t border-gray-100" style={{ color: '#1a1a2e' }}>Terms of Service</Link>
            <Link to="/cookie-policy" className="px-4 py-3 text-[13px] font-medium no-underline active:bg-gray-50 border-t border-gray-100" style={{ color: '#1a1a2e' }}>Cookie Policy</Link>
          </div>
        )}
      </div>

      {/* Support */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <a
          href="mailto:hello@usepaletta.io"
          className="flex items-center justify-between px-4 py-3.5 no-underline active:bg-gray-50 transition-colors"
        >
          <span className="text-[14px] font-semibold" style={{ color: '#1a1a2e' }}>Support</span>
          <span className="text-[12px]" style={{ color: '#9CA3AF' }}>hello@usepaletta.io</span>
        </a>
      </div>
    </div>
  )
}
