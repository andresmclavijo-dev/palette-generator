import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AppWindow } from 'lucide-react'
import { usePro } from '../../hooks/usePro'
import { usePaletteStore } from '../../store/paletteStore'
import ProBadge from '../ui/ProBadge'
import ToolTooltip from '../ui/ToolTooltip'
import {
  MOCKUP_TABS, FALLBACK_COLORS, TAB_CAPTIONS,
  LandingMockup, DashboardMockup, MobileAppMockup,
  type MockupTab,
} from '../ui/ProductMockups'

const PRIMARY = '#6C47FF'

interface PreviewPanelProps {
  onProGate: () => void
}

export default function PreviewPanel({ onProGate }: PreviewPanelProps) {
  const { isPro } = usePro()
  const swatches = usePaletteStore(s => s.swatches)
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<MockupTab>('Landing Page')
  const [fade, setFade] = useState(true)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const userClicked = useRef(false)

  const colors = swatches.length >= 3
    ? swatches.slice(0, 5).map(s => s.hex)
    : FALLBACK_COLORS

  // Position state for portal
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const updatePos = useCallback(() => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 8, left: r.left + r.width / 2 })
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return
      if (btnRef.current?.contains(e.target as Node)) return
      setPanelOpen(false)
    }
    const raf = requestAnimationFrame(() => {
      document.addEventListener('mousedown', handler)
    })
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousedown', handler)
    }
  }, [panelOpen])

  // Escape to close
  useEffect(() => {
    if (!panelOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [panelOpen])

  // Auto-rotate tabs (only if user hasn't manually clicked)
  useEffect(() => {
    if (!panelOpen) return
    userClicked.current = false
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
  }, [panelOpen])

  const handleTabClick = useCallback((tab: MockupTab) => {
    // Pro-gate Dashboard and Mobile App for free users
    if (!isPro && tab !== 'Landing Page') {
      setPanelOpen(false)
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
  }, [isPro, onProGate])

  const handleBtnClick = () => {
    updatePos()
    setPanelOpen(o => !o)
    // Reset to Landing Page when opening
    if (!panelOpen) {
      setActiveTab('Landing Page')
      setFade(true)
    }
  }

  // Auto-rotate should also respect Pro gating — skip pro tabs for free users
  useEffect(() => {
    if (!panelOpen || isPro) return
    // If auto-rotate landed on a Pro tab, skip to Landing
    if (activeTab !== 'Landing Page') {
      setActiveTab('Landing Page')
    }
  }, [activeTab, panelOpen, isPro])

  return (
    <>
      <ToolTooltip description="Preview your palette in realistic UI mockups" showProBadge={!isPro}>
        <button
          ref={btnRef}
          onClick={handleBtnClick}
          className="flex items-center gap-3 h-10 px-4 rounded-full text-[14px] font-medium transition-all hover:bg-surface-secondary hover:text-gray-700"
          style={{ color: '#444444' }}
          aria-label="Preview palette in UI mockups"
          aria-expanded={panelOpen}
          aria-haspopup="true"
        >
          <AppWindow size={16} aria-hidden="true" />
          <span>Preview</span>
          {!isPro && <span aria-hidden="true"><ProBadge /></span>}
        </button>
      </ToolTooltip>

      {panelOpen && createPortal(
        <div
          ref={panelRef}
          className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{
            top: pos.top,
            left: Math.max(16, Math.min(pos.left - 220, window.innerWidth - 456)),
            width: 440,
          }}
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
              onClick={() => setPanelOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
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

          {/* Mockup area */}
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
        </div>,
        document.body,
      )}
    </>
  )
}
