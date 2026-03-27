import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAiRemaining } from '../../components/palette/AiPrompt'
import { HarmonyPickerList } from '../../components/palette/HarmonyPicker'
import type { HarmonyMode } from '../../lib/colorEngine'
import type { VisionMode } from '../../components/palette/VisionSimulator'
import { Badge } from '@/components/ui/badge'
import { BRAND_VIOLET } from '@/lib/tokens'

const VISION_MODES: { value: VisionMode; label: string; desc: string }[] = [
  { value: 'normal',        label: 'Normal Vision',  desc: 'Full color spectrum' },
  { value: 'protanopia',    label: 'Protanopia',     desc: 'Red-green · reds appear dark or missing' },
  { value: 'deuteranopia',  label: 'Deuteranopia',   desc: 'Red-green · most common (~5% of men)' },
  { value: 'tritanopia',    label: 'Tritanopia',     desc: 'Blue-yellow confusion' },
  { value: 'achromatopsia', label: 'Achromatopsia',  desc: 'Grayscale only · no color perception' },
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
  onPreview: () => void
  onVisionSim: () => void
  onAiPalette: () => void
  onSavedPalettes: () => void
  onManageSubscription?: () => void
  isPro?: boolean
  isSignedIn?: boolean
  userEmail?: string
  visionMode?: VisionMode
  onVisionChange?: (mode: VisionMode) => void
  harmonyMode?: HarmonyMode
  onHarmonyChange?: (mode: HarmonyMode) => void
}

export default function MobileDrawer({
  open, onClose, onSave, onShare, onExport, onSignIn, onSignOut, onProGate,
  onImagePalette, onPreview, onAiPalette, onSavedPalettes, onManageSubscription,
  isPro, isSignedIn, userEmail,
  visionMode = 'normal', onVisionChange,
  harmonyMode = 'random', onHarmonyChange,
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
        className="absolute top-0 right-0 bottom-0 w-[80vw] max-w-[320px] bg-card shadow-2xl overflow-y-auto"
        style={{
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 250ms ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <span className="text-[16px] font-semibold text-foreground">Menu</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface hover:bg-border text-muted-foreground transition-all"
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
            <span className="text-[12px] text-muted-foreground break-all">{userEmail}</span>
          </div>
        )}

        {/* Actions section */}
        <div className="px-3 py-1">
          <button
            onClick={() => handleRow(onSave)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface active:bg-surface transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <span className="text-[14px] font-medium text-foreground">Save</span>
          </button>

          {/* Saved palettes — only when signed in */}
          {isSignedIn && (
            <button
              onClick={() => handleRow(onSavedPalettes)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface active:bg-surface transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND_VIOLET} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
              </div>
              <span className="text-[14px] font-medium text-foreground">My Palettes</span>
            </button>
          )}

          <button
            onClick={() => handleRow(onShare)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface active:bg-surface transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              )}
            </div>
            <span className="text-[14px] font-medium text-foreground">{typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? 'Share' : 'Copy link'}</span>
          </button>

          <button
            onClick={() => handleRow(onExport)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface active:bg-surface transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-success-bg flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <span className="text-[14px] font-medium text-foreground">Get code</span>
          </button>

          {/* Sign In or Sign Out */}
          {!isSignedIn ? (
            <button
              onClick={() => handleRow(onSignIn)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface active:bg-surface transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span className="text-[14px] font-medium text-foreground">Sign In</span>
            </button>
          ) : (
            <button
              onClick={() => handleRow(onSignOut)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface active:bg-surface transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <span className="text-[14px] font-medium text-foreground">Sign Out</span>
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 my-2 h-px bg-border-light" />

        {/* Harmony section */}
        <div className="px-5 pt-2 pb-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Harmony</span>
        </div>
        <div className="px-3 py-1">
          {onHarmonyChange && (
            <HarmonyPickerList mode={harmonyMode} onChange={(m) => { onHarmonyChange(m); onClose() }} />
          )}
        </div>

        {/* Divider */}
        <div className="mx-5 my-2 h-px bg-border-light" />

        {/* Pro Tools section */}
        <div className="px-5 pt-2 pb-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tools</span>
        </div>

        <div className="px-3 py-1">
          <button
            onClick={() => setVisionExpanded(o => !o)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface active:bg-surface transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div className="flex-1 flex items-center gap-1.5">
              <span className="text-[14px] font-medium text-foreground">Accessibility</span>
              {visionMode !== 'normal' && (
                <span className="text-[10px] text-primary font-medium">{visionMode}</span>
              )}
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: visionExpanded ? 'rotate(90deg)' : undefined, transition: 'transform 150ms' }}
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Vision sub-options — inline accordion, styled to match HarmonyPickerList */}
          {visionExpanded && onVisionChange && (
            <div className="pl-[3.75rem] pr-3 pb-1">
              <div style={{ padding: '8px 16px 8px', borderBottom: '1px solid hsl(var(--border))' }}>
                <div className="text-[13px] font-semibold text-foreground">Accessibility Lens</div>
                <div className="text-[12px] text-muted-foreground mt-0.5">See how people with color vision differences experience your palette</div>
              </div>
              {VISION_MODES.map((m, i) => {
                const isFree = m.value === 'normal' || m.value === 'protanopia' || m.value === 'deuteranopia'
                const needsPro = !isFree && !isPro
                const isActive = visionMode === m.value
                return (
                  <button
                    key={m.value}
                    onClick={() => {
                      if (needsPro) { onProGate(); onClose(); return }
                      onVisionChange(m.value)
                      onClose()
                    }}
                    className="w-full text-left rounded-xl transition-colors duration-150 hover:bg-surface active:bg-surface"
                    style={{
                      padding: '12px 16px',
                      background: isActive ? 'rgba(108,71,255,0.08)' : undefined,
                      borderTop: i > 0 ? '1px solid hsl(var(--border-light))' : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[14px] font-medium"
                        style={{ color: isActive ? BRAND_VIOLET : 'hsl(var(--foreground))' }}
                      >
                        {m.label}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {needsPro && (
                          <Badge variant="pro">PRO</Badge>
                        )}
                        {isActive && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND_VIOLET} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <p className="text-[13px] mt-0.5 leading-snug m-0" style={{ color: 'hsl(var(--muted-foreground))' }}>{m.desc}</p>
                  </button>
                )
              })}
            </div>
          )}

          <button
            onClick={() => handleRow(onImagePalette)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface active:bg-surface transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND_VIOLET} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-medium text-foreground">Image</span>
            </div>
          </button>

          <button
            onClick={() => handleRow(onPreview)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface active:bg-surface transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND_VIOLET} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-medium text-foreground">Preview</span>
            </div>
          </button>

          <button
            onClick={() => handleRow(onAiPalette)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface active:bg-surface transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <span className="text-[16px]">✨</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-medium text-foreground">AI Palette</span>
              {isPro ? (
                <span className="text-[10px] text-muted-foreground">Unlimited</span>
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  {getAiRemaining()} generation{getAiRemaining() !== 1 ? 's' : ''} left
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Go Pro or Manage Subscription */}
        {!isPro ? (
          <>
            <div className="mx-5 my-2 h-px bg-border-light" />
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
            <div className="mx-5 my-2 h-px bg-border-light" />
            <div className="px-3 py-1">
              <button
                onClick={() => handleRow(onManageSubscription)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface active:bg-surface transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <span className="text-[14px] font-medium text-foreground">Manage Subscription</span>
              </button>
            </div>
          </>
        ) : null}

        {/* Divider */}
        <div className="mx-5 my-2 h-px bg-border-light" />

        {/* Legal section */}
        <div className="px-5 pt-2 pb-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Legal</span>
        </div>
        <div className="px-5 pb-5 flex flex-col gap-2">
          <Link
            to="/privacy-policy"
            onClick={onClose}
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            Privacy Policy
          </Link>
          <Link
            to="/cookie-policy"
            onClick={onClose}
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            Cookie Policy
          </Link>
          <Link
            to="/terms-of-service"
            onClick={onClose}
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            Terms of Service
          </Link>
          <a
            href="mailto:hello@usepaletta.io"
            onClick={onClose}
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors no-underline"
          >
            Contact
          </a>
        </div>
      </div>
    </div>
  )
}
