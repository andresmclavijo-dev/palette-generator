import { useState } from 'react'
import { Sparkles, Eye, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BRAND_VIOLET, BRAND_DARK } from '../../lib/tokens'

export function ProfileSection({
  user, isSignedIn, isPro, onSignIn, onSignOut, onProGate, onManageSubscription,
}: {
  user: { id: string; email?: string | null; user_metadata?: { full_name?: string; avatar_url?: string } } | null
  isSignedIn: boolean
  isPro: boolean
  onSignIn: () => Promise<{ error: Error | null }>
  onSignOut: () => void
  onProGate: () => void
  onManageSubscription: () => void
}) {
  const [accountOpen, setAccountOpen] = useState(false)
  const [legalOpen, setLegalOpen] = useState(false)

  if (!isSignedIn) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <h2 className="text-[28px] font-bold" style={{ color: BRAND_DARK }}>Welcome to Paletta</h2>
        <p className="text-[14px] mt-2 mb-6 max-w-[320px]" style={{ color: '#6B7280' }}>
          The color palette generator built for accessibility
        </p>
        <Button
          variant="default"
          size="lg"
          onClick={() => onSignIn()}
          className="text-[16px] font-bold px-8 gap-2.5 mb-8"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#8fa8ff"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#7ee6a1"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fdd663"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#f28b82"/>
          </svg>
          Continue with Google
        </Button>

        {/* Pro features */}
        <div className="w-full max-w-[360px] overflow-hidden" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
          {[
            { icon: Sparkles, title: 'Unlimited AI palettes' },
            { icon: Eye, title: 'All 5 vision simulations' },
            { icon: Heart, title: 'Unlimited saves + export' },
          ].map((f, i) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="flex items-center justify-between px-4" style={{ minHeight: 52, borderTop: i > 0 ? '1px solid #F3F4F6' : undefined }}>
                <div className="flex items-center gap-3">
                  <Icon size={20} style={{ color: BRAND_VIOLET }} />
                  <span className="text-[14px] font-semibold" style={{ color: BRAND_DARK }}>{f.title}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5" style={{ backgroundColor: BRAND_VIOLET, color: '#ffffff', borderRadius: 6 }}>PRO</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="absolute inset-0 overflow-y-auto" style={{ padding: 32 }}>
      <div className="max-w-[480px] mx-auto">
        {/* Avatar + info */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="rounded-full flex items-center justify-center text-white text-[20px] font-bold shrink-0"
            style={{ width: 56, height: 56, background: `linear-gradient(135deg, ${BRAND_VIOLET}, #9b82ff)` }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[20px] font-bold truncate" style={{ color: BRAND_DARK }}>{name}</span>
              {isPro && (
                <span className="shrink-0 text-[10px] font-bold text-white px-3 py-1" style={{ backgroundColor: BRAND_VIOLET, borderRadius: 6 }}>PRO</span>
              )}
            </div>
            {user?.email && <span className="text-[13px] block truncate mt-0.5" style={{ color: '#9CA3AF' }}>{user.email}</span>}
            {!isPro && <span className="text-[12px] block mt-0.5" style={{ color: '#D1D5DB' }}>Free plan</span>}
          </div>
        </div>

        {/* Upgrade */}
        {!isPro && (
          <Button
            variant="default"
            size="lg"
            onClick={onProGate}
            className="w-full mb-5 flex items-center justify-between px-5 text-[14px] font-semibold"
          >
            <span>Upgrade to Pro</span>
            <span className="text-[13px] opacity-80">$5/mo</span>
          </Button>
        )}

        {/* Account accordion */}
        <div className="overflow-hidden mb-3" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
          <button
            onClick={() => setAccountOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 hover:bg-gray-50 transition-colors"
            style={{ minHeight: 52 }}
          >
            <span className="text-[15px] font-semibold" style={{ color: BRAND_DARK }}>Account</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
              style={{ transform: accountOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div className="border-t border-gray-100 overflow-hidden transition-all duration-200" style={{ maxHeight: accountOpen ? 200 : 0, opacity: accountOpen ? 1 : 0 }}>
            {isPro && (
              <button onClick={onManageSubscription} className="w-full text-left px-4 text-[14px] font-medium hover:bg-gray-50 transition-colors" style={{ color: BRAND_DARK, minHeight: 52 }}>
                Manage subscription
              </button>
            )}
            <button onClick={onSignOut} className="w-full text-left px-4 text-[14px] font-medium hover:bg-gray-50 transition-colors" style={{ color: '#EF4444', minHeight: 52 }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Legal accordion */}
        <div className="overflow-hidden mb-3" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
          <button
            onClick={() => setLegalOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 hover:bg-gray-50 transition-colors"
            style={{ minHeight: 52 }}
          >
            <span className="text-[15px] font-semibold" style={{ color: BRAND_DARK }}>Legal</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
              style={{ transform: legalOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div className="border-t border-gray-100 flex flex-col overflow-hidden transition-all duration-200" style={{ maxHeight: legalOpen ? 300 : 0, opacity: legalOpen ? 1 : 0 }}>
            <a href="/privacy-policy" className="px-4 text-[14px] font-medium no-underline hover:bg-gray-50 flex items-center" style={{ color: BRAND_DARK, minHeight: 52 }}>Privacy Policy</a>
            <a href="/terms-of-service" className="px-4 text-[14px] font-medium no-underline hover:bg-gray-50 flex items-center border-t border-gray-100" style={{ color: BRAND_DARK, minHeight: 52 }}>Terms of Service</a>
            <a href="/cookie-policy" className="px-4 text-[14px] font-medium no-underline hover:bg-gray-50 flex items-center border-t border-gray-100" style={{ color: BRAND_DARK, minHeight: 52 }}>Cookie Policy</a>
          </div>
        </div>

        {/* Support */}
        <div className="overflow-hidden" style={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
          <a href="mailto:hello@usepaletta.io" className="flex items-center justify-between px-4 no-underline hover:bg-gray-50 transition-colors" style={{ minHeight: 52 }}>
            <span className="text-[15px] font-semibold" style={{ color: BRAND_DARK }}>Support</span>
            <span className="text-[12px]" style={{ color: '#9CA3AF' }}>hello@usepaletta.io</span>
          </a>
        </div>
      </div>
    </div>
  )
}
