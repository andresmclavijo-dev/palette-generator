import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createCheckoutSession } from '@/lib/stripe'
import { showToast } from '@/utils/toast'
import { analytics } from '@/lib/posthog'

const PENDING_PLAN_KEY = 'paletta_pending_checkout'
const PRIMARY = '#6C47FF'

const PRO_FEATURES: { bold: string; rest: string }[] = [
  { bold: 'AI palette', rest: ' from text prompt' },
  { bold: '6, 7 & 8', rest: ' color palettes' },
  { bold: 'Unlimited', rest: ' saved palettes' },
  { bold: 'Image \u2192', rest: ' palette extraction' },
  { bold: 'Color blindness', rest: ' preview' },
  { bold: 'Full shade scales', rest: ' (50\u2013900)' },
  { bold: 'Export', rest: ' without watermark' },
]

const SHADE_COLORS = [
  '#F5F3FF', '#EDE9FE', '#DDD6FE', '#C4B5FD', '#A78BFA',
  '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6',
]

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface ProUpgradeModalProps {
  open: boolean
  onClose: () => void
  paletteColors?: string[]
}

export function ProUpgradeModal({ open, onClose, paletteColors }: ProUpgradeModalProps) {
  const { user, signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')
  const modalRef = useRef<HTMLDivElement>(null)

  const handleDismiss = useCallback(() => {
    analytics.track('pro_modal_dismissed')
    onClose()
  }, [onClose])

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
  const colors = paletteColors?.length ? paletteColors : ['#6C47FF', '#FF6B6B', '#4ECDC4', '#FFE66D', '#2D6A4F']

  const handleSubscribe = async () => {
    const price = plan === 'monthly' ? 5 : 45
    analytics.track('pro_modal_subscribe_clicked', { plan, price })
    if (!user) {
      localStorage.setItem(PENDING_PLAN_KEY, plan)
      onClose()
      const { error } = await signInWithGoogle()
      if (error) {
        localStorage.removeItem(PENDING_PLAN_KEY)
        showToast('Sign-in failed \u2014 please try again')
      }
      return
    }

    setLoading(true)
    try {
      const url = await createCheckoutSession(plan, user.id, user.email ?? undefined)
      window.location.href = url
    } catch {
      showToast('Something went wrong \u2014 please try again')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={handleDismiss}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal card — two column */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative flex w-full bg-white shadow-2xl outline-none pro-modal-enter"
        style={{ maxWidth: 720, borderRadius: 16, overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pro-modal-title"
      >
        {/* ─── Left Column ─── */}
        <div className="flex-1 flex flex-col" style={{ padding: 32 }}>
          {/* Badge */}
          <span
            className="inline-flex items-center self-start text-[10px] font-bold text-white uppercase"
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              backgroundColor: PRIMARY,
              letterSpacing: '0.08em',
              marginBottom: 16,
            }}
          >
            ✦ Paletta Pro
          </span>

          {/* Headline */}
          <h2
            id="pro-modal-title"
            className="m-0"
            style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            Unlock the full toolkit
          </h2>
          <p className="m-0 mt-1" style={{ fontSize: 13, color: '#9CA3AF' }}>
            Everything you need to ship palettes faster. Cancel anytime.
          </p>

          {/* Feature list */}
          <div className="flex flex-col" style={{ gap: 10, marginTop: 20 }}>
            {PRO_FEATURES.map(f => (
              <div key={f.bold} className="flex items-center" style={{ gap: 10 }}>
                <CheckIcon />
                <span style={{ fontSize: 13.5, color: '#374151' }}>
                  <strong>{f.bold}</strong>{f.rest}
                </span>
              </div>
            ))}
          </div>

          {/* Spacer */}
          <div style={{ flex: '1 1 0%', minHeight: 20 }} />

          {/* Pricing row */}
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            {/* Segmented toggle */}
            <div className="inline-flex" style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 3, gap: 3 }}>
              <button
                onClick={() => { setPlan('monthly'); analytics.track('pro_modal_plan_toggle', { selected_plan: 'monthly' }) }}
                className="text-[13px] font-medium transition-all"
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  backgroundColor: isMonthly ? '#fff' : 'transparent',
                  boxShadow: isMonthly ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
                  color: isMonthly ? '#1a1a2e' : '#6B7280',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => { setPlan('yearly'); analytics.track('pro_modal_plan_toggle', { selected_plan: 'yearly' }) }}
                className="flex items-center gap-1.5 text-[13px] font-medium transition-all"
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  backgroundColor: !isMonthly ? '#fff' : 'transparent',
                  boxShadow: !isMonthly ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
                  color: !isMonthly ? '#1a1a2e' : '#6B7280',
                }}
              >
                Yearly
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5"
                  style={{ borderRadius: 4, backgroundColor: '#DCFCE7', color: '#16A34A' }}
                >
                  -25%
                </span>
              </button>
            </div>

            {/* Price */}
            <div className="text-right">
              <span style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>
                {isMonthly ? '$5' : '$3.75'}
              </span>
              <span className="text-[13px] font-medium ml-0.5" style={{ color: '#9CA3AF' }}>/mo</span>
              {!isMonthly && (
                <p className="text-[11px] m-0 mt-0.5" style={{ color: '#9CA3AF' }}>Billed $45/yr</p>
              )}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full text-white text-[15px] font-semibold transition-all disabled:opacity-50"
            style={{
              height: 44,
              borderRadius: 8,
              backgroundColor: PRIMARY,
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(108,71,255,0.3)'
                e.currentTarget.style.backgroundColor = '#5B38E0'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.backgroundColor = PRIMARY
            }}
          >
            {loading ? 'Redirecting\u2026' : `Subscribe \u2014 ${isMonthly ? '$5/mo' : '$45/yr'}`}
          </button>

          {/* Footer */}
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

        {/* ─── Right Column ─── */}
        <div
          className="hidden md:flex flex-col relative overflow-hidden"
          style={{
            width: 290,
            background: 'linear-gradient(145deg, #F8F7FF 0%, #EDE9FE 50%, #F0EDFF 100%)',
          }}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center transition-colors"
            style={{
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.6)',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.6)' }}
            aria-label="Close upgrade modal"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Floating cards container */}
          <div className="flex-1 flex items-center justify-center" style={{ padding: '40px 20px' }}>
            <div className="relative" style={{ width: 220, height: 280 }}>
              {/* Card 1: Current palette */}
              <div
                className="absolute pro-float-card"
                style={{
                  top: 0, left: 0,
                  width: 200,
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  padding: 12,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              >
                <div className="flex rounded-lg overflow-hidden" style={{ height: 32 }}>
                  {colors.map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="m-0 mt-2 text-[10px] font-medium" style={{ color: '#9CA3AF' }}>
                  Your palette · {colors.length} colors
                </p>
              </div>

              {/* Card 2: Shade scale */}
              <div
                className="absolute pro-float-card"
                style={{
                  top: 80, left: 32,
                  width: 200,
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  padding: 12,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  animationDelay: '0.5s',
                }}
              >
                <div className="flex rounded-lg overflow-hidden" style={{ height: 32 }}>
                  {SHADE_COLORS.map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="m-0 mt-2 text-[10px] font-medium" style={{ color: '#9CA3AF' }}>
                  Shade scale · 50–900
                </p>
              </div>

              {/* Card 3: AI prompt */}
              <div
                className="absolute pro-float-card"
                style={{
                  top: 160, left: 8,
                  width: 200,
                  backgroundColor: '#fff',
                  borderRadius: 12,
                  padding: 12,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  animationDelay: '1s',
                }}
              >
                <div
                  className="rounded-lg text-[11px] italic"
                  style={{
                    padding: '8px 10px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #f3f4f6',
                    color: '#9CA3AF',
                  }}
                >
                  Warm Mediterranean café at sunset
                </div>
                <p className="m-0 mt-2 text-[10px] font-medium" style={{ color: '#9CA3AF' }}>
                  AI palette · text prompt
                </p>
              </div>
            </div>
          </div>

          {/* Decorative dots */}
          <div className="absolute" style={{ bottom: 16, left: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 4, height: 4, borderRadius: '50%',
                    backgroundColor: PRIMARY, opacity: 0.15,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
