import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'paletta_cookie_consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) setVisible(true)
  }, [])

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
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
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
          We use cookies to improve your experience. Read our{' '}
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
