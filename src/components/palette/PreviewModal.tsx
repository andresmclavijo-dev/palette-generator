import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePro } from '../../hooks/usePro'
import { usePaletteStore } from '../../store/paletteStore'
import {
  MOCKUP_TABS, FALLBACK_COLORS, TAB_CAPTIONS,
  LandingMockup, DashboardMockup, MobileAppMockup,
  type MockupTab,
} from '../ui/ProductMockups'
import { BRAND_VIOLET } from '@/lib/tokens'

interface PreviewModalProps {
  open: boolean
  onClose: () => void
  onProGate: () => void
}

export default function PreviewModal({ open, onClose, onProGate }: PreviewModalProps) {
  const { isPro } = usePro()
  const swatches = usePaletteStore(s => s.swatches)
  const [activeTab, setActiveTab] = useState<MockupTab>('Landing Page')
  const [fade, setFade] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const userClicked = useRef(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const colors = swatches.length >= 3
    ? swatches.slice(0, 5).map(s => s.hex)
    : FALLBACK_COLORS

  const isLocked = !isPro && activeTab !== 'Landing Page'

  // Reset on open
  useEffect(() => {
    if (open) {
      setActiveTab('Landing Page')
      setFade(true)
      userClicked.current = false
    }
  }, [open])

  // Auto-rotate — show all tabs including locked ones (blurred)
  useEffect(() => {
    if (!open) return
    timerRef.current = setInterval(() => {
      if (userClicked.current) return
      setFade(false)
      setTimeout(() => {
        setActiveTab(prev => {
          const idx = MOCKUP_TABS.indexOf(prev)
          return MOCKUP_TABS[(idx + 1) % MOCKUP_TABS.length]
        })
        setFade(true)
      }, 200)
    }, 4000)
    return () => clearInterval(timerRef.current)
  }, [open])

  // Escape to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Focus trap
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    modalRef.current?.focus()
    return () => { prev?.focus() }
  }, [open])

  const handleTabClick = useCallback((tab: MockupTab) => {
    userClicked.current = true
    clearInterval(timerRef.current)
    setFade(false)
    setTimeout(() => {
      setActiveTab(tab)
      setFade(true)
    }, 150)
  }, [])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-stretch md:items-center md:justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Preview your palette in UI mockups"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full h-full md:h-[min(92vh,720px)] md:w-[92vw] md:max-w-[1060px] bg-card md:rounded-2xl shadow-2xl overflow-hidden flex flex-col outline-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className="text-[10px] font-bold text-white uppercase px-2.5 py-1 rounded"
              style={{ background: 'hsl(var(--foreground))', letterSpacing: '0.05em' }}
            >
              Preview
            </span>
            <span className="text-[13px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Your palette in action
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-surface hover:bg-border text-muted-foreground transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Close preview"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 pb-4 shrink-0">
          {MOCKUP_TABS.map(tab => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-all"
                style={{
                  minHeight: '44px',
                  ...(isActive
                    ? { background: BRAND_VIOLET, color: '#fff' }
                    : { background: 'rgba(108,71,255,0.06)', color: 'hsl(var(--muted-foreground))' }),
                }}
              >
                {tab}
              </button>
            )
          })}
        </div>

        {/* Mockup area — scale-to-fit */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-4">
          <div className="relative">
            {/* Mockup content — blurred when locked */}
            <div
              className="transition-opacity duration-200"
              style={{
                opacity: fade ? 1 : 0,
                ...(isLocked ? { filter: 'blur(3px) grayscale(30%)' } : {}),
              }}
            >
              {activeTab === 'Landing Page' && <LandingMockup colors={colors} />}
              {activeTab === 'Dashboard' && <DashboardMockup colors={colors} />}
              {activeTab === 'Mobile App' && <MobileAppMockup colors={colors} />}
            </div>

            {/* Soft paywall overlay */}
            {isLocked && fade && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl shadow-lg text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND_VIOLET} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <p className="text-[14px] font-bold" style={{ color: 'hsl(var(--foreground))' }}>
                    Unlock with Pro
                  </p>
                  <p className="text-[12px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    Subscribe to see your colors in dashboards and mobile apps
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onClose()
                      onProGate()
                    }}
                    className="mt-1 px-5 py-2.5 rounded-full text-white text-[13px] font-semibold transition-all hover:opacity-90 active:scale-95"
                    style={{ background: BRAND_VIOLET, minHeight: '44px' }}
                  >
                    Go Pro &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Caption */}
        <div className="shrink-0 py-3 text-center border-t border-gray-100">
          <p className="text-[12px] font-medium" style={{ color: BRAND_VIOLET }}>
            {TAB_CAPTIONS[activeTab]}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
