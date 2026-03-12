import { Sparkles, Image, Eye, Heart, Layers, Download, LayoutGrid } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getCheckoutUrl } from '../../lib/stripe'

const BRAND = '#1A73E8'

const PRO_FEATURES: { Icon: LucideIcon; bg: string; color: string; text: string }[] = [
  { Icon: Sparkles,   bg: 'bg-purple-50',  color: 'text-purple-500', text: 'AI palette from text prompt' },
  { Icon: Image,      bg: 'bg-blue-50',    color: 'text-blue-500',   text: 'Image → palette extraction' },
  { Icon: Eye,        bg: 'bg-teal-50',    color: 'text-teal-500',   text: 'Color blindness preview' },
  { Icon: Heart,      bg: 'bg-pink-50',    color: 'text-pink-500',   text: 'Save unlimited palettes' },
  { Icon: Layers,     bg: 'bg-orange-50',  color: 'text-orange-500', text: 'Full shade scales (50–900)' },
  { Icon: Download,   bg: 'bg-green-50',   color: 'text-green-500',  text: 'Export without watermark' },
  { Icon: LayoutGrid, bg: 'bg-indigo-50',  color: 'text-indigo-500', text: '6, 7 & 8 color palettes' },
]

interface ProUpgradeModalProps {
  open: boolean
  onClose: () => void
  onSignIn?: () => void
}

export default function ProUpgradeModal({ open, onClose, onSignIn }: ProUpgradeModalProps) {
  const { user, isSignedIn } = useAuth()

  if (!open) return null

  const handleMonthly = () => {
    if (!user) return
    window.open(getCheckoutUrl('monthly', user.id), '_blank')
  }

  const handleYearly = () => {
    if (!user) return
    window.open(getCheckoutUrl('yearly', user.id), '_blank')
  }

  const handleSignIn = () => {
    onClose()
    onSignIn?.()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative max-w-sm w-[90vw] bg-white rounded-2xl shadow-xl overflow-hidden p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center mx-auto mb-3">
            <span className="text-yellow-400 text-2xl leading-none">✦</span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Unlock Paletta Pro</h2>
          <p className="text-sm text-gray-400 mt-1">Cancel anytime</p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 my-4" />

        {/* Feature list */}
        <div>
          {PRO_FEATURES.map(({ Icon, bg, color, text }) => (
            <div key={text} className="flex items-center gap-3 py-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                <Icon size={16} className={color} />
              </div>
              <span className="text-sm text-gray-700 font-medium">{text}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 my-4" />

        {/* CTA */}
        <div className="space-y-2">
          {isSignedIn ? (
            <>
              <button
                onClick={handleMonthly}
                className="flex items-center justify-center w-full h-11 rounded-full text-white text-[14px] font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: BRAND }}
              >
                Subscribe Monthly — $5/mo
              </button>
              <button
                onClick={handleYearly}
                className="flex items-center justify-center w-full h-11 rounded-full text-[14px] font-semibold transition-all hover:bg-blue-50 active:scale-95 border"
                style={{ borderColor: BRAND, color: BRAND }}
              >
                Subscribe Yearly — $36/yr
                <span className="ml-1.5 text-[11px] font-bold text-green-600">Save 40%</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="flex items-center justify-center w-full h-11 rounded-full text-white text-[14px] font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: BRAND }}
            >
              Sign in to upgrade
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full h-11 rounded-full text-[14px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
