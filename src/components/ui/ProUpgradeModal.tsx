import { useState } from 'react'
import { Sparkles, Image, Eye, Heart, Layers, Download, LayoutGrid } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { createCheckoutSession } from '../../lib/stripe'
import { usePaletteStore } from '../../store/paletteStore'
import { showToast } from '../../utils/toast'
import { BRAND_VIOLET as ACCENT } from '../../lib/tokens'

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
  onSignIn?: () => void
}

export default function ProUpgradeModal({ open, onClose, onSignIn }: ProUpgradeModalProps) {
  const { user } = useAuth()
  const swatches = usePaletteStore(s => s.swatches)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly')

  if (!open) return null

  const isMonthly = plan === 'monthly'
  const displayPrice = isMonthly ? '$5/mo' : '$3.75/mo'
  const billedLabel = isMonthly ? null : 'Billed as $45/yr'

  const handleCheckout = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      // Not signed in — prompt sign in first
      onSignIn?.()
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

  const previewColors = swatches.slice(0, 5).map(s => s.hex)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-[90vw] max-w-[720px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close upgrade modal"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Left column: features + CTAs */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
              <span className="text-2xl leading-none" style={{ color: ACCENT }}>✦</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Unlock Paletta Pro</h2>
            <p className="text-sm text-gray-400 mt-1">Cancel anytime</p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-4" />

          {/* Feature list */}
          <div>
            {PRO_FEATURES.map(({ Icon, bg, color, text }) => (
              <div key={text} className="flex items-center gap-3 py-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon size={16} className={color} />
                </div>
                <span className="text-sm text-gray-700 font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-4" />

          {/* Pricing toggle */}
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex rounded-full bg-gray-100 p-0.5">
              <button
                onClick={() => setPlan('monthly')}
                className="relative px-4 h-8 rounded-full text-[13px] font-medium transition-all"
                style={isMonthly ? { background: ACCENT, color: '#fff' } : { color: '#666' }}
              >
                Monthly
              </button>
              <button
                onClick={() => setPlan('yearly')}
                className="relative flex items-center gap-1.5 px-4 h-8 rounded-full text-[13px] font-medium transition-all"
                style={!isMonthly ? { background: ACCENT, color: '#fff' } : { color: '#666' }}
              >
                Yearly
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={!isMonthly
                    ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                    : { background: '#dcfce7', color: '#16a34a' }}
                >
                  Save 25%
                </span>
              </button>
            </div>
          </div>

          {/* Price display */}
          <div className="text-center mb-4">
            <span className="text-3xl font-extrabold text-gray-900">{displayPrice}</span>
            {billedLabel && (
              <p className="text-[12px] text-gray-400 mt-0.5">{billedLabel}</p>
            )}
          </div>

          {/* CTAs */}
          {!user ? (
            <div className="space-y-2">
              <button
                onClick={() => onSignIn?.()}
                className="flex items-center justify-center gap-2 w-full h-10 rounded-full text-white text-[14px] font-medium transition-all bg-brand-violet hover:bg-brand-violet-hover active:scale-95"
              >
                Sign in with Google
              </button>
              <button
                onClick={onClose}
                className="w-full h-10 rounded-full text-[14px] font-medium text-gray-500 hover:text-gray-700 hover:bg-surface-secondary transition-all"
              >
                Not now
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => handleCheckout(plan)}
                disabled={loading}
                className="flex items-center justify-center w-full h-10 rounded-full text-white text-[14px] font-medium transition-all bg-brand-violet hover:bg-brand-violet-hover active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Redirecting…' : `Subscribe — ${isMonthly ? '$5/mo' : '$45/yr'}`}
              </button>
              <button
                onClick={onClose}
                className="w-full h-10 rounded-full text-[14px] font-medium text-gray-500 hover:text-gray-700 hover:bg-surface-secondary transition-all"
              >
                Not now
              </button>
            </div>
          )}
        </div>

        {/* Right column: live palette preview (desktop only) */}
        <div className="hidden md:flex flex-col items-center justify-center w-[280px] bg-gray-50 border-l border-gray-100 p-6">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-4">Your current palette</p>
          <div className="w-full flex flex-col gap-2">
            {previewColors.map((hex, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl shadow-sm shrink-0" style={{ backgroundColor: hex }} />
                <span className="text-[13px] font-mono text-gray-600 uppercase">{hex}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-5 text-center">
            Pro unlocks up to 8 colors, AI generation, and more.
          </p>
        </div>
      </div>
    </div>
  )
}
