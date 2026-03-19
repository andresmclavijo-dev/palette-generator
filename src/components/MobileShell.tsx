import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, Eye, LayoutDashboard, Heart, User,
  Lock, Unlock, Copy, Check, RefreshCw, Info,
} from 'lucide-react'
import { usePaletteStore } from '../store/paletteStore'
import { usePro } from '../hooks/usePro'
import { useAuth } from '../hooks/useAuth'
import { readableOn, getColorName, getColorInfo, getContrastBadge, makeSwatch } from '../lib/colorEngine'
import type { HarmonyMode } from '../lib/colorEngine'
import type { VisionMode } from './palette/VisionSimulator'
import { VisionFilterDefs } from './palette/VisionSimulator'
import { BRAND_VIOLET } from '../lib/tokens'
import { analytics } from '../lib/posthog'
import { showToast } from '../utils/toast'
import { createCheckoutSession, createPortalSession } from '../lib/stripe'
// EmptyStateOverlay removed — mobile uses inline first-visit hint
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

  const { isPro, showPaymentModal, setShowPaymentModal } = usePro()
  const { user, isSignedIn, signInWithGoogle, signOut } = useAuth()
  const {
    swatches, harmonyMode, count,
    generate, lockSwatch, setHarmonyMode, setSwatches,
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
    if (!emptyDismissed) {
      setEmptyDismissed(true)
      localStorage.setItem('paletta_has_generated', 'true')
    }
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
    if (!emptyDismissed) {
      setEmptyDismissed(true)
      localStorage.setItem('paletta_has_generated', 'true')
    }
    analytics.track('palette_generated', { method: 'ai', style: harmonyMode, color_count: hexes.length })
  }

  const defaultPaletteName = swatches.map(s => getColorName(s.hex)).filter(Boolean).slice(0, 3).join(' · ') || 'Untitled'

  const visionFilter = visionMode !== 'normal' ? `url(#vision-${visionMode})` : undefined
  const showHarmonyBtn = activeTab === 'generate' || activeTab === 'simulate' || activeTab === 'preview'

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: '#FAFAF8' }}>
      {/* ─── Floating Header Pill ─── */}
      <div
        className="fixed left-3.5 right-3.5 z-50 flex items-center justify-center"
        style={{
          top: 'max(env(safe-area-inset-top, 14px), 14px)',
          height: 44,
          padding: 4,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.04)',
        }}
      >
        {showHarmonyBtn && (
          <button
            onClick={() => setHarmonyOpen(o => !o)}
            className="flex items-center gap-1.5 text-[13px] font-medium active:bg-black/[0.08] transition-colors"
            style={{ height: 36, padding: '0 12px', borderRadius: 8, color: '#1a1a2e' }}
            aria-label="Change harmony mode"
            aria-expanded={harmonyOpen}
          >
            {HARMONY_LABELS[harmonyMode]}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"
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
              top: 'calc(52px + max(env(safe-area-inset-top, 14px), 14px))',
              borderRadius: 12,
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
      <div className="flex-1 overflow-hidden" style={{ paddingTop: 'calc(56px + max(env(safe-area-inset-top, 14px), 14px))', paddingBottom: `calc(68px + env(safe-area-inset-bottom, 16px))`, animation: 'fadeIn 150ms ease' }}>
        {activeTab === 'generate' && (
          <GenerateView
            swatches={swatches}
            visionFilter={visionFilter}
            onGenerate={triggerGenerate}
            onLock={lockSwatch}
            onSave={handleSave}
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
            onGenerate={triggerGenerate}
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
            onGenerate={triggerGenerate}
          />
        )}
      </div>

      {/* ─── Bottom Tab Bar ─── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-start justify-around"
        style={{
          height: `calc(68px + env(safe-area-inset-bottom, 16px))`,
          paddingTop: 8,
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
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
          const isFilled = active && (tab.id === 'generate' || tab.id === 'library')
          const isFirstVisitGenerate = tab.id === 'generate' && !emptyDismissed
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'generate' && activeTab === 'generate') {
                  triggerGenerate()
                } else {
                  switchTab(tab.id)
                }
              }}
              className="flex flex-col items-center justify-center gap-0.5"
              style={{ minWidth: 56, height: 48 }}
              aria-label={tab.id === 'generate' && activeTab === 'generate' ? 'Generate new palette' : tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <div className={isFirstVisitGenerate ? 'tab-pulse' : undefined}>
                <Icon
                  size={20}
                  strokeWidth={active ? 2 : 1.5}
                  fill={isFilled ? BRAND_VIOLET : 'none'}
                  style={{ color: active ? BRAND_VIOLET : '#9CA3AF' }}
                />
              </div>
              <span
                style={{ fontSize: 10, fontWeight: active ? 600 : 500, color: active ? BRAND_VIOLET : '#9CA3AF' }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* First-visit tooltip above Generate tab — auto-fades after 3s */}
      {!emptyDismissed && (
        <div
          className="fixed z-[51] flex flex-col items-center pointer-events-none tab-hint-fade"
          style={{ bottom: `calc(68px + env(safe-area-inset-bottom, 16px) + 4px)`, left: 0, width: '20%' }}
        >
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ backgroundColor: '#1a1a2e', color: '#fff' }}
          >
            Tap to start
          </span>
          <svg width="8" height="5" viewBox="0 0 8 5" fill="#1a1a2e" aria-hidden="true">
            <polygon points="0,0 8,0 4,5" />
          </svg>
        </div>
      )}

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

      {/* Cookie consent — top-positioned below header pill to avoid tab bar collision */}
      <div
        className="fixed left-0 right-0 z-[55]"
        style={{ top: 'calc(52px + max(env(safe-area-inset-top, 14px), 14px))' }}
      >
        <CookieConsent compact />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// GENERATE VIEW
// ═══════════════════════════════════════════════════════════
interface GenerateViewProps {
  swatches: { id: string; hex: string; locked: boolean }[]
  visionFilter?: string
  onGenerate: () => void
  onLock: (id: string) => void
  onSave: () => void
}

function GenerateView({
  swatches, visionFilter,
  onGenerate, onLock, onSave,
}: GenerateViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [infoId, setInfoId] = useState<string | null>(null)

  const copyHex = (id: string, hex: string) => {
    navigator.clipboard.writeText(hex).catch(() => {})
    setCopiedId(id)
    showToast('Copied!')
    setTimeout(() => setCopiedId(null), 1500)
  }

  const toggleInfo = (id: string) => {
    setInfoId(prev => prev === id ? null : id)
  }

  return (
    <div className="relative h-full flex flex-col" style={{ filter: visionFilter }}>
      {/* Swatches — full bleed, horizontal layout */}
      <div className="flex-1 flex flex-col min-h-0">
        {swatches.map((s) => {
          const textColor = readableOn(s.hex)
          const badge = getContrastBadge(s.hex)
          const isCopied = copiedId === s.id
          const showInfo = infoId === s.id
          return (
            <div
              key={s.id}
              className="flex-1 relative flex items-center justify-between"
              style={{ backgroundColor: s.hex, minHeight: 48, padding: '0 16px', transition: 'background-color 300ms ease' }}
            >
              {/* Left: hex code */}
              <button
                onClick={() => copyHex(s.id, s.hex)}
                className="flex items-center min-h-[44px]"
                aria-label={`Copy ${s.hex}`}
              >
                <span
                  className="text-[16px] font-bold font-mono tracking-wide"
                  style={{ color: textColor }}
                >
                  {isCopied ? 'Copied!' : s.hex.toUpperCase()}
                </span>
              </button>

              {/* Center-right: badge */}
              {badge.pass && (
                <span
                  className="text-[11px] font-bold px-2 py-0.5 shrink-0"
                  style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#ffffff', borderRadius: 6 }}
                >
                  {badge.level} {badge.ratio.toFixed(1)}:1
                </span>
              )}

              {/* Right: action buttons — [copy] [info] [lock] */}
              <div className="flex items-center shrink-0 ml-2" style={{ gap: 6 }}>
                <button
                  onClick={() => copyHex(s.id, s.hex)}
                  className="flex items-center justify-center transition-all"
                  style={{ width: 36, height: 36, padding: 0, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', minWidth: 44, minHeight: 44 }}
                  aria-label={isCopied ? 'Copied' : `Copy ${s.hex}`}
                >
                  {isCopied
                    ? <Check size={20} strokeWidth={1.5} style={{ color: textColor }} />
                    : <Copy size={20} strokeWidth={1.5} style={{ color: textColor }} />
                  }
                </button>
                <button
                  onClick={() => toggleInfo(s.id)}
                  className="flex items-center justify-center transition-all"
                  style={{ width: 36, height: 36, padding: 0, borderRadius: 8, backgroundColor: showInfo ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)', minWidth: 44, minHeight: 44 }}
                  aria-label="Color info"
                  aria-expanded={showInfo}
                >
                  <Info size={20} strokeWidth={1.5} style={{ color: textColor }} />
                </button>
                <button
                  onClick={() => onLock(s.id)}
                  className="flex items-center justify-center transition-all"
                  style={{ width: 36, height: 36, padding: 0, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', minWidth: 44, minHeight: 44 }}
                  aria-label={s.locked ? 'Unlock color' : 'Lock color'}
                >
                  {s.locked
                    ? <Lock size={20} strokeWidth={1.5} style={{ color: textColor }} />
                    : <Unlock size={20} strokeWidth={1.5} style={{ color: textColor }} />
                  }
                </button>
              </div>

              {/* Color info popover */}
              {showInfo && <ColorInfoPopover hex={s.hex} />}

              {/* Lock overlay */}
              {s.locked && (
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Dismiss info popover on tap outside */}
      {infoId && (
        <div className="fixed inset-0 z-30" onClick={() => setInfoId(null)} />
      )}

      {/* Save palette FAB — bottom left */}
      <button
        onClick={onSave}
        className="fixed left-4 flex items-center justify-center active:scale-95 transition-all z-40"
        style={{ bottom: `calc(68px + env(safe-area-inset-bottom, 16px) + 16px)`, width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)' }}
        aria-label="Save palette"
      >
        <Heart size={20} color="#ffffff" />
      </button>

      {/* Mini Generate FAB — always visible */}
      <button
        onClick={onGenerate}
        className="fixed right-4 flex items-center justify-center active:scale-95 transition-all z-40"
        style={{ bottom: `calc(68px + env(safe-area-inset-bottom, 16px) + 16px)`, width: 48, height: 48, borderRadius: 12, backgroundColor: BRAND_VIOLET, boxShadow: '0 4px 20px rgba(108,71,255,0.5)' }}
        aria-label="Generate new palette"
      >
        <RefreshCw size={20} strokeWidth={2.5} color="#fff" />
      </button>
    </div>
  )
}

// ─── Color Info Popover ────────────────────────────────────
function ColorInfoPopover({ hex }: { hex: string }) {
  const name = getColorName(hex)
  const { rgb, hsl } = getColorInfo(hex)

  return (
    <div
      className="absolute right-4 z-40 bg-white overflow-hidden"
      style={{ top: '50%', transform: 'translateY(-50%)', boxShadow: '0 8px 32px rgba(0,0,0,0.16)', minWidth: 200, borderRadius: 12 }}
      onClick={e => e.stopPropagation()}
      role="dialog"
      aria-label={`Color details for ${hex}`}
    >
      {/* Color preview strip */}
      <div style={{ height: 8, backgroundColor: hex }} />
      <div style={{ padding: '12px 16px' }}>
        <p className="text-[16px] font-bold m-0" style={{ color: '#1a1a2e' }}>{name}</p>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-[12px] font-medium" style={{ color: '#9CA3AF' }}>HEX</span>
            <span className="text-[14px] font-mono font-medium" style={{ color: '#1a1a2e' }}>{hex.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[12px] font-medium" style={{ color: '#9CA3AF' }}>RGB</span>
            <span className="text-[14px] font-mono font-medium" style={{ color: '#1a1a2e' }}>{rgb}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[12px] font-medium" style={{ color: '#9CA3AF' }}>HSL</span>
            <span className="text-[14px] font-mono font-medium" style={{ color: '#1a1a2e' }}>{hsl}</span>
          </div>
        </div>
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
      <div className="flex h-28 shrink-0 mx-3.5 overflow-hidden" style={{ filter, borderRadius: 12 }}>
        {swatches.map(s => (
          <div key={s.id} className="flex-1" style={{ backgroundColor: s.hex }} />
        ))}
      </div>

      {/* Vision options */}
      <div className="flex-1 overflow-y-auto mt-4 mx-3.5 bg-white" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
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
                minHeight: 48,
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
                    <span className="text-[10px] font-bold" style={{ background: BRAND_VIOLET, color: '#ffffff', padding: '2px 8px', borderRadius: 6 }}>
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
        className="fixed right-4 flex items-center justify-center active:scale-95 transition-all z-40"
        style={{ bottom: `calc(68px + env(safe-area-inset-bottom, 16px) + 16px)`, width: 48, height: 48, borderRadius: 12, backgroundColor: BRAND_VIOLET, boxShadow: '0 4px 20px rgba(108,71,255,0.5)' }}
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

  const cards: { name: string; locked: boolean; cta: string }[] = [
    { name: 'Landing Page', locked: false, cta: '' },
    { name: 'Dashboard', locked: !isPro, cta: 'Preview on dashboard' },
    { name: 'Mobile App', locked: !isPro, cta: 'Preview on mobile' },
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
            className="w-full bg-white overflow-hidden text-left active:scale-[0.98] transition-all"
            style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            {/* Gradient preview area */}
            <div
              className="relative"
              style={{
                height: 160,
                background: `linear-gradient(135deg, ${colors[0] ?? '#3A86FF'}, ${colors[1] ?? '#5E9EFF'}, ${colors[2] ?? '#8AB8FF'})`,
                opacity: card.locked ? 0.6 : 1,
              }}
            >
              {card.locked && (
                <div className="absolute top-3 right-3 text-[10px] font-bold" style={{ background: BRAND_VIOLET, color: '#fff', padding: '3px 10px', borderRadius: 6 }}>
                  PRO
                </div>
              )}
              {card.locked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  <Lock size={22} style={{ color: '#6C47FF' }} />
                  <span className="text-[12px] font-semibold" style={{ color: '#6C47FF' }}>{card.cta}</span>
                </div>
              )}
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <LayoutDashboard size={16} style={{ color: '#9CA3AF' }} />
              <span className="text-[14px] font-semibold" style={{ color: '#1a1a2e' }}>{card.name}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Mini Generate FAB */}
      <button
        onClick={onGenerate}
        className="fixed right-4 flex items-center justify-center active:scale-95 transition-all z-40"
        style={{ bottom: `calc(68px + env(safe-area-inset-bottom, 16px) + 16px)`, width: 48, height: 48, borderRadius: 12, backgroundColor: BRAND_VIOLET, boxShadow: '0 4px 20px rgba(108,71,255,0.5)' }}
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
  onGenerate: () => void
}

interface SavedPalette {
  id: string
  name: string
  colors: string[]
  created_at: string
}

function LibraryView({ user, isSignedIn, isPro, onSignIn, onProGate, onLoad, onGenerate }: LibraryViewProps) {
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

  // Signed out — conversion-focused
  if (!isSignedIn) {
    return (
      <div className="h-full relative flex flex-col items-center justify-center px-8 text-center">
        <div
          className="rounded-full flex items-center justify-center mb-5"
          style={{ width: 56, height: 56, backgroundColor: BRAND_VIOLET }}
        >
          <Heart size={28} color="#ffffff" />
        </div>
        <h2 className="text-[20px] font-bold" style={{ color: '#1a1a2e' }}>Your collection starts here</h2>
        <p className="text-[14px] mt-2 mb-6 max-w-[280px]" style={{ color: '#6B7280' }}>
          Save your favorites and export to Figma or Tailwind CSS. 3 free saves, unlimited with Pro.
        </p>
        <button
          onClick={onSignIn}
          className="w-full flex items-center justify-center gap-2.5 text-white text-[16px] font-bold active:scale-95 transition-all"
          style={{ height: 52, borderRadius: 12, backgroundColor: BRAND_VIOLET }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#8fa8ff"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#7ee6a1"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fdd663"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#f28b82"/>
          </svg>
          Continue with Google
        </button>
        <p className="text-[11px] mt-3" style={{ color: '#D1D5DB' }}>No credit card required</p>

        {/* Mini Generate FAB */}
        <button
          onClick={onGenerate}
          className="fixed right-4 flex items-center justify-center active:scale-95 transition-all z-40"
          style={{ bottom: `calc(68px + env(safe-area-inset-bottom, 16px) + 16px)`, width: 48, height: 48, borderRadius: 12, backgroundColor: BRAND_VIOLET, boxShadow: '0 4px 20px rgba(108,71,255,0.5)' }}
          aria-label="Generate new palette"
        >
          <RefreshCw size={20} strokeWidth={2.5} color="#fff" />
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

  const slotsText = isPro ? 'Unlimited saves' : `${palettes.length} of 3 free slots used`

  // Signed in, empty — with visual slot placeholders
  if (palettes.length === 0) {
    return (
      <div className="h-full relative flex flex-col items-center justify-center px-8 text-center">
        <h2 className="text-[20px] font-bold" style={{ color: '#1a1a2e' }}>No saved palettes yet</h2>
        <p className="text-[14px] mt-2 mb-6" style={{ color: '#6B7280' }}>
          Tap the heart on any palette to save it here
        </p>
        {/* Visual slot placeholders */}
        <div className="w-full max-w-[280px] space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center"
              style={{ height: 64, border: '2px dashed #E5E7EB', borderRadius: 12 }}
            >
              <span className="text-[12px]" style={{ color: '#D1D5DB' }}>
                {isPro ? 'Empty slot' : `Slot ${i + 1} of 3`}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[12px] mt-5" style={{ color: '#D1D5DB' }}>{slotsText}</p>

        {/* Mini Generate FAB */}
        <button
          onClick={onGenerate}
          className="fixed right-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all z-40"
          style={{ bottom: `calc(68px + env(safe-area-inset-bottom, 16px) + 16px)`, backgroundColor: BRAND_VIOLET }}
          aria-label="Generate new palette"
        >
          <RefreshCw size={20} strokeWidth={2.5} color="#fff" />
        </button>
      </div>
    )
  }

  // Relative time helper
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

  // Free tier slot count
  const freeSlotCount = isPro ? 0 : 3

  // Signed in, has palettes
  return (
    <div className="h-full relative overflow-y-auto px-3.5 pb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[16px] font-bold" style={{ color: '#1a1a2e' }}>My Palettes</h2>
        <span className="text-[11px]" style={{ color: '#9CA3AF' }}>{slotsText}</span>
      </div>
      <div className="space-y-2.5">
        {palettes.map(p => (
          <div key={p.id} className="bg-white overflow-hidden" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
            <button
              onClick={() => onLoad(p.colors)}
              className="w-full flex h-16 overflow-hidden"
              style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
            >
              {p.colors.map((c, i) => (
                <div key={i} className="flex-1" style={{ backgroundColor: c }} />
              ))}
            </button>
            <div className="flex items-center justify-between px-3 py-2">
              <div>
                <span className="text-[13px] font-semibold block" style={{ color: '#1a1a2e' }}>{p.name}</span>
                <span className="text-[10px]" style={{ color: '#D1D5DB' }}>
                  Saved {timeAgo(p.created_at)}
                </span>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors"
                style={{ minWidth: 44, minHeight: 44 }}
                aria-label={`Delete ${p.name}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        ))}

        {/* Free tier: empty slot placeholders */}
        {!isPro && Array.from({ length: Math.max(0, freeSlotCount - palettes.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="h-16 flex items-center justify-center"
            style={{ borderRadius: 12, border: '2px dashed #E5E7EB' }}
          >
            <span className="text-[12px]" style={{ color: '#D1D5DB' }}>Empty slot</span>
          </div>
        ))}

        {/* Pro upsell when all free slots full */}
        {!isPro && palettes.length >= freeSlotCount && (
          <button
            onClick={onProGate}
            className="w-full h-16 flex items-center justify-center text-white text-[13px] font-semibold active:scale-95 transition-all"
            style={{ borderRadius: 12, background: `linear-gradient(135deg, ${BRAND_VIOLET}, #9b82ff)` }}
          >
            Go Pro for unlimited saves
          </button>
        )}
      </div>

      {/* Mini Generate FAB */}
      <button
        onClick={onGenerate}
        className="fixed right-4 flex items-center justify-center active:scale-95 transition-all z-40"
        style={{ bottom: `calc(68px + env(safe-area-inset-bottom, 16px) + 16px)`, width: 48, height: 48, borderRadius: 12, backgroundColor: BRAND_VIOLET, boxShadow: '0 4px 20px rgba(108,71,255,0.5)' }}
        aria-label="Generate new palette"
      >
        <RefreshCw size={20} strokeWidth={2.5} color="#fff" />
      </button>
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
  onGenerate: () => void
}

function ProfileView({ user, isSignedIn, isPro, onSignIn, onSignOut, onProGate, onManageSubscription, onGenerate }: ProfileViewProps) {
  const [accountOpen, setAccountOpen] = useState(false)
  const [legalOpen, setLegalOpen] = useState(false)

  // Signed out — premium welcome page
  if (!isSignedIn) {
    return (
      <div className="h-full relative overflow-y-auto px-5 pb-8">
        <div className="pt-4 mb-6">
          <h2 className="text-[24px] font-bold" style={{ color: '#1a1a2e' }}>Welcome to Paletta</h2>
          <p className="text-[14px] mt-1" style={{ color: '#6B7280' }}>The color palette generator built for accessibility</p>
        </div>

        <button
          onClick={onSignIn}
          className="w-full flex items-center justify-center gap-2.5 text-white text-[16px] font-bold active:scale-95 transition-all mb-6"
          style={{ height: 52, borderRadius: 12, backgroundColor: BRAND_VIOLET }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#8fa8ff"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#7ee6a1"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fdd663"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#f28b82"/>
          </svg>
          Continue with Google
        </button>

        {/* Pro features card */}
        <div className="overflow-hidden mb-6" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
          {[
            { icon: Sparkles, title: 'Unlimited AI palettes' },
            { icon: Eye, title: 'All 5 vision simulations' },
            { icon: Heart, title: 'Unlimited saves + export' },
          ].map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="flex items-center justify-between px-4"
                style={{ minHeight: 52, borderTop: i > 0 ? '1px solid #F3F4F6' : undefined }}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} style={{ color: BRAND_VIOLET }} />
                  <span className="text-[14px] font-semibold" style={{ color: '#1a1a2e' }}>{f.title}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5" style={{ backgroundColor: BRAND_VIOLET, color: '#ffffff', borderRadius: 6 }}>
                  PRO
                </span>
              </div>
            )
          })}
        </div>

        {/* Legal section */}
        <div className="mt-4">
          <div className="border-t border-gray-200 pt-4 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: '#D1D5DB' }}>Legal</span>
          </div>
          <div className="flex flex-col">
            <Link to="/privacy-policy" className="text-[14px] font-medium no-underline flex items-center active:bg-gray-50 transition-colors" style={{ color: '#1a1a2e', minHeight: 52 }}>Privacy Policy</Link>
            <Link to="/terms-of-service" className="text-[14px] font-medium no-underline flex items-center active:bg-gray-50 transition-colors border-t border-gray-100" style={{ color: '#1a1a2e', minHeight: 52 }}>Terms of Service</Link>
            <a href="mailto:hello@usepaletta.io" className="text-[14px] font-medium no-underline flex items-center active:bg-gray-50 transition-colors border-t border-gray-100" style={{ color: '#1a1a2e', minHeight: 52 }}>Contact</a>
          </div>
        </div>

        {/* Mini Generate FAB */}
        <button
          onClick={onGenerate}
          className="fixed right-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all z-40"
          style={{ bottom: `calc(68px + env(safe-area-inset-bottom, 16px) + 16px)`, backgroundColor: BRAND_VIOLET }}
          aria-label="Generate new palette"
        >
          <RefreshCw size={20} strokeWidth={2.5} color="#fff" />
        </button>
      </div>
    )
  }

  // Signed in
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="h-full relative overflow-y-auto px-5 pb-8">
      {/* Avatar + info — 64px avatar */}
      <div className="flex items-center gap-4 pt-4 mb-5">
        <div
          className="rounded-full flex items-center justify-center text-white text-[20px] font-bold shrink-0"
          style={{ width: 48, height: 48, background: `linear-gradient(135deg, ${BRAND_VIOLET}, #9b82ff)` }}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-bold truncate" style={{ color: '#1a1a2e' }}>{name}</span>
            {isPro && (
              <span className="shrink-0 text-[10px] font-bold text-white px-3 py-1" style={{ backgroundColor: BRAND_VIOLET, borderRadius: 6 }}>
                PRO
              </span>
            )}
          </div>
          {user?.email && <span className="text-[13px] block truncate mt-0.5" style={{ color: '#9CA3AF' }}>{user.email}</span>}
          {!isPro && <span className="text-[12px] block mt-0.5" style={{ color: '#D1D5DB' }}>Free plan</span>}
        </div>
      </div>

      {/* Upgrade button */}
      {!isPro && (
        <button
          onClick={onProGate}
          className="w-full text-white text-[14px] font-semibold active:scale-95 transition-all mb-5 flex items-center justify-between px-5"
          style={{ height: 48, borderRadius: 12, backgroundColor: BRAND_VIOLET }}
        >
          <span>Upgrade to Pro</span>
          <span className="text-[13px] opacity-80">$5/mo</span>
        </button>
      )}

      {/* Account accordion — 52px row targets */}
      <div className="overflow-hidden mb-3" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
        <button
          onClick={() => setAccountOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 active:bg-gray-50 transition-colors"
          style={{ minHeight: 52 }}
        >
          <span className="text-[15px] font-semibold" style={{ color: '#1a1a2e' }}>Account</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"
            style={{ transform: accountOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div
          className="border-t border-gray-100 overflow-hidden transition-all duration-200"
          style={{ maxHeight: accountOpen ? 200 : 0, opacity: accountOpen ? 1 : 0 }}
        >
          {isPro && (
            <button
              onClick={onManageSubscription}
              className="w-full text-left px-4 text-[14px] font-medium active:bg-gray-50 transition-colors"
              style={{ color: '#1a1a2e', minHeight: 52 }}
            >
              Manage subscription
            </button>
          )}
          <button
            onClick={onSignOut}
            className="w-full text-left px-4 text-[14px] font-medium active:bg-gray-50 transition-colors"
            style={{ color: '#EF4444', minHeight: 52 }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Legal accordion — 52px row targets */}
      <div className="overflow-hidden mb-3" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
        <button
          onClick={() => setLegalOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 active:bg-gray-50 transition-colors"
          style={{ minHeight: 52 }}
        >
          <span className="text-[15px] font-semibold" style={{ color: '#1a1a2e' }}>Legal</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"
            style={{ transform: legalOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div
          className="border-t border-gray-100 flex flex-col overflow-hidden transition-all duration-200"
          style={{ maxHeight: legalOpen ? 300 : 0, opacity: legalOpen ? 1 : 0 }}
        >
          <Link to="/privacy-policy" className="px-4 text-[14px] font-medium no-underline active:bg-gray-50 flex items-center" style={{ color: '#1a1a2e', minHeight: 52 }}>Privacy Policy</Link>
          <Link to="/terms-of-service" className="px-4 text-[14px] font-medium no-underline active:bg-gray-50 flex items-center border-t border-gray-100" style={{ color: '#1a1a2e', minHeight: 52 }}>Terms of Service</Link>
          <Link to="/cookie-policy" className="px-4 text-[14px] font-medium no-underline active:bg-gray-50 flex items-center border-t border-gray-100" style={{ color: '#1a1a2e', minHeight: 52 }}>Cookie Policy</Link>
        </div>
      </div>

      {/* Support — 52px row */}
      <div className="overflow-hidden" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
        <a
          href="mailto:hello@usepaletta.io"
          className="flex items-center justify-between px-4 no-underline active:bg-gray-50 transition-colors"
          style={{ minHeight: 52 }}
        >
          <span className="text-[15px] font-semibold" style={{ color: '#1a1a2e' }}>Support</span>
          <span className="text-[12px]" style={{ color: '#9CA3AF' }}>hello@usepaletta.io</span>
        </a>
      </div>

      {/* Mini Generate FAB */}
      <button
        onClick={onGenerate}
        className="fixed right-4 flex items-center justify-center active:scale-95 transition-all z-40"
        style={{ bottom: `calc(68px + env(safe-area-inset-bottom, 16px) + 16px)`, width: 48, height: 48, borderRadius: 12, backgroundColor: BRAND_VIOLET, boxShadow: '0 4px 20px rgba(108,71,255,0.5)' }}
        aria-label="Generate new palette"
      >
        <RefreshCw size={20} strokeWidth={2.5} color="#fff" />
      </button>
    </div>
  )
}
