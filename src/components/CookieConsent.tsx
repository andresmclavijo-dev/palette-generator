import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'paletta_cookie_consent'

interface CookieConsentProps {
  compact?: boolean
}

export default function CookieConsent({ compact }: CookieConsentProps) {
  const [visible, setVisible] = useState(false)
  const [dismissing, setDismissing] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setVisible(true)
  }, [])

  // Set a CSS custom property with the cookie bar height so toolbars can offset
  useEffect(() => {
    if (!visible) {
      document.documentElement.style.setProperty('--cookie-bar-h', '0px')
      return
    }
    const update = () => {
      const h = barRef.current?.offsetHeight ?? 0
      document.documentElement.style.setProperty('--cookie-bar-h', `${h}px`)
    }
    // Measure after paint
    requestAnimationFrame(update)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [visible])

  const dismiss = (choice: 'all' | 'essential') => {
    localStorage.setItem(STORAGE_KEY, choice)
    setDismissing(true)
    setTimeout(() => setVisible(false), 300)
  }

  if (!visible) return null

  // Compact (mobile MobileShell) — slim single-line bar
  if (compact) {
    return (
      <div
        ref={barRef}
        role="dialog"
        aria-label="Cookie consent"
        className="flex-none w-full"
        style={{
          backgroundColor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          padding: '10px 16px',
          transition: dismissing ? 'transform 300ms ease, opacity 300ms ease' : undefined,
          transform: dismissing ? 'translateY(-100%)' : undefined,
          opacity: dismissing ? 0 : 1,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span style={{ fontSize: 12, color: 'hsl(var(--foreground))' }}>
            We use{' '}
            <Link to="/cookie-policy" style={{ color: 'hsl(var(--primary))', textDecoration: 'underline' }}>cookies</Link>.
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => dismiss('essential')}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
                cursor: 'pointer',
                minHeight: 32,
              }}
            >
              Essential
            </button>
            <button
              onClick={() => dismiss('all')}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'hsl(var(--primary))',
                color: 'white',
                cursor: 'pointer',
                minHeight: 32,
              }}
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Full (desktop) version
  return (
    <div
      ref={barRef}
      role="dialog"
      aria-label="Cookie consent"
      className="flex-none w-full"
      style={{
        backgroundColor: 'hsl(var(--card))',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '10px 24px',
        transition: dismissing ? 'transform 300ms ease, opacity 300ms ease' : undefined,
        transform: dismissing ? 'translateY(-100%)' : undefined,
        opacity: dismissing ? 0 : 1,
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          justifyContent: 'space-between',
        }}
      >
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'hsl(var(--foreground))' }}>
          We use cookies for essential features and analytics.{' '}
          <Link
            to="/cookie-policy"
            style={{ color: 'hsl(var(--primary))', textDecoration: 'underline' }}
          >
            Cookie Policy
          </Link>
        </p>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => dismiss('essential')}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.1)',
              backgroundColor: 'transparent',
              color: 'hsl(var(--foreground))',
              cursor: 'pointer',
              height: 36,
            }}
          >
            Essential Only
          </button>
          <button
            onClick={() => dismiss('all')}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              backgroundColor: 'hsl(var(--primary))',
              color: 'white',
              cursor: 'pointer',
              height: 36,
            }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
