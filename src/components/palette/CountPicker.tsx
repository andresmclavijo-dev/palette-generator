import { useState } from 'react'

const FREE_MAX   = 5
const ALL_COUNTS = [3, 4, 5, 6, 7, 8]
const COMPACT_COUNTS = [3, 4, 5, 6]
const BRAND = '#1A73E8'

interface CountPickerProps {
  count: number
  onChange: (n: number) => void
  compact?: boolean
}

const PRO_FEATURES = [
  { icon: '🎨', text: '6–8 colors per palette' },
  { icon: '✨', text: 'AI palette from text prompt' },
  { icon: '🖼', text: 'Image → palette extraction' },
  { icon: '♿', text: 'WCAG contrast checker' },
  { icon: '👁', text: 'Color blindness preview' },
  { icon: '💾', text: 'Save & organize palettes' },
  { icon: '📦', text: 'PNG / SVG export' },
]

export default function CountPicker({ count, onChange, compact }: CountPickerProps) {
  const [proModal, setProModal] = useState(false)
  const counts = compact ? COMPACT_COUNTS : ALL_COUNTS

  return (
    <>
      <div
        className="flex items-center gap-1"
        onClick={e => e.stopPropagation()}
      >
        {!compact && <span className="text-[11px] text-[#9AA0A6] mr-0.5 select-none hidden sm:block">Colors</span>}

        {counts.map(n => {
          const isPro  = n > FREE_MAX
          const active = n === count

          return (
            <button
              key={n}
              onClick={() => {
                if (isPro) setProModal(true)
                else onChange(n)
              }}
              className={`
                relative w-8 h-8 rounded-full text-[13px] font-semibold
                transition-all duration-150 select-none
                flex items-center justify-center
                ${active
                  ? 'bg-[#1A73E8] text-white shadow-sm'
                  : isPro
                    ? 'text-[#BDBDBD] cursor-default'
                    : 'text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124] cursor-pointer'
                }
              `}
              aria-label={isPro ? `${n} colors — Pro` : `${n} colors`}
            >
              {n}
              {isPro && (
                <span className="absolute -top-0.5 -right-0.5 text-[7px] text-amber-400 leading-none select-none">✦</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Pro upgrade modal */}
      {proModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => setProModal(false)}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative w-[340px] max-w-[90vw] bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="text-amber-400 text-[24px] mb-2">✦</div>
              <h2 className="text-[20px] font-bold text-gray-900">Paletta Pro</h2>
              <p className="text-[13px] text-gray-500 mt-1">Everything you need for professional color work</p>
            </div>

            {/* Feature list */}
            <div className="px-6 pb-4">
              <div className="space-y-2.5">
                {PRO_FEATURES.map(f => (
                  <div key={f.text} className="flex items-center gap-3">
                    <span className="text-[16px] w-6 text-center shrink-0">{f.icon}</span>
                    <span className="text-[13px] text-gray-700">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="px-6 pb-2 text-center">
              <p className="text-[15px] font-semibold text-gray-900">$5/month <span className="text-[13px] font-normal text-gray-400">or</span> $45/year</p>
            </div>

            {/* Buttons */}
            <div className="px-6 pt-3 pb-6 space-y-2">
              <a
                href="mailto:hello@paletta.app?subject=Paletta%20Pro%20Waitlist"
                className="flex items-center justify-center w-full h-11 rounded-full text-white text-[14px] font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: BRAND }}
                onClick={() => setProModal(false)}
              >
                Join waitlist
              </a>
              <button
                onClick={() => setProModal(false)}
                className="w-full h-11 rounded-full text-[14px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
