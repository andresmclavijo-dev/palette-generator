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
      className="absolute inset-0 z-10 flex items-start md:items-center justify-center pointer-events-none pt-[30%] md:pt-0"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease-out',
      }}
    >
      <div
        className="flex flex-col items-center text-center px-5 py-4 md:px-10 md:py-6 max-w-[85vw] md:max-w-none"
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 16,
        }}
      >
        {/* Desktop */}
        <p className="hidden md:block text-2xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          Your next masterpiece starts with the{' '}
          <kbd className="inline-block px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 font-mono text-base align-baseline">
            Spacebar
          </kbd>
        </p>
        <p className="hidden md:block text-sm mt-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Generate, lock, and export — all from your keyboard
        </p>

        {/* Mobile */}
        <p className="md:hidden text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
          Your next masterpiece starts now
        </p>
        <p className="md:hidden text-xs mt-1.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Tap{' '}
          <kbd className="inline-block px-1.5 py-0.5 rounded-md bg-gray-100 border border-gray-200 font-mono text-xs align-baseline">
            Generate
          </kbd>
          {' '}to begin
        </p>
      </div>
    </div>
  )
}
