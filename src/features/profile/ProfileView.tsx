import { useState } from 'react'
import { Sparkles, Eye, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ProfileView({
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

  if (!isSignedIn) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <img
          src="/logo.svg"
          alt="Paletta"
          style={{ width: 96, height: 96, borderRadius: 16, marginBottom: 16 }}
        />
        <h2 className="text-[28px] font-bold text-foreground">Welcome to <span className="font-brand">Paletta</span></h2>
        <p className="text-[14px] mt-2 mb-6 max-w-[320px] text-muted-foreground">
          The color palette generator built for accessibility
        </p>
        <Button
          variant="default"
          size="lg"
          onClick={() => onSignIn()}
          className="text-[16px] px-8 gap-2.5 mb-8"
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
        <div className="w-full max-w-[360px] overflow-hidden rounded-pill border border-border-light">
          {[
            { icon: Sparkles, title: 'Unlimited AI palettes' },
            { icon: Eye, title: 'All 5 vision simulations' },
            { icon: Heart, title: 'Unlimited saves + export' },
          ].map((f, i) => {
            const Icon = f.icon
            return (
              <div key={f.title} className={`flex items-center justify-between px-4 ${i > 0 ? 'border-t border-border-light' : ''}`} style={{ minHeight: 52 }}>
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-primary" />
                  <span className="text-[14px] font-semibold text-foreground">{f.title}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-primary text-white rounded-badge">PRO</span>
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
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              className="w-12 h-12 rounded-full object-cover shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-primary-foreground text-[20px] font-bold shrink-0"
            >
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[20px] font-bold truncate text-foreground">{name}</span>
              {isPro && (
                <span className="shrink-0 text-[10px] font-bold text-white px-3 py-1 bg-primary rounded-badge">PRO</span>
              )}
            </div>
            {user?.email && <span className="text-[13px] block truncate mt-0.5 text-muted">{user.email}</span>}
            {!isPro && <span className="text-[12px] block mt-0.5 text-border">Free plan</span>}
          </div>
        </div>

        {/* Upgrade */}
        {!isPro && (
          <Button
            variant="default"
            size="lg"
            onClick={onProGate}
            className="w-full mb-5 flex items-center justify-between px-5 text-[14px]"
          >
            <span>Upgrade to Pro</span>
            <span className="text-[13px] opacity-80">$5/mo</span>
          </Button>
        )}

        {/* Account accordion */}
        <div className="overflow-hidden mb-3 rounded-pill border border-border-light">
          <button
            onClick={() => setAccountOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 hover:bg-surface transition-colors"
            style={{ minHeight: 52 }}
          >
            <span className="text-[15px] font-semibold text-foreground">Account</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
              className="text-muted"
              style={{ transform: accountOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div className="border-t border-border-light overflow-hidden transition-all duration-200" style={{ maxHeight: accountOpen ? 200 : 0, opacity: accountOpen ? 1 : 0 }}>
            {isPro && (
              <button onClick={onManageSubscription} className="w-full text-left px-4 text-[14px] font-medium hover:bg-surface transition-colors text-foreground" style={{ minHeight: 52 }}>
                Manage subscription
              </button>
            )}
            <button onClick={onSignOut} className="w-full text-left px-4 text-[14px] font-medium hover:bg-surface transition-colors text-destructive" style={{ minHeight: 52 }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Support */}
        <div className="overflow-hidden rounded-pill border border-border-light">
          <a href="mailto:hello@usepaletta.io" className="flex items-center justify-between px-4 no-underline hover:bg-surface transition-colors" style={{ minHeight: 52 }}>
            <span className="text-[15px] font-semibold text-foreground">Support</span>
            <span className="text-[12px] text-muted">hello@usepaletta.io</span>
          </a>
        </div>
      </div>
    </div>
  )
}
