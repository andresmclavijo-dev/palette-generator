import { useCallback, useEffect, useRef, useState } from 'react'
import { Sparkles, Image, Eye, Heart, Layers, Download, LayoutGrid } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { createCheckoutSession } from '../../lib/stripe'
import { showToast } from '../../utils/toast'
import { analytics } from '../../lib/posthog'

const PENDING_PLAN_KEY = 'paletta_pending_checkout'
const PRIMARY = '#6C47FF'
const PRIMARY_END = '#8B6FFF'

const PRO_FEATURES: { Icon: LucideIcon; bg: string; color: string; text: string }[] = [
  { Icon: Sparkles,   bg: 'bg-purple-50',  color: 'text-purple-500', text: 'AI palette from text prompt' },
  { Icon: LayoutGrid, bg: 'bg-indigo-50',  color: 'text-indigo-500', text: '6, 7 & 8 color palettes' },
  { Icon: Heart,      bg: 'bg-pink-50',    color: 'text-pink-500',   text: 'Save unlimited palettes' },
  { Icon: Image,      bg: 'bg-blue-50',    color: 'text-blue-500',   text: 'Image → palette extraction' },
  { Icon: Eye,        bg: 'bg-teal-50',    color: 'text-teal-500',   text: 'Color blindness preview' },
  { Icon: Layers,     bg: 'bg-orange-50',  color: 'text-orange-500', text: 'Full shade scales (50–900)' },
  { Icon: Download,   bg: 'bg-green-50',   color: 'text-green-500',  text: 'Export without watermark' },
]

interface ProUpgradeModalProps {
  open: boolean
  onClose: () => void
}

export default function ProUpgradeModal({ open, onClose }: ProUpgradeModalProps) {
  const { user, signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [showFade, setShowFade] = useState(true)
  const modalRef = useRef<HTMLDivElement>(null)
  const featureListRef = useRef<HTMLDivElement>(null)

  const handleDismiss = useCallback(() => {
    analytics.track('pro_modal_dismissed')
    onClose()
  }, [onClose])

  // Check if feature list is scrolled to bottom
  const checkScrollEnd = useCallback(() => {
    const el = featureListRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 4
    setShowFade(!atBottom)
  }, [])

  // One-time scroll bounce + initial fade check on mount
  useEffect(() => {
    if (!open) return
    const el = featureListRef.current
    if (!el) return

    requestAnimationFrame(() => {
      checkScrollEnd()
      if (el.scrollHeight <= el.clientHeight) return
      el.scrollTo({ top: 20, behavior: 'smooth' })
      setTimeout(() => el.scrollTo({ top: 0, behavior: 'smooth' }), 400)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Escape to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, handleDismiss])

  // Focus trap
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    modalRef.current?.focus()
    return () => { prev?.focus() }
  }, [open])

  if (!open) return null

  const isMonthly = plan === 'monthly'

  const handleSubscribe = async () => {
    const price = plan === 'monthly' ? 5 : 45
    analytics.track('pro_modal_subscribe_clicked', { plan, price })
    if (!user) {
      localStorage.setItem(PENDING_PLAN_KEY, plan)
      onClose()
      const { error } = await signInWithGoogle()
      if (error) {
        localStorage.removeItem(PENDING_PLAN_KEY)
        showToast('Sign-in failed — please try again')
      }
      return
    }

    setLoading(true)
    try {
      const url = await createCheckoutSession(plan, user.id, user.email ?? undefined)
      window.location.href = url
    } catch {
      showToast('Something went wrong — please try again')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch md:items-center md:justify-center"
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-modal-title"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal container — single column */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full h-full md:h-[min(92vh,680px)] md:w-[480px] bg-white md:rounded-2xl shadow-2xl overflow-hidden flex flex-col outline-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/5 hover:bg-black/10 transition-colors"
          aria-label="Close upgrade modal"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div
          className="flex-1 flex flex-col min-h-0 relative overflow-hidden"
          style={{ background: '#FAFAF8' }}
        >
          {/* Subtle violet gradient at top */}
          <div
            className="absolute inset-x-0 top-0 h-40 pointer-events-none z-[1]"
            style={{ background: 'linear-gradient(180deg, rgba(108,71,255,0.04) 0%, transparent 100%)' }}
          />

          <div className="relative flex-1 flex flex-col min-h-0 px-6 py-6">
            {/* Badge */}
            <div className="mb-3 shrink-0">
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
              className="text-[26px] md:text-[30px] font-bold leading-tight mb-1 shrink-0"
              style={{ color: '#1a1a2e', letterSpacing: '-0.02em' }}
            >
              Unlock the full toolkit
            </h2>
            <p className="text-[14px] mb-4 shrink-0" style={{ color: '#9CA3AF' }}>
              Cancel anytime. No commitments.
            </p>

            {/* Feature list — scrollable with bottom fade hint */}
            <div className="relative min-h-0 overflow-hidden mb-4" style={{ flex: '1 1 0%' }}>
              <div
                ref={featureListRef}
                className="overflow-y-auto -mx-1 px-1 pb-6"
                style={{ maxHeight: '100%' }}
                onScroll={checkScrollEnd}
              >
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
              {/* Fade gradient — hidden when scrolled to bottom */}
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none transition-opacity duration-200 z-[2]"
                style={{
                  height: 40,
                  background: 'linear-gradient(to bottom, transparent, #FAFAF8)',
                  opacity: showFade ? 1 : 0,
                }}
              />
            </div>

            {/* Pricing section — compact: toggle + price inline, then CTA */}
            <div className="shrink-0">
              {/* Toggle + price row */}
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex rounded-full p-0.5" style={{ background: '#F3F4F6' }}>
                  <button
                    onClick={() => { setPlan('monthly'); analytics.track('pro_modal_plan_toggle', { selected_plan: 'monthly' }) }}
                    className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all"
                    style={isMonthly ? { background: PRIMARY, color: '#fff' } : { color: '#6B7280' }}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => { setPlan('yearly'); analytics.track('pro_modal_plan_toggle', { selected_plan: 'yearly' }) }}
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
                <div className="text-right">
                  <span className="text-[28px] font-extrabold leading-none" style={{ color: '#1a1a2e' }}>
                    {isMonthly ? '$5' : '$3.75'}
                  </span>
                  <span className="text-[13px] font-medium ml-0.5" style={{ color: '#9CA3AF' }}>/mo</span>
                  {!isMonthly && (
                    <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>Billed $45/yr</p>
                  )}
                </div>
              </div>

              {/* Subscribe CTA */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full text-white text-[15px] font-semibold transition-all disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_END})`,
                  padding: '14px',
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
                  onClick={handleDismiss}
                  className="text-[13px] font-medium transition-colors hover:text-gray-700"
                  style={{ color: '#9CA3AF' }}
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
