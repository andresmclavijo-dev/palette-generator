import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProBadge from './ProBadge'
import { getAiRemaining } from '../../components/palette/AiPrompt'
import type { VisionMode } from '../../components/palette/VisionSimulator'

const VISION_MODES: { value: VisionMode; label: string }[] = [
  { value: 'normal',       label: 'Normal' },
  { value: 'deuteranopia', label: 'Deuteranopia' },
  { value: 'protanopia',   label: 'Protanopia' },
  { value: 'tritanopia',   label: 'Tritanopia' },
]

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  onShare: () => void
  onExport: () => void
  onSignIn: () => void
  onSignOut: () => void
  onProGate: () => void
  onImagePalette: () => void
  onVisionSim: () => void
  onAiPalette: () => void
  onSavedPalettes: () => void
  onManageSubscription?: () => void
  isPro?: boolean
  isSignedIn?: boolean
  userEmail?: string
  visionMode?: VisionMode
  onVisionChange?: (mode: VisionMode) => void
}

export default function MobileDrawer({
  open, onClose, onSave, onShare, onExport, onSignIn, onSignOut, onProGate,
  onImagePalette, onAiPalette, onSavedPalettes, onManageSubscription,
  isPro, isSignedIn, userEmail,
  visionMode = 'normal', onVisionChange,
}: MobileDrawerProps) {
  const [visible, setVisible] = useState(false)
  const [visionExpanded, setVisionExpanded] = useState(false)

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
            aria-label="Close menu"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Signed-in user info */}
        {isSignedIn && userEmail && (
          <div className="px-5 pb-2">
            <span className="text-[12px] text-gray-400 break-all">{userEmail}</span>
          </div>
        )}

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
            <span className="text-[14px] font-medium text-gray-800">Save</span>
          </button>

          {/* Saved palettes — only when signed in */}
          {isSignedIn && (
            <button
              onClick={() => handleRow(onSavedPalettes)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
              </div>
              <span className="text-[14px] font-medium text-gray-800">My Palettes</span>
            </button>
          )}

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
            <span className="text-[14px] font-medium text-gray-800">Share</span>
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
            <span className="text-[14px] font-medium text-gray-800">Export</span>
          </button>

          {/* Sign In or Sign Out */}
          {!isSignedIn ? (
            <button
              onClick={() => handleRow(onSignIn)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span className="text-[14px] font-medium text-gray-800">Sign In</span>
            </button>
          ) : (
            <button
              onClick={() => handleRow(onSignOut)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <span className="text-[14px] font-medium text-gray-800">Sign Out</span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 my-2 h-px bg-gray-100" />

        {/* Pro Tools section */}
        <div className="px-5 pt-2 pb-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tools</span>
        </div>

        <div className="px-3 py-1">
          <button
            onClick={() => {
              if (!isPro) { onProGate(); onClose(); return }
              setVisionExpanded(o => !o)
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div className="flex-1 flex items-center gap-1.5">
              <span className="text-[14px] font-medium text-gray-800">Accessibility</span>
              {!isPro && <ProBadge />}
              {isPro && visionMode !== 'normal' && (
                <span className="text-[10px] text-blue-500 font-medium">{visionMode}</span>
              )}
            </div>
            {isPro && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: visionExpanded ? 'rotate(90deg)' : undefined, transition: 'transform 150ms' }}
              >
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </button>

          {/* Vision sub-options — inline accordion */}
          {visionExpanded && isPro && onVisionChange && (
            <div className="pl-[3.75rem] pr-3 pb-1 space-y-0.5">
              {VISION_MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => onVisionChange(m.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    visionMode === m.value ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {m.label} {visionMode === m.value && '✓'}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => handleRow(onImagePalette)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-medium text-gray-800">Image</span>
              {!isPro && <ProBadge />}
            </div>
          </button>

          <button
            onClick={() => handleRow(onAiPalette)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <span className="text-[16px]">✨</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-medium text-gray-800">AI Palette</span>
              {isPro ? (
                <span className="text-[10px] text-gray-400">Unlimited</span>
              ) : (
                <span className="text-[10px] text-gray-400">
                  {getAiRemaining()} generation{getAiRemaining() !== 1 ? 's' : ''} left
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Go Pro or Manage Subscription */}
        {!isPro ? (
          <>
            <div className="mx-5 my-2 h-px bg-gray-100" />
            <div className="px-5 py-4">
              <button
                onClick={() => handleRow(onProGate)}
                className="w-full h-10 rounded-full text-white text-[14px] font-medium transition-all active:scale-95 bg-brand-violet hover:bg-brand-violet-hover"
              >
                Go Pro →
              </button>
            </div>
          </>
        ) : isSignedIn && onManageSubscription ? (
          <>
            <div className="mx-5 my-2 h-px bg-gray-100" />
            <div className="px-3 py-1">
              <button
                onClick={() => handleRow(onManageSubscription)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <span className="text-[14px] font-medium text-gray-800">Manage Subscription</span>
              </button>
            </div>
          </>
        ) : null}

        {/* Divider */}
        <div className="mx-5 my-2 h-px bg-gray-100" />

        {/* Legal section */}
        <div className="px-5 pt-2 pb-1">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Legal</span>
        </div>
        <div className="px-5 pb-5 flex flex-col gap-2">
          <Link
            to="/privacy-policy"
            onClick={onClose}
            className="text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors no-underline"
          >
            Privacy Policy
          </Link>
          <Link
            to="/cookie-policy"
            onClick={onClose}
            className="text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors no-underline"
          >
            Cookie Policy
          </Link>
          <Link
            to="/terms-of-service"
            onClick={onClose}
            className="text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors no-underline"
          >
            Terms of Service
          </Link>
          <a
            href="mailto:hello@usepaletta.io"
            onClick={onClose}
            className="text-[13px] font-medium text-gray-500 hover:text-gray-700 transition-colors no-underline"
          >
            Contact
          </a>
        </div>
      </div>
    </div>
  )
}
