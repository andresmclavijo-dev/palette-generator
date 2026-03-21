import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createCheckoutSession } from '@/lib/stripe'
import { showToast } from '@/utils/toast'
import { analytics } from '@/lib/posthog'
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PENDING_PLAN_KEY = 'paletta_pending_checkout'

const PRO_FEATURES: { bold: string; rest: string }[] = [
  { bold: 'AI palette', rest: ' from text prompt' },
  { bold: '6, 7 & 8', rest: ' color palettes' },
  { bold: 'Unlimited', rest: ' saved palettes' },
  { bold: 'Image \u2192', rest: ' palette extraction' },
  { bold: 'Accessibility lens', rest: ' — vision simulation' },
  { bold: 'Full shade scales', rest: ' (50\u2013900)' },
  { bold: 'Export', rest: ' without watermark' },
]

const SHADE_COLORS = [
  '#F5F3FF', '#DDD6FE', '#C4B5FD', '#A78BFA',
  '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95',
]

const AI_PREVIEW_COLORS = ['#E07A5F', '#F2CC8F', '#81B29A', '#F4F1DE', '#3D405B']

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
      <path d="M3 8.5L6.5 12L13 4" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

  const handleDismiss = () => {
    analytics.track('pro_modal_dismissed')
    onClose()
  }

  const colors = paletteColors?.length ? paletteColors : ['#6C47FF', '#FF6B6B', '#4ECDC4', '#FFE66D', '#2D6A4F']
  const isMonthly = plan === 'monthly'

  const handleSubscribe = async () => {
    const price = isMonthly ? 5 : 45
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
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleDismiss() }}>
      <DialogContent
        className="max-w-[720px] p-0 overflow-hidden gap-0"
        aria-describedby={undefined}
      >
        <div className="flex">
          {/* ─── Left Column ─── */}
          <div className="flex-1 flex flex-col p-8">
            {/* Badge */}
            <Badge
              variant="pro"
              className="w-fit text-[10px] tracking-wider uppercase px-2.5 py-1 font-bold mb-4"
            >
              ✦ Paletta Pro
            </Badge>

            {/* Headline */}
            <DialogTitle className="text-2xl font-extrabold text-foreground tracking-tight leading-tight m-0">
              Unlock the full toolkit
            </DialogTitle>
            <p className="text-[13px] text-muted-foreground m-0 mt-1.5 mb-6">
              Everything you need to ship palettes faster. Cancel anytime.
            </p>

            {/* Feature list */}
            <div className="flex flex-col gap-3 mb-6">
              {PRO_FEATURES.map((f) => (
                <div key={f.bold} className="flex items-center gap-2.5">
                  <CheckIcon />
                  <span className="text-[13.5px] text-foreground">
                    <strong>{f.bold}</strong>{f.rest}
                  </span>
                </div>
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Pricing toggle */}
            <div className="mb-4">
              <div className="inline-flex items-center bg-surface rounded-button p-0.5 gap-0.5">
                <button
                  onClick={() => { setPlan('monthly'); analytics.track('pro_modal_plan_toggle', { selected_plan: 'monthly' }) }}
                  className={`px-4 h-9 rounded-button text-sm font-medium transition-colors ${
                    isMonthly ? 'bg-card shadow-sm text-foreground' : 'text-muted'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => { setPlan('yearly'); analytics.track('pro_modal_plan_toggle', { selected_plan: 'yearly' }) }}
                  className={`px-4 h-9 rounded-button text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    !isMonthly ? 'bg-card shadow-sm text-foreground' : 'text-muted'
                  }`}
                >
                  Yearly
                  <span className="text-[9px] font-bold bg-success-bg text-success px-1.5 py-0.5 rounded-badge">
                    −25%
                  </span>
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="mb-4">
              <span className="text-[26px] font-extrabold text-foreground">
                {isMonthly ? '$5' : '$3.75'}
              </span>
              <span className="text-[13px] text-muted-foreground">/mo</span>
              {!isMonthly && (
                <span className="text-[12px] text-muted-foreground ml-2">Billed $45/year</span>
              )}
            </div>

            {/* CTA */}
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full h-11 text-sm font-semibold shadow-sm hover:shadow-md transition-all hover:-translate-y-px"
            >
              {loading ? 'Redirecting\u2026' : `Go Pro \u2014 ${isMonthly ? '$5/mo' : '$45/yr'}`}
            </Button>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-[11px] text-muted">Launch pricing · Powered by Stripe</span>
              <button
                onClick={handleDismiss}
                className="text-[11px] text-muted hover:text-muted-foreground transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>

          {/* ─── Right Column ─── */}
          <div
            className="hidden md:flex w-[290px] relative overflow-hidden items-center justify-center"
            style={{ background: 'linear-gradient(145deg, #F8F7FF 0%, #EDE9FE 50%, #F0EDFF 100%)' }}
          >
            {/* Floating cards container */}
            <div className="relative w-[220px] h-[280px] pro-float-container">
              {/* Card 1: Current palette */}
              <div
                className="absolute top-0 left-0 bg-card rounded-pill shadow p-3 w-[200px] pro-float-card"
              >
                <div className="flex rounded-button overflow-hidden h-8 mb-2">
                  {colors.map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="text-[10px] text-muted">Your palette · {colors.length} colors</div>
              </div>

              {/* Card 2: Shade scale */}
              <div
                className="absolute top-[100px] left-[32px] bg-card rounded-pill shadow p-3 w-[200px] pro-float-card"
                style={{ animationDelay: '0.5s' }}
              >
                <div className="flex rounded-button overflow-hidden h-8 mb-2">
                  {SHADE_COLORS.map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="text-[10px] text-muted">Shade scale · 50–900</div>
              </div>

              {/* Card 3: AI prompt */}
              <div
                className="absolute top-[200px] left-[8px] bg-card rounded-pill shadow p-3 w-[200px] pro-float-card"
                style={{ animationDelay: '1s' }}
              >
                <div className="text-[11px] italic text-muted-foreground mb-1">
                  "Warm Mediterranean café at sunset"
                </div>
                <div className="flex rounded-button overflow-hidden h-6">
                  {AI_PREVIEW_COLORS.map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Decorative dots */}
            <div className="absolute bottom-4 left-4 grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-primary/15" />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
