import ProBadge from '../ui/ProBadge'
import { usePro } from '../../hooks/usePro'

const FREE_MAX   = 5
const ALL_COUNTS = [3, 4, 5, 6, 7, 8]
const COMPACT_COUNTS = [3, 4, 5, 6]

interface CountPickerProps {
  count: number
  onChange: (n: number) => void
  onProGate: () => void
  compact?: boolean
}

export default function CountPicker({ count, onChange, onProGate, compact }: CountPickerProps) {
  const { isPro } = usePro()
  const counts = compact ? COMPACT_COUNTS : ALL_COUNTS

  return (
    <div
      className="flex items-center gap-1"
      onClick={e => e.stopPropagation()}
    >
      {!compact && <span className="text-[11px] text-[#9AA0A6] mr-0.5 select-none hidden sm:block">Colors</span>}

      {counts.map(n => {
        const isProCount = n > FREE_MAX
        const locked = isProCount && !isPro
        const active = n === count

        return (
          <button
            key={n}
            onClick={() => {
              if (locked) onProGate()
              else onChange(n)
            }}
            className={`
              relative w-8 h-8 rounded-full text-[13px] font-semibold
              transition-all duration-150 select-none
              flex items-center justify-center
              ${active
                ? 'bg-brand-blue text-white shadow-sm'
                : locked
                  ? 'text-[#BDBDBD] cursor-default'
                  : 'text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124] cursor-pointer'
              }
            `}
            aria-label={locked ? `${n} colors — Pro` : `${n} colors`}
          >
            {n}
            {locked && (
              <span className="absolute -top-1.5 -right-1.5">
                <ProBadge />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
