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

  // Track show
  useEffect(() => {
    if (!hasGenerated) analytics.track('empty_state_shown')
  }, [hasGenerated])

  // Dismiss on first generate
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
      className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
      style={{
        backdropFilter: visible ? 'blur(6px)' : 'none',
        WebkitBackdropFilter: visible ? 'blur(6px)' : 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease-out',
      }}
    >
      <p
        className="text-xl sm:text-2xl font-semibold text-center px-6"
        style={{ color: '#1a1a2e' }}
      >
        Your next masterpiece starts with the{' '}
        <kbd className="inline-block px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 font-mono text-base align-baseline">
          Spacebar
        </kbd>
      </p>
      <p className="text-sm text-gray-500 mt-2 text-center px-6">
        Generate · Lock · Export — all from your keyboard
      </p>
    </div>
  )
}
