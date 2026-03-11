import { useState } from 'react'

const FREE_MAX  = 5
const ALL_COUNTS = [3, 4, 5, 6, 7, 8]

interface CountPickerProps {
  count: number
  onChange: (n: number) => void
}

export default function CountPicker({ count, onChange }: CountPickerProps) {
  const [proTooltip, setProTooltip] = useState<number | null>(null)

  return (
    <div
      className="flex items-center gap-0.5 p-1 rounded-full bg-black/25 backdrop-blur-md border border-white/10"
      onClick={e => e.stopPropagation()}
    >
      <span className="text-[10px] font-mono text-white/40 tracking-wider pl-2 pr-1 select-none">
        Colors
      </span>

      {ALL_COUNTS.map(n => {
        const isPro  = n > FREE_MAX
        const active = n === count

        return (
          <div key={n} className="relative">
            <button
              onClick={() => {
                if (isPro) {
                  setProTooltip(proTooltip === n ? null : n)
                } else {
                  setProTooltip(null)
                  onChange(n)
                }
              }}
              className={`
                relative w-7 h-7 rounded-full text-[11px] font-mono font-semibold
                transition-all duration-150 select-none
                ${active
                  ? 'bg-white text-black'
                  : isPro
                    ? 'text-white/22 cursor-default'
                    : 'text-white/55 hover:text-white/90 hover:bg-white/10 cursor-pointer'
                }
              `}
              aria-label={isPro ? `${n} colors — Pro` : `${n} colors`}
            >
              {n}
              {isPro && (
                <span className="absolute -top-0.5 -right-0.5 text-[7px] text-amber-400/60 leading-none select-none">
                  ✦
                </span>
              )}
            </button>

            {isPro && proTooltip === n && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap
                px-3 py-1.5 rounded-lg bg-black/85 backdrop-blur-md border border-white/10
                text-[10px] font-mono text-white/70 text-center">
                <div className="text-amber-400/90 font-semibold mb-0.5">✦ Pro feature</div>
                <div>More colors coming soon</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/85" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
