import { useEffect, useState } from 'react'
import { BRAND_VIOLET } from '@/lib/tokens'

const LS_COUNT = 'paletta_generate_count'
const LS_SHOWN = 'paletta_coach_mark_shown'
const TRIGGER_COUNT = 5
const AUTO_DISMISS_MS = 8000

/**
 * Increment the generate counter in localStorage.
 * Returns true if the coach mark should now be shown (exactly the 5th generate).
 */
export function incrementGenerateCount(): boolean {
  if (localStorage.getItem(LS_SHOWN)) return false
  const prev = parseInt(localStorage.getItem(LS_COUNT) || '0', 10)
  const next = prev + 1
  localStorage.setItem(LS_COUNT, String(next))
  return next === TRIGGER_COUNT
}

interface AiCoachMarkProps {
  visible: boolean
  onDismiss: () => void
  onTry: () => void
  /** 'above' places caret on bottom (points down), 'below' places caret on top (points up) */
  position?: 'above' | 'below'
}

export function AiCoachMark({ visible, onDismiss, onTry, position = 'below' }: AiCoachMarkProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!visible) { setShow(false); return }
    // Animate in on next frame
    const raf = requestAnimationFrame(() => setShow(true))
    // Auto-dismiss
    const timer = setTimeout(() => {
      dismiss()
    }, AUTO_DISMISS_MS)
    return () => { cancelAnimationFrame(raf); clearTimeout(timer) }
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = () => {
    localStorage.setItem(LS_SHOWN, '1')
    setShow(false)
    // Wait for exit transition then notify parent
    setTimeout(onDismiss, 200)
  }

  const handleTry = () => {
    localStorage.setItem(LS_SHOWN, '1')
    setShow(false)
    setTimeout(onTry, 100)
  }

  if (!visible) return null

  const isAbove = position === 'above'
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div
      className="absolute z-40"
      style={{
        ...(isAbove ? { bottom: '100%', marginBottom: 10 } : { top: '100%', marginTop: 10 }),
        left: '50%',
        transform: prefersReducedMotion
          ? 'translateX(-50%)'
          : `translateX(-50%) translateY(${show ? '0' : isAbove ? '6px' : '-6px'})`,
        opacity: show ? 1 : 0,
        transition: prefersReducedMotion ? 'opacity 0ms' : 'opacity 200ms ease-out, transform 200ms ease-out',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      {/* Caret */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          ...(isAbove
            ? { bottom: -6, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '7px solid hsl(var(--card))' }
            : { top: -6, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '7px solid hsl(var(--card))' }
          ),
        }}
      />
      {/* Card */}
      <div
        className="bg-card rounded-button shadow-lg border border-border"
        style={{ width: 240, padding: '12px 14px' }}
      >
        <div className="flex items-start gap-2">
          <p className="flex-1 text-[13px] text-foreground leading-snug m-0">
            Try AI generation — describe a mood and get a palette instantly
          </p>
          <button
            onClick={dismiss}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            aria-label="Dismiss"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <button
          onClick={handleTry}
          className="mt-2 h-8 px-4 rounded-button text-[12px] font-semibold text-white transition-all active:scale-[0.98]"
          style={{ backgroundColor: BRAND_VIOLET }}
        >
          Try it
        </button>
      </div>
    </div>
  )
}
