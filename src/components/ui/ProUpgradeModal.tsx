import { useCallback, useEffect, useRef, useState } from 'react'
import { Sparkles, Image, Eye, Heart, Layers, Download, LayoutGrid } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { createCheckoutSession } from '../../lib/stripe'
import { usePaletteStore } from '../../store/paletteStore'
import { showToast } from '../../utils/toast'

const PENDING_PLAN_KEY = 'paletta_pending_checkout_plan'
const PRIMARY = '#6C47FF'
const PRIMARY_END = '#8B6FFF'
const FALLBACK_COLORS = ['#6C47FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

const PRO_FEATURES: { Icon: LucideIcon; bg: string; color: string; text: string }[] = [
  { Icon: Sparkles,   bg: 'bg-purple-50',  color: 'text-purple-500', text: 'AI palette from text prompt' },
  { Icon: LayoutGrid, bg: 'bg-indigo-50',  color: 'text-indigo-500', text: '6, 7 & 8 color palettes' },
  { Icon: Heart,      bg: 'bg-pink-50',    color: 'text-pink-500',   text: 'Save unlimited palettes' },
  { Icon: Image,      bg: 'bg-blue-50',    color: 'text-blue-500',   text: 'Image → palette extraction' },
  { Icon: Eye,        bg: 'bg-teal-50',    color: 'text-teal-500',   text: 'Color blindness preview' },
  { Icon: Layers,     bg: 'bg-orange-50',  color: 'text-orange-500', text: 'Full shade scales (50–900)' },
  { Icon: Download,   bg: 'bg-green-50',   color: 'text-green-500',  text: 'Export without watermark' },
]

const TABS = ['Landing Page', 'Dashboard', 'Mobile App'] as const
type MockupTab = (typeof TABS)[number]

const TAB_CAPTIONS: Record<MockupTab, string> = {
  'Landing Page': 'Your colors in a real landing page →',
  'Dashboard': 'Your colors in a real dashboard →',
  'Mobile App': 'Your colors in a real mobile app →',
}

const AVATARS = [
  { letter: 'A', bg: '#6C47FF' },
  { letter: 'J', bg: '#3B82F6' },
  { letter: 'S', bg: '#10B981' },
  { letter: 'M', bg: '#F59E0B' },
  { letter: 'L', bg: '#EF4444' },
]

/* ------------------------------------------------------------------ */
/*  Miniature product mockups                                         */
/* ------------------------------------------------------------------ */

function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200/60" style={{ background: '#fff' }}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        </div>
        <div className="flex-1 mx-2 h-5 rounded bg-gray-100 flex items-center justify-center">
          <span className="text-[9px] text-gray-400 font-medium">yourproduct.com</span>
        </div>
      </div>
      {/* Content */}
      <div className="relative overflow-hidden" style={{ minHeight: 200 }}>
        {children}
      </div>
    </div>
  )
}

function LandingMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <BrowserChrome>
      <div className="p-3">
        {/* Nav */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded" style={{ background: c[0] }} />
            <div className="w-12 h-2 rounded bg-gray-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded bg-gray-100" />
            <div className="w-8 h-2 rounded bg-gray-100" />
            <div className="px-2 py-1 rounded text-[7px] text-white font-medium" style={{ background: c[0] }}>Get Started</div>
          </div>
        </div>
        {/* Hero */}
        <div className="text-center mb-4 py-2">
          <div className="w-3/4 h-3 rounded bg-gray-800 mx-auto mb-2" />
          <div className="w-1/2 h-2 rounded bg-gray-200 mx-auto mb-3" />
          <div className="flex justify-center gap-2">
            <div className="px-3 py-1.5 rounded-md text-[7px] text-white font-medium" style={{ background: c[0] }}>Get Started</div>
            <div className="px-3 py-1.5 rounded-md text-[7px] font-medium border" style={{ borderColor: c[1], color: c[1] }}>Learn More</div>
          </div>
        </div>
        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-lg border border-gray-100 p-2">
              <div className="w-6 h-6 rounded-md mb-1.5" style={{ background: `linear-gradient(135deg, ${c[i % c.length]}, ${c[(i + 1) % c.length]})` }} />
              <div className="w-full h-1.5 rounded bg-gray-200 mb-1" />
              <div className="w-3/4 h-1 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </BrowserChrome>
  )
}

function DashboardMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <BrowserChrome>
      <div className="flex" style={{ minHeight: 200 }}>
        {/* Sidebar */}
        <div className="w-12 shrink-0 py-2 px-1.5 flex flex-col gap-2" style={{ background: c[0] }}>
          <div className="w-full h-5 rounded bg-white/20" />
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="w-full h-3 rounded bg-white/10" />
          ))}
        </div>
        {/* Main */}
        <div className="flex-1 p-2.5">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="w-16 h-2.5 rounded bg-gray-200" />
            <div className="px-2 py-1 rounded text-[7px] text-white font-medium" style={{ background: c[0] }}>Action</div>
          </div>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-lg border border-gray-100 p-2">
                <div className="w-5 h-5 rounded-md mb-1" style={{ background: c[i % c.length] + '22', border: `1px solid ${c[i % c.length]}33` }}>
                  <div className="w-2.5 h-2.5 rounded m-[3px]" style={{ background: c[i % c.length] }} />
                </div>
                <div className="w-8 h-2 rounded bg-gray-800 mb-0.5" />
                <div className="w-5 h-1 rounded bg-gray-200" />
              </div>
            ))}
          </div>
          {/* Chart */}
          <div className="rounded-lg border border-gray-100 p-2">
            <div className="w-10 h-1.5 rounded bg-gray-200 mb-2" />
            <div className="flex items-end gap-1 h-12">
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.3, 0.75].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h * 100}%`,
                    background: `linear-gradient(180deg, ${c[i % c.length]}, ${c[(i + 1) % c.length]}88)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}

function MobileAppMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <div className="mx-auto" style={{ width: 160 }}>
      <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200" style={{ background: '#fff' }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1" style={{ background: c[0] }}>
          <span className="text-[7px] text-white/80 font-medium">9:41</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
          </div>
        </div>
        {/* Header */}
        <div className="px-3 py-2.5" style={{ background: c[0] }}>
          <div className="w-16 h-2 rounded bg-white/90 mb-1" />
          <div className="w-10 h-1 rounded bg-white/40" />
        </div>
        {/* Card */}
        <div className="px-3 py-2">
          <div className="rounded-lg border border-gray-100 p-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full shrink-0" style={{ background: `linear-gradient(135deg, ${c[0]}, ${c[1]})` }} />
            <div className="flex-1">
              <div className="w-12 h-1.5 rounded bg-gray-300 mb-1" />
              <div className="w-8 h-1 rounded bg-gray-200" />
            </div>
          </div>
        </div>
        {/* List items */}
        <div className="px-3 pb-2 space-y-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-2 py-1">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c[i % c.length] }} />
              <div className="flex-1">
                <div className="w-full h-1.5 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
        {/* Bottom tab bar */}
        <div className="flex items-center justify-around py-2 border-t border-gray-100">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div
                className="w-3 h-3 rounded"
                style={{ background: i === 0 ? c[0] : '#D1D5DB' }}
              />
              <div className="w-4 h-0.5 rounded" style={{ background: i === 0 ? c[0] : '#E5E7EB' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main modal                                                        */
/* ------------------------------------------------------------------ */

interface ProUpgradeModalProps {
  open: boolean
  onClose: () => void
}

export default function ProUpgradeModal({ open, onClose }: ProUpgradeModalProps) {
  const { user, signInWithGoogle } = useAuth()
  const swatches = usePaletteStore(s => s.swatches)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [activeTab, setActiveTab] = useState<MockupTab>('Landing Page')
  const [fade, setFade] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const modalRef = useRef<HTMLDivElement>(null)

  const colors = swatches.length >= 3
    ? swatches.slice(0, 5).map(s => s.hex)
    : FALLBACK_COLORS

  // Auto-rotate tabs
  useEffect(() => {
    if (!open) return
    timerRef.current = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setActiveTab(prev => {
          const idx = TABS.indexOf(prev)
          return TABS[(idx + 1) % TABS.length]
        })
        setFade(true)
      }, 200)
    }, 3000)
    return () => clearInterval(timerRef.current)
  }, [open])

  // Focus trap
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const handleTabClick = useCallback((tab: MockupTab) => {
    clearInterval(timerRef.current)
    setFade(false)
    setTimeout(() => {
      setActiveTab(tab)
      setFade(true)
    }, 150)
  }, [])

  if (!open) return null

  const isMonthly = plan === 'monthly'

  // Preserved exactly from previous implementation
  const handleSubscribe = async () => {
    if (!user) {
      localStorage.setItem(PENDING_PLAN_KEY, plan)
      onClose()
      signInWithGoogle()
      return
    }

    setLoading(true)
    try {
      const url = await createCheckoutSession(plan, user.id, user.email ?? undefined)
      window.location.href = url
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Checkout failed'
      showToast(msg)
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch md:items-center md:justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-modal-title"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal container */}
      <div
        ref={modalRef}
        className="relative w-full h-full md:h-auto md:w-[92vw] md:max-w-[1060px] md:max-h-[92vh] bg-white md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        {/* ============ LEFT PANEL ============ */}
        <div
          className="flex-1 flex flex-col min-h-0 relative overflow-y-auto"
          style={{ background: '#FAFAF8' }}
        >
          {/* Subtle violet gradient at top */}
          <div
            className="absolute inset-x-0 top-0 h-40 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(108,71,255,0.04) 0%, transparent 100%)' }}
          />

          <div className="relative flex-1 flex flex-col px-6 md:px-8 py-6 md:py-8">
            {/* Badge */}
            <div className="mb-4">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-white uppercase"
                style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_END})`, letterSpacing: '0.08em' }}
              >
                ✦ Paletta Pro
              </span>
            </div>

            {/* Headline */}
            <h2
              id="pro-modal-title"
              className="text-[28px] md:text-[32px] font-bold leading-tight mb-1.5"
              style={{ color: '#1a1a2e', letterSpacing: '-0.02em' }}
            >
              See your colors in real&nbsp;products
            </h2>
            <p className="text-[14px] mb-5" style={{ color: '#9CA3AF' }}>
              Cancel anytime. No commitments.
            </p>

            {/* Feature list — scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto mb-5 -mx-1 px-1">
              {PRO_FEATURES.map(({ Icon, bg, color, text }, i) => (
                <div
                  key={text}
                  className="flex items-center gap-3 py-2.5"
                  style={i < PRO_FEATURES.length - 1 ? { borderBottom: '1px solid #F3F4F6' } : undefined}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon size={16} className={color} />
                  </div>
                  <span className="text-[14px] font-medium" style={{ color: '#374151' }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Pricing section — pinned at bottom */}
            <div className="shrink-0">
              {/* Toggle */}
              <div className="flex items-center justify-center mb-3">
                <div className="inline-flex rounded-full p-0.5" style={{ background: '#F3F4F6' }}>
                  <button
                    onClick={() => setPlan('monthly')}
                    className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all"
                    style={isMonthly ? { background: PRIMARY, color: '#fff' } : { color: '#6B7280' }}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setPlan('yearly')}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all"
                    style={!isMonthly ? { background: PRIMARY, color: '#fff' } : { color: '#6B7280' }}
                  >
                    Yearly
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={!isMonthly
                        ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                        : { background: '#FEF3C7', color: '#D97706' }}
                    >
                      Save 25%
                    </span>
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="text-center mb-4">
                <span className="text-[44px] font-extrabold leading-none" style={{ color: '#1a1a2e' }}>
                  {isMonthly ? '$5' : '$3.75'}
                </span>
                <span className="text-[16px] font-medium ml-1" style={{ color: '#9CA3AF' }}>/mo</span>
                {!isMonthly && (
                  <p className="text-[12px] mt-1" style={{ color: '#9CA3AF' }}>Billed as $45/year</p>
                )}
              </div>

              {/* Subscribe CTA */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full text-white text-[15px] font-semibold transition-all disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_END})`,
                  padding: '15px',
                  borderRadius: 14,
                  boxShadow: '0 4px 14px rgba(108,71,255,0.25)',
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(108,71,255,0.35)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(108,71,255,0.25)'
                }}
              >
                {loading ? 'Redirecting…' : `Subscribe — ${isMonthly ? '$5/mo' : '$45/yr'}`}
              </button>

              {/* Footer row */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-[12px]" style={{ color: '#D1D5DB' }}>Launch pricing · Stripe</span>
                <button
                  onClick={onClose}
                  className="text-[13px] font-medium transition-colors hover:text-gray-700"
                  style={{ color: '#9CA3AF' }}
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============ RIGHT PANEL (desktop only) ============ */}
        <div
          className="hidden md:flex flex-col w-[50%] shrink-0 relative overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #f5f3ff 0%, #ede9fe 50%, #f0edff 100%)' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(0,0,0,0.06)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)' }}
            aria-label="Close upgrade modal"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex-1 flex flex-col px-6 py-6">
            {/* LIVE PREVIEW badge + subtitle */}
            <div className="flex items-center gap-2.5 mb-4">
              <span
                className="text-[10px] font-bold text-white uppercase px-2.5 py-1 rounded-md"
                style={{ background: '#1a1a2e', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', letterSpacing: '0.05em' }}
              >
                Live Preview
              </span>
              <span
                className="text-[10px] font-semibold uppercase"
                style={{ color: '#374151', letterSpacing: '0.1em' }}
              >
                Your palette in action
              </span>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                  style={
                    activeTab === tab
                      ? { background: PRIMARY, color: '#fff' }
                      : { background: 'rgba(108,71,255,0.06)', color: '#9CA3AF' }
                  }
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Mockup area */}
            <div
              className="flex-1 flex items-center justify-center transition-all duration-200"
              style={{ opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(6px)' }}
            >
              {activeTab === 'Landing Page' && <LandingMockup colors={colors} />}
              {activeTab === 'Dashboard' && <DashboardMockup colors={colors} />}
              {activeTab === 'Mobile App' && <MobileAppMockup colors={colors} />}
            </div>

            {/* Caption */}
            <p className="text-[11px] font-medium text-center mt-3" style={{ color: PRIMARY }}>
              {TAB_CAPTIONS[activeTab]}
            </p>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-2.5 mt-5">
              <div className="flex">
                {AVATARS.map(({ letter, bg }, i) => (
                  <div
                    key={letter}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                    style={{
                      background: bg,
                      border: '2.5px solid #fff',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                      marginLeft: i > 0 ? -10 : 0,
                      zIndex: AVATARS.length - i,
                      position: 'relative',
                    }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <span className="text-[13px] font-medium" style={{ color: '#6B7280' }}>
                Used and trusted by Pro&nbsp;designers
              </span>
            </div>
          </div>
        </div>

        {/* Mobile close button (shown only on mobile where right panel is hidden) */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/5"
          aria-label="Close upgrade modal"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
