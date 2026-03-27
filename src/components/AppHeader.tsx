import { useCallback, useEffect, useRef, useState } from 'react'
import { Share2, Link2 } from 'lucide-react'
import Tooltip from './ui/Tooltip'

interface AppHeaderProps {
  isPro: boolean
  isSignedIn: boolean
  userEmail?: string
  shareCopied: boolean
  onShare: () => void
  onSave: () => void
  onSavedPalettes: () => void
  onExport: () => void
  onSignIn: () => void
  onSignOut: () => void
  onProGate: () => void
  onDrawerOpen: () => void
  onManageSubscription?: () => void
}

export default function AppHeader({
  isPro,
  isSignedIn,
  userEmail,
  shareCopied,
  onShare,
  onSave,
  onSavedPalettes,
  onExport,
  onSignIn,
  onSignOut,
  onProGate,
  onDrawerOpen,
  onManageSubscription,
}: AppHeaderProps) {
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [heartPulse, setHeartPulse] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  const handleSaveClick = useCallback(() => {
    onSave()
    setHeartPulse(true)
    setTimeout(() => setHeartPulse(false), 500)
  }, [onSave])

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!avatarOpen) return
    const handler = (e: MouseEvent) => {
      if (avatarRef.current?.contains(e.target as Node)) return
      setAvatarOpen(false)
    }
    const raf = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handler)
    })
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousedown', handler)
    }
  }, [avatarOpen])

  // Close avatar dropdown on Escape
  useEffect(() => {
    if (!avatarOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAvatarOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [avatarOpen])

  return (
    <header
      className="flex-none flex items-center justify-between px-5 z-40 shrink-0 bg-card border-b border-border"
      style={{ height: 60 }}
    >
      {/* Left: Logo + tagline */}
      <div className="flex items-center shrink-0">
        <span className="text-[22px] sm:text-[24px] font-bold tracking-tight leading-none text-foreground">
          Paletta
        </span>
        <div className="hidden md:flex items-center mx-2 bg-border" style={{ width: '1px', height: '13px' }} />
        <span className="hidden md:inline text-[14px] whitespace-nowrap text-muted-foreground">
          Free color palette generator. <span className="font-medium text-primary">Pro</span> adds AI, full shades & accessibility.
        </span>
      </div>

      {/* Right: Nav actions */}
      <nav className="flex items-center shrink-0" aria-label="Main">
        {/* Mobile: Hamburger */}
        <button
          onClick={onDrawerOpen}
          className="sm:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-secondary transition-all active:scale-[0.98] text-foreground"
          aria-label="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Desktop nav items — hidden on mobile to avoid Tooltip wrappers taking layout space */}
        <div className="hidden sm:flex items-center gap-4">
          {/* Desktop: Share / Copy link — icon-only */}
          <Tooltip text={shareCopied ? 'Copied!' : canNativeShare ? 'Share' : 'Copy link'} position="bottom">
            <button
              onClick={onShare}
              className="w-9 h-9 rounded-full bg-card hover:bg-surface flex items-center justify-center transition-all duration-150 active:scale-[0.98] shrink-0 text-muted-foreground"
              aria-label={shareCopied ? 'Copied!' : canNativeShare ? 'Share palette' : 'Copy link'}
            >
              {canNativeShare
                ? <Share2 size={16} strokeWidth={2} aria-hidden="true" />
                : <Link2 size={16} strokeWidth={2} aria-hidden="true" />
              }
            </button>
          </Tooltip>

          {/* Desktop: Save — outline heart with save-pulse animation */}
          <Tooltip text="Save" position="bottom">
            <button
              onClick={handleSaveClick}
              className="w-9 h-9 rounded-full bg-card hover:bg-surface flex items-center justify-center shrink-0"
              style={{
                transition: 'background 150ms, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: heartPulse ? 'scale(1.2)' : 'scale(1)',
              }}
              aria-label="Save palette"
            >
              <svg
                width="16" height="16" viewBox="0 0 24 24"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                style={{
                  fill: heartPulse ? 'hsl(var(--destructive))' : 'none',
                  stroke: heartPulse ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
                  transition: 'fill 300ms, stroke 300ms',
                }}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </Tooltip>

          {/* Desktop: Saved palettes — visible when signed in */}
          {isSignedIn && (
            <Tooltip text="My Palettes" position="bottom">
              <button
                onClick={onSavedPalettes}
                className="w-9 h-9 rounded-full bg-card hover:bg-surface flex items-center justify-center transition-all duration-150 active:scale-[0.98] shrink-0 text-muted-foreground"
                aria-label="My Palettes"
                aria-haspopup="true"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
              </button>
            </Tooltip>
          )}

          {/* Desktop: Get code — icon-only */}
          <Tooltip text="Get code" position="bottom">
            <button
              onClick={onExport}
              className="w-9 h-9 rounded-full bg-card hover:bg-surface flex items-center justify-center transition-all duration-150 active:scale-[0.98] shrink-0 text-muted-foreground"
              aria-label="Get code"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </Tooltip>

          {/* Desktop: Auth — email dropdown or Sign In */}
          {isSignedIn ? (
            <div ref={avatarRef} className="relative">
              <button
                onClick={() => setAvatarOpen(o => !o)}
                className="flex items-center gap-3 h-10 px-4 rounded-full bg-card hover:bg-surface text-[14px] font-medium transition-all shrink-0 text-foreground"
                aria-label="Account menu"
                aria-haspopup="true"
                aria-expanded={avatarOpen}
              >
                {userEmail?.split('@')[0] ?? 'Account'}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-11 w-48 bg-card rounded-xl shadow-lg border border-border-light py-1.5 z-50">
                  <div className="px-4 py-1.5">
                    <span className="text-[11px] text-muted-foreground break-all">{userEmail}</span>
                  </div>
                  <div className="mx-2 my-1 h-px bg-border-light" />
                  {isPro && onManageSubscription && (
                    <button
                      onClick={() => { setAvatarOpen(false); onManageSubscription() }}
                      className="w-full text-left px-4 py-2 text-[13px] text-muted-foreground hover:bg-surface transition-colors font-medium"
                    >
                      Manage Subscription
                    </button>
                  )}
                  <button
                    onClick={() => { setAvatarOpen(false); onSignOut() }}
                    className="w-full text-left px-4 py-2 text-[13px] text-muted-foreground hover:bg-surface transition-colors font-medium"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-3 h-10 px-4 rounded-full bg-card hover:bg-surface text-[14px] font-medium transition-all shrink-0 text-foreground"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Sign In
            </button>
          )}

          {/* Desktop: Go Pro CTA — hidden for Pro users */}
          {!isPro && (
            <button
              onClick={onProGate}
              className="flex items-center gap-3 px-4 h-10 rounded-full text-[14px] font-medium text-white transition-all bg-primary hover:bg-primary-hover active:scale-95 shrink-0"
            >
              Go Pro
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
          )}
        </div>
      </nav>
    </header>
  )
}
