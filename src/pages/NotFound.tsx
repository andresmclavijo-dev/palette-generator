import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const GRAYS = ['#d4d4d4', '#a3a3a3', '#737373', '#525252', '#262626']

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page Not Found — Paletta'
    return () => { document.title = 'Paletta — Free Color Palette Generator' }
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '32px 24px' }}>
        {/* Broken palette — grayscale swatches */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {GRAYS.map((color, i) => (
            <div
              key={i}
              style={{
                width: 48,
                height: 64,
                borderRadius: 12,
                backgroundColor: color,
                transform: i % 2 === 0 ? 'rotate(-3deg)' : 'rotate(3deg)',
              }}
              aria-hidden="true"
            />
          ))}
        </div>

        <h1 style={{ fontSize: 48, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          404
        </h1>
        <p style={{ fontSize: 18, fontWeight: 500, color: '#525252', margin: '0 0 8px' }}>
          Color not found
        </p>
        <p style={{ fontSize: 14, color: '#737373', margin: '0 0 32px' }}>
          This page doesn't exist. Let's get you back to creating.
        </p>

        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            backgroundColor: '#6C47FF',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 9999,
            textDecoration: 'none',
          }}
        >
          Generate a palette &rarr;
        </Link>
      </div>
    </div>
  )
}
