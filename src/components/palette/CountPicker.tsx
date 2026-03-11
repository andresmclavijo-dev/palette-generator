import { useState } from 'react'

const FREE_MAX   = 5
const ALL_COUNTS = [3, 4, 5, 6, 7, 8]

interface CountPickerProps {
  count: number
  onChange: (n: number) => void
}

export default function CountPicker({ count, onChange }: CountPickerProps) {
  const [proTooltip, setProTooltip] = useState<number | null>(null)

  return (
    <div
      className="flex items-center gap-0.5"
      onClick={e => e.stopPropagation()}
    >
      <span className="text-[11px] text-[#9AA0A6] mr-1 select-none hidden sm:block">Colors</span>

      {ALL_COUNTS.map(n => {
        const isPro  = n > FREE_MAX
        const active = n === count

        return (
          <div key={n} className="relative">
            <button
              onClick={() => {
                if (isPro) setProTooltip(proTooltip === n ? null : n)
                else { setProTooltip(null); onChange(n) }
              }}
              className={`
                relative w-7 h-7 rounded-full text-[12px] font-medium
                transition-all duration-150 select-none
                ${active
                  ? 'bg-[#1A73E8] text-white'
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

            {isPro && proTooltip === n && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap
                px-3 py-2 rounded-xl bg-[#202124] border border-white/10
                text-[10px] font-medium text-white/80 text-center shadow-xl">
                <div className="text-amber-400 font-semibold mb-0.5">✦ Pro feature</div>
                <div className="text-white/55">More colors coming soon</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#202124]" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}