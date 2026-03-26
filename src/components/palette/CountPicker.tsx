import { usePro } from '../../hooks/usePro'
import Tooltip from '../ui/Tooltip'
import { analytics } from '../../lib/posthog'
import { PRO_GATES } from '../../lib/proFeatures'

const FREE_MAX   = PRO_GATES.MAX_FREE_COLORS
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
    <Tooltip text="Number of colors in palette">
      <div
        className="flex items-center gap-2 rounded-full bg-card h-10 px-3"
        style={{ border: '1px solid hsl(var(--border))' }}
        onClick={e => e.stopPropagation()}
      >
        {counts.map(n => {
          const isProCount = n > FREE_MAX
          const locked = isProCount && !isPro
          const active = n === count

          return (
            <button
              key={n}
              onClick={() => {
                if (locked) {
                  analytics.track('pro_gate_hit', { feature: `${n}_colors`, source: 'color_count' })
                  onProGate()
                } else onChange(n)
              }}
              className={`
                flex items-center justify-center
                w-6 h-6 rounded-full
                text-[11px] font-medium select-none
                transition-all duration-150 cursor-pointer
                ${active
                  ? 'bg-brand-violet text-brand-warm'
                  : 'bg-card hover:bg-surface'
                }
              `}
              style={{
                color: active ? 'hsl(var(--surface-warm))' : locked ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
              }}
              aria-label={locked ? `${n} colors — Pro` : `${n} colors`}
            >
              {n}
            </button>
          )
        })}
      </div>
    </Tooltip>
  )
}
