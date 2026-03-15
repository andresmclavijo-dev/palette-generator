import { useEffect, useRef, useState } from 'react'
import { usePaletteStore } from '../store/paletteStore'
import { BRAND_DARK, BRAND_VIOLET, BRAND_WARM } from '../lib/tokens'
import posthog from '../lib/posthog'
import chroma from 'chroma-js'

const LS_KEY = 'paletta_hero_seen'

export default function LandingHero({
  onGenerate,
  onProGate,
}: {
  onGenerate: () => void
  onProGate: () => void
}) {
  const [visible] = useState(() => !localStorage.getItem(LS_KEY))
  const [bgColor, setBgColor] = useState(BRAND_WARM)
  const ctaRef = useRef<HTMLButtonElement>(null)

  // Mark as seen on mount
  useEffect(() => {
    if (!visible) return
    localStorage.setItem(LS_KEY, '1')
    posthog.capture('landing_hero_shown')
  }, [visible])

  // Subscribe to palette store for reactive background tint
  useEffect(() => {
    if (!visible) return
    const unsub = usePaletteStore.subscribe((state) => {
      const first = state.swatches[0]?.hex
      if (!first) { setBgColor(BRAND_WARM); return }
      try {
        setBgColor(chroma.mix(BRAND_WARM, first, 0.08, 'rgb').hex())
      } catch {
        setBgColor(BRAND_WARM)
      }
    })
    return unsub
  }, [visible])

  // Listen for spacebar-triggered generates to pulse the CTA
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement) && ctaRef.current) {
        ctaRef.current.classList.add('ring-pulse')
        setTimeout(() => ctaRef.current?.classList.remove('ring-pulse'), 400)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [visible])

  if (!visible) return null

  const handleGenerate = () => {
    posthog.capture('landing_cta_generate')
    onGenerate()
  }

  const handlePro = () => {
    posthog.capture('landing_cta_pro')
    onProGate()
  }

  return (
    <>
      <style>{`
        @keyframes ringPulse {
          0% { box-shadow: 0 0 0 0 rgba(108,71,255,0.25); }
          100% { box-shadow: 0 0 0 4px rgba(108,71,255,0); }
        }
        .ring-pulse { animation: ringPulse 400ms ease-out; }
      `}</style>

      <div
        className="flex-none w-full transition-colors duration-[600ms] ease-in-out"
        style={{ backgroundColor: bgColor }}
      >
        {/* Desktop layout */}
        <div className="hidden md:flex items-center justify-between px-6 lg:px-10" style={{ height: '88px' }}>
          <div className="min-w-0">
            <h2
              className="text-[20px] font-semibold tracking-tight"
              style={{ color: BRAND_DARK }}
            >
              Beautiful palettes, instantly.
            </h2>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Generate, save, and export.{' '}
              <span className="font-medium" style={{ color: BRAND_VIOLET }}>Pro</span>{' '}
              unlocks AI generation, shade scales & vision simulation.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 ml-6">
            <button
              ref={ctaRef}
              onClick={handleGenerate}
              className="flex items-center gap-2 rounded-full text-white text-[14px] font-semibold transition-all active:scale-95"
              style={{ backgroundColor: BRAND_VIOLET, padding: '10px 20px' }}
              aria-label="Generate a new palette"
            >
              Generate
              <kbd
                aria-hidden="true"
                className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[11px] font-mono leading-none"
              >
                space
              </kbd>
              <span className="sr-only">press space to generate</span>
            </button>

            <button
              onClick={handlePro}
              className="rounded-full text-[13px] font-medium transition-all hover:bg-purple-50 active:scale-95"
              style={{
                border: '0.5px solid rgba(108,71,255,0.44)',
                color: BRAND_VIOLET,
                padding: '9px 16px',
              }}
              aria-label="See Pro features"
            >
              ✦ See Pro
            </button>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden text-center" style={{ padding: '18px 16px 14px' }}>
          <h2
            className="text-[18px] font-semibold tracking-tight"
            style={{ color: BRAND_DARK }}
          >
            Beautiful palettes, instantly.
          </h2>
          <p className="text-[12px] text-gray-500 mt-1">
            Generate, save, export.{' '}
            <span className="font-medium" style={{ color: BRAND_VIOLET }}>Pro</span>{' '}
            adds AI, shades & vision.
          </p>

          <button
            ref={ctaRef}
            onClick={handleGenerate}
            className="w-full rounded-full text-white text-[14px] font-semibold transition-all active:scale-95 mt-3"
            style={{ backgroundColor: BRAND_VIOLET, padding: '12px 20px' }}
            aria-label="Generate a palette"
          >
            Generate a palette
          </button>

          <button
            onClick={handlePro}
            className="mt-2 text-[12px] font-medium transition-all"
            style={{ color: BRAND_VIOLET }}
            aria-label="Unlock Pro features"
          >
            ✦ Unlock Pro · $5/mo
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="flex-none w-full" style={{ height: '1px', backgroundColor: '#f0f0f0' }} />
    </>
  )
}
