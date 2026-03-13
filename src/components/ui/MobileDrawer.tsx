import { useEffect, useState } from 'react'
import ProBadge from './ProBadge'

const BRAND = '#1A73E8'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  onShare: () => void
  onExport: () => void
  onSignIn: () => void
  onProGate: () => void
  onImagePalette: () => void
  onVisionSim: () => void
  onAiPalette: () => void
  isPro?: boolean
}

export default function MobileDrawer({
  open, onClose, onSave, onShare, onExport, onSignIn, onProGate,
  onImagePalette, onVisionSim, onAiPalette, isPro,
}: MobileDrawerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
  }, [open])

  if (!open) return null

  const handleRow = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      />
      <div
        className="absolute top-0 right-0 bottom-0 w-[80vw] max-w-[320px] bg-white shadow-2xl overflow-y-auto"
        style={{
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 250ms ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <span className="text-[16px] font-semibold text-gray-800">Menu</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Actions section */}
        <div className="px-3 py-1">
          <button
            onClick={() => handleRow(onSave)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div className="text-left min-w-0">
              <span className="text-[14px] font-medium text-gray-800 block">Save palette</span>
              <span className="text-[11px] text-gray-400">Save this palette</span>
            </div>
          </button>

          <button
            onClick={() => handleRow(onShare)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </div>
            <div className="text-left min-w-0">
              <span className="text-[14px] font-medium text-gray-800 block">Share palette</span>
              <span className="text-[11px] text-gray-400">Copy shareable link</span>
            </div>
          </button>

          <button
            onClick={() => handleRow(onExport)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div className="text-left min-w-0">
              <span className="text-[14px] font-medium text-gray-800 block">Export palette</span>
              <span className="text-[11px] text-gray-400">CSS, Tailwind, or hex codes</span>
            </div>
          </button>

          <button
            onClick={() => handleRow(onSignIn)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="text-left min-w-0">
              <span className="text-[14px] font-medium text-gray-800 block">Sign In</span>
              <span className="text-[11px] text-gray-400">Sync palettes across devices</span>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 my-2 h-px bg-gray-100" />

        {/* Pro Tools section */}
        <div className="px-5 pt-2 pb-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pro Tools</span>
        </div>

        <div className="px-3 py-1">
          <button
            onClick={() => handleRow(onImagePalette)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-medium text-gray-800">From Image</span>
                <ProBadge />
              </div>
              <span className="text-[11px] text-gray-400">Extract palette from any photo</span>
            </div>
          </button>

          <button
            onClick={() => handleRow(onVisionSim)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-medium text-gray-800">Vision Sim</span>
                <ProBadge />
              </div>
              <span className="text-[11px] text-gray-400">Simulate color blindness modes</span>
            </div>
          </button>

          <button
            onClick={() => handleRow(onAiPalette)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <span className="text-[16px]">✨</span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-medium text-gray-800">AI Palette</span>
                <ProBadge />
              </div>
              <span className="text-[11px] text-gray-400">Generate from a text prompt</span>
            </div>
          </button>
        </div>

        {/* Go Pro button — hidden for Pro users */}
        {!isPro && (
          <>
            <div className="mx-5 my-2 h-px bg-gray-100" />
            <div className="px-5 py-4">
              <button
                onClick={() => handleRow(onProGate)}
                className="w-full h-11 rounded-full text-white text-[14px] font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: BRAND }}
              >
                Go Pro →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
