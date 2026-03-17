import { useEffect, useRef, useState } from 'react'
import Tooltip from './ui/Tooltip'
import { BRAND_DARK, BRAND_VIOLET } from '../lib/tokens'

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
}: AppHeaderProps) {
  const [avatarOpen, setAvatarOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

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
      className="flex-none flex items-center justify-between px-5 z-40 shrink-0"
      style={{ height: 60, background: '#FFFFFF', borderBottom: '0.5px solid #efefef' }}
    >
      {/* Left: Logo + tagline */}
      <div className="flex items-center shrink-0">
        <span className="text-[22px] sm:text-[24px] font-bold tracking-tight leading-none" style={{ color: BRAND_DARK }}>
          Paletta
        </span>
        <div className="hidden md:flex items-center mx-2" style={{ width: '1px', height: '13px', backgroundColor: '#e0e0e0' }} />
        <span className="hidden md:inline text-[14px] whitespace-nowrap" style={{ color: '#666666' }}>
          Beautiful palettes, instantly. <span className="font-medium" style={{ color: BRAND_VIOLET }}>Pro</span> adds AI, shades & vision.
        </span>
      </div>

      {/* Right: Nav actions */}
      <nav className="flex items-center gap-4 shrink-0" aria-label="Main">
        {/* Mobile: Hamburger */}
        <button
          onClick={onDrawerOpen}
          className="sm:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-secondary transition-all"
          style={{ color: '#1a1a2e' }}
          aria-label="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        {/* Desktop: Share */}
        <Tooltip text={shareCopied ? 'Copied!' : 'Copy shareable link'}>
          <button
            onClick={onShare}
            className="hidden sm:flex items-center gap-3 px-4 h-10 rounded-full bg-white hover:bg-surface-secondary text-[14px] font-medium transition-all duration-150 shrink-0"
            style={{ color: '#1a1a2e' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span>{shareCopied ? 'Copied!' : 'Share'}</span>
          </button>
        </Tooltip>

        {/* Desktop: Save */}
        <Tooltip text="Save palette">
          <button
            onClick={onSave}
            className="hidden sm:flex items-center gap-3 px-4 h-10 rounded-full bg-white hover:bg-surface-secondary text-[14px] font-medium transition-all duration-150 shrink-0"
            style={{ color: '#1a1a2e' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>Save</span>
          </button>
        </Tooltip>

        {/* Desktop: Saved palettes — visible when signed in */}
        {isSignedIn && (
          <Tooltip text="View saved palettes">
            <button
              onClick={onSavedPalettes}
              className="hidden sm:flex items-center gap-3 px-4 h-10 rounded-full bg-white hover:bg-surface-secondary text-[14px] font-medium transition-all duration-150 shrink-0"
              style={{ color: '#1a1a2e' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>My Palettes</span>
            </button>
          </Tooltip>
        )}

        {/* Desktop: Export */}
        <Tooltip text="Export palette">
          <button
            onClick={onExport}
            className="hidden sm:flex items-center gap-3 px-4 h-10 rounded-full bg-white hover:bg-surface-secondary text-[14px] font-medium transition-all duration-150 shrink-0"
            style={{ color: '#1a1a2e' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </Tooltip>

        {/* Desktop: Auth — email dropdown or Sign In */}
        {isSignedIn ? (
          <div ref={avatarRef} className="relative hidden sm:block">
            <button
              onClick={() => setAvatarOpen(o => !o)}
              className="flex items-center gap-3 h-10 px-4 rounded-full bg-white hover:bg-surface-secondary text-[14px] font-medium transition-all shrink-0"
              style={{ color: '#1a1a2e' }}
            >
              {userEmail?.split('@')[0] ?? 'Account'}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {avatarOpen && (
              <div className="absolute right-0 top-11 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                <div className="px-4 py-1.5">
                  <span className="text-[11px] text-gray-400 break-all">{userEmail}</span>
                </div>
                <div className="mx-2 my-1 h-px bg-gray-100" />
                <button
                  onClick={() => { setAvatarOpen(false); onSignOut() }}
                  className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="hidden sm:flex items-center gap-3 h-10 px-4 rounded-full bg-white hover:bg-surface-secondary text-[14px] font-medium transition-all shrink-0"
            style={{ color: '#1a1a2e' }}
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
            className="hidden sm:flex items-center gap-3 px-4 h-10 rounded-full text-[14px] font-medium text-white transition-all bg-brand-violet hover:bg-brand-violet-hover active:scale-95 shrink-0"
          >
            Go Pro
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        )}
      </nav>
    </header>
  )
}
