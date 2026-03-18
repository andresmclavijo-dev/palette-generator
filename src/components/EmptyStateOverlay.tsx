import { useEffect, useState } from 'react'
import { analytics } from '../lib/posthog'

const LS_KEY = 'paletta_has_generated'

interface EmptyStateOverlayProps {
  dismissed: boolean
  method?: 'spacebar' | 'button' | 'ai'
}

export default function EmptyStateOverlay({ dismissed, method }: EmptyStateOverlayProps) {
  const [hasGenerated] = useState(() => !!localStorage.getItem(LS_KEY))
  const [visible, setVisible] = useState(true)
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    if (!hasGenerated) analytics.track('empty_state_shown')
  }, [hasGenerated])

  useEffect(() => {
    if (!dismissed) return
    localStorage.setItem(LS_KEY, 'true')
    analytics.track('empty_state_dismissed', { method: method ?? 'button' })
    setVisible(false)
    const t = setTimeout(() => setMounted(false), 350)
    return () => clearTimeout(t)
  }, [dismissed, method])

  if (hasGenerated || !mounted) return null

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease-out',
      }}
    >
      <div
        className="flex flex-col items-center text-center px-6 py-5 sm:px-10 sm:py-6"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 16,
        }}
      >
        {/* Desktop */}
        <p
          className="hidden md:block text-2xl font-semibold"
          style={{ color: '#1a1a2e' }}
        >
          Your next masterpiece starts with the{' '}
          <kbd className="inline-block px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 font-mono text-base align-baseline">
            Spacebar
          </kbd>
        </p>
        <p className="hidden md:block text-sm mt-2" style={{ color: '#6B7280' }}>
          Generate · Lock · Export — all from your keyboard
        </p>

        {/* Mobile */}
        <p
          className="md:hidden text-xl font-semibold"
          style={{ color: '#1a1a2e' }}
        >
          Your next masterpiece starts now
        </p>
        <p className="md:hidden text-sm mt-2" style={{ color: '#6B7280' }}>
          Tap{' '}
          <kbd className="inline-block px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 font-mono text-sm align-baseline">
            Generate
          </kbd>
          {' '}to begin
        </p>
      </div>
    </div>
  )
}
