import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'paletta_cookie_consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
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

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'all')
    setVisible(false)
  }

  const handleEssential = () => {
    localStorage.setItem(STORAGE_KEY, 'essential')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      ref={barRef}
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[9999]"
      style={{
        backgroundColor: '#1a1a2e',
        color: '#ffffff',
        padding: '16px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          justifyContent: 'space-between',
        }}
      >
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, flex: '1 1 400px' }}>
          We use cookies for essential features and analytics. Read our{' '}
          <Link
            to="/cookie-policy"
            style={{ color: '#9b82ff', textDecoration: 'underline' }}
          >
            Cookie Policy
          </Link>{' '}
          to learn more.
        </p>
        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
          <button
            onClick={handleEssential}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 9999,
              border: 'none',
              backgroundColor: '#ffffff',
              color: '#1a1a2e',
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Essential Only
          </button>
          <button
            onClick={handleAccept}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 9999,
              border: 'none',
              backgroundColor: '#6C47FF',
              color: '#ffffff',
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  )
}
