import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// ─── Tour step definitions ──────────────────────────────────
const STEPS = [
  {
    targetId: 'generate',
    headline: 'Create your system',
    body: 'Hit space or tap Generate for a new color palette.',
  },
  {
    targetId: 'get-code',
    headline: 'Grab the code',
    body: 'Export as CSS variables or Tailwind config.',
  },
  {
    targetId: 'preview-nav',
    headline: 'See it in context',
    body: 'Preview your palette on real UI templates.',
  },
] as const

const STORAGE_KEY = 'paletta_tour_completed'
const SPOTLIGHT_PAD = 8
const BRAND_VIOLET = '#6C47FF'

interface TargetRect {
  top: number
  left: number
  width: number
  height: number
}

// ─── Main component ─────────────────────────────────────────
export function OnboardingTour() {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null)
  const [entering, setEntering] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [tooltipReady, setTooltipReady] = useState(false)
  const rafRef = useRef(0)

  // Check if tour should show (first visit only)
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    // Delay slightly so targets render
    const timer = setTimeout(() => setActive(true), 600)
    return () => clearTimeout(timer)
  }, [])

  // Measure target element for current step
  const measureTarget = useCallback(() => {
    if (!active) return
    const el = document.querySelector(`[data-tour-id="${STEPS[step].targetId}"]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [active, step])

  // Keep target rect updated (scroll, resize, layout shifts)
  useEffect(() => {
    if (!active) return
    measureTarget()
    const onResize = () => measureTarget()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [active, measureTarget])

  // Enter animation
  useEffect(() => {
    if (!active) return
    setEntering(true)
    setTooltipReady(false)
    const t1 = setTimeout(() => setEntering(false), 200)
    const t2 = setTimeout(() => setTooltipReady(true), 100)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [active])

  // Tooltip delay on step change
  useEffect(() => {
    if (!active) return
    setTooltipReady(false)
    const t = setTimeout(() => setTooltipReady(true), 300)
    return () => clearTimeout(t)
  }, [step, active])

  // Poll for target rect to smooth transitions
  useEffect(() => {
    if (!active) return
    const poll = () => {
      measureTarget()
      rafRef.current = requestAnimationFrame(poll)
    }
    rafRef.current = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active, measureTarget])

  // ESC to dismiss
  useEffect(() => {
    if (!active) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const dismiss = useCallback(() => {
    setExiting(true)
    setTimeout(() => {
      setActive(false)
      setExiting(false)
      localStorage.setItem(STORAGE_KEY, 'true')
    }, 150)
  }, [])

  const next = useCallback(() => {
    if (step >= STEPS.length - 1) {
      dismiss()
    } else {
      setStep(s => s + 1)
    }
  }, [step, dismiss])

  if (!active || !targetRect) return null

  const isLast = step === STEPS.length - 1
  const currentStep = STEPS[step]

  // Spotlight rect with padding
  const spot = {
    top: targetRect.top - SPOTLIGHT_PAD,
    left: targetRect.left - SPOTLIGHT_PAD,
    width: targetRect.width + SPOTLIGHT_PAD * 2,
    height: targetRect.height + SPOTLIGHT_PAD * 2,
  }

  // Tooltip positioning
  const isMobile = window.innerWidth < 640
  const tooltip = computeTooltipPosition(spot, isMobile)

  return createPortal(
    <div
      className="fixed inset-0 z-[200]"
      style={{
        opacity: exiting ? 0 : entering ? 0 : 1,
        transition: 'opacity 150ms ease-out',
      }}
    >
      {/* Overlay with spotlight cutout via box-shadow */}
      <div
        className="fixed z-[200]"
        onClick={dismiss}
        style={{
          top: spot.top,
          left: spot.left,
          width: spot.width,
          height: spot.height,
          borderRadius: 12,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          transition: 'top 200ms ease-out, left 200ms ease-out, width 200ms ease-out, height 200ms ease-out',
          pointerEvents: 'none',
        }}
      />

      {/* Clickable overlay regions (outside spotlight) */}
      {/* Top */}
      <div className="fixed z-[200]" style={{ top: 0, left: 0, right: 0, height: spot.top, cursor: 'pointer' }} onClick={dismiss} />
      {/* Bottom */}
      <div className="fixed z-[200]" style={{ top: spot.top + spot.height, left: 0, right: 0, bottom: 0, cursor: 'pointer' }} onClick={dismiss} />
      {/* Left */}
      <div className="fixed z-[200]" style={{ top: spot.top, left: 0, width: spot.left, height: spot.height, cursor: 'pointer' }} onClick={dismiss} />
      {/* Right */}
      <div className="fixed z-[200]" style={{ top: spot.top, left: spot.left + spot.width, right: 0, height: spot.height, cursor: 'pointer' }} onClick={dismiss} />

      {/* Target highlight ring */}
      <div
        className="fixed z-[201] pointer-events-none motion-safe:animate-tour-ring"
        style={{
          top: spot.top,
          left: spot.left,
          width: spot.width,
          height: spot.height,
          borderRadius: 12,
          boxShadow: `0 0 0 4px rgba(108, 71, 255, 0.25)`,
          transition: 'top 200ms ease-out, left 200ms ease-out, width 200ms ease-out, height 200ms ease-out',
        }}
      />

      {/* Tooltip card */}
      <div
        className="fixed z-[202]"
        style={{
          ...tooltip.style,
          width: isMobile ? 'calc(100vw - 32px)' : 260,
          opacity: tooltipReady && !exiting ? 1 : 0,
          transform: tooltipReady && !exiting ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 200ms ease-out, transform 200ms ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="bg-card"
          style={{
            borderRadius: 12,
            border: '0.5px solid hsl(var(--border))',
            boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            padding: 16,
          }}
        >
          {/* Header: step number + headline */}
          <div className="flex items-center gap-2.5 mb-2">
            <span
              className="shrink-0 flex items-center justify-center rounded-full text-[12px] font-medium"
              style={{ width: 24, height: 24, backgroundColor: BRAND_VIOLET, color: '#fff' }}
            >
              {step + 1}
            </span>
            <span className="text-[14px] font-medium text-foreground">{currentStep.headline}</span>
          </div>

          {/* Body */}
          <p className="text-[12px] text-muted-foreground m-0 mb-3" style={{ lineHeight: 1.5 }}>
            {currentStep.body}
          </p>

          {/* Footer: progress pills + actions */}
          <div className="flex items-center justify-between">
            {/* Progress pills */}
            <div className="flex items-center" style={{ gap: 4 }}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === step ? 16 : 6,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: i === step ? BRAND_VIOLET : 'hsl(var(--border))',
                    transition: 'width 150ms ease-out, background-color 150ms ease-out',
                  }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={dismiss}
                className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                aria-label="Skip tour"
              >
                Skip tour
              </button>
              <button
                onClick={next}
                className="text-[12px] font-medium transition-colors"
                style={{ color: BRAND_VIOLET, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                aria-label={isLast ? 'Done' : 'Next step'}
              >
                {isLast ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── Tooltip positioning logic ──────────────────────────────
function computeTooltipPosition(
  spot: { top: number; left: number; width: number; height: number },
  isMobile: boolean
): { style: React.CSSProperties } {
  const tooltipWidth = isMobile ? window.innerWidth - 32 : 260
  const tooltipHeight = 160 // estimated
  const gap = 12

  if (isMobile) {
    // Mobile: center horizontally, above or below target
    const centerX = 16 // 16px from left edge
    const spaceBelow = window.innerHeight - (spot.top + spot.height)
    const spaceAbove = spot.top

    if (spaceAbove > spaceBelow && spaceAbove > tooltipHeight + gap) {
      return { style: { left: centerX, bottom: window.innerHeight - spot.top + gap } }
    }
    return { style: { left: centerX, top: spot.top + spot.height + gap } }
  }

  // Desktop: prefer right, fallback to above
  const spaceRight = window.innerWidth - (spot.left + spot.width)

  if (spaceRight > tooltipWidth + gap + 16) {
    // Right of target, vertically centered
    const tooltipTop = Math.max(12, Math.min(
      spot.top + spot.height / 2 - tooltipHeight / 2,
      window.innerHeight - tooltipHeight - 12
    ))
    return { style: { left: spot.left + spot.width + gap, top: tooltipTop } }
  }

  // Above the target, horizontally centered on target
  const tooltipLeft = Math.max(12, Math.min(
    spot.left + spot.width / 2 - tooltipWidth / 2,
    window.innerWidth - tooltipWidth - 12
  ))
  return { style: { left: tooltipLeft, bottom: window.innerHeight - spot.top + gap } }
}
