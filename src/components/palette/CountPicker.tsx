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
      className="flex items-center gap-2 rounded-full bg-white h-10 px-3"
      style={{ border: '1px solid #e8e8e8' }}
      onClick={e => e.stopPropagation()}
    >
      {/* Label removed — context is obvious from the number buttons */}

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
              flex items-center justify-center
              w-6 h-6 rounded-full
              text-[11px] font-medium select-none
              transition-all duration-150 cursor-pointer
              ${active
                ? 'bg-brand-violet text-brand-warm'
                : 'bg-white hover:bg-surface-secondary'
              }
            `}
            style={{
              color: active ? '#FAFAF8' : locked ? '#bbbbbb' : '#1a1a2e',
            }}
            aria-label={locked ? `${n} colors — Pro` : `${n} colors`}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
