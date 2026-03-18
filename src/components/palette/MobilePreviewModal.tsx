import { useCallback, useEffect, useRef, useState } from 'react'
import { usePro } from '../../hooks/usePro'
import { usePaletteStore } from '../../store/paletteStore'
import {
  MOCKUP_TABS, FALLBACK_COLORS, TAB_CAPTIONS,
  LandingMockup, DashboardMockup, MobileAppMockup,
  type MockupTab,
} from '../ui/ProductMockups'

const PRIMARY = '#6C47FF'

interface MobilePreviewModalProps {
  open: boolean
  onClose: () => void
  onProGate: () => void
}

export default function MobilePreviewModal({ open, onClose, onProGate }: MobilePreviewModalProps) {
  const { isPro } = usePro()
  const swatches = usePaletteStore(s => s.swatches)
  const [activeTab, setActiveTab] = useState<MockupTab>('Landing Page')
  const [fade, setFade] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const userClicked = useRef(false)

  const colors = swatches.length >= 3
    ? swatches.slice(0, 5).map(s => s.hex)
    : FALLBACK_COLORS

  // Auto-rotate
  useEffect(() => {
    if (!open) return
    userClicked.current = false
    timerRef.current = setInterval(() => {
      if (userClicked.current) return
      setFade(false)
      setTimeout(() => {
        setActiveTab(prev => {
          // For free users, only rotate to Landing Page
          if (!isPro) return 'Landing Page'
          const idx = MOCKUP_TABS.indexOf(prev)
          return MOCKUP_TABS[(idx + 1) % MOCKUP_TABS.length]
        })
        setFade(true)
      }, 200)
    }, 4000)
    return () => clearInterval(timerRef.current)
  }, [open, isPro])

  const handleTabClick = useCallback((tab: MockupTab) => {
    if (!isPro && tab !== 'Landing Page') {
      onClose()
      onProGate()
      return
    }
    userClicked.current = true
    clearInterval(timerRef.current)
    setFade(false)
    setTimeout(() => {
      setActiveTab(tab)
      setFade(true)
    }, 150)
  }, [isPro, onProGate, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-[95vw] max-w-[460px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold text-white uppercase px-2 py-0.5 rounded"
              style={{ background: '#1a1a2e', letterSpacing: '0.05em' }}
            >
              Preview
            </span>
            <span className="text-[11px] font-medium" style={{ color: '#9CA3AF' }}>
              Your palette in action
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
            aria-label="Close preview"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 px-4 pb-3">
          {MOCKUP_TABS.map(tab => {
            const isProTab = tab !== 'Landing Page'
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
                style={
                  isActive
                    ? { background: PRIMARY, color: '#fff' }
                    : { background: 'rgba(108,71,255,0.06)', color: '#9CA3AF' }
                }
              >
                {tab}
                {isProTab && !isPro && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        {/* Mockup */}
        <div
          className="px-4 pb-2 transition-all duration-200"
          style={{ opacity: fade ? 1 : 0, transform: fade ? 'translateY(0)' : 'translateY(4px)' }}
        >
          {activeTab === 'Landing Page' && <LandingMockup colors={colors} />}
          {activeTab === 'Dashboard' && <DashboardMockup colors={colors} />}
          {activeTab === 'Mobile App' && <MobileAppMockup colors={colors} />}
        </div>

        {/* Caption */}
        <p className="text-[11px] font-medium text-center py-3" style={{ color: PRIMARY }}>
          {TAB_CAPTIONS[activeTab]}
        </p>
      </div>
    </div>
  )
}
