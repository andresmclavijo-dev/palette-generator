import type { HarmonyMode } from '../../lib/colorEngine'

const MODES: { value: HarmonyMode; label: string }[] = [
  { value: 'random',        label: 'Random'        },
  { value: 'analogous',     label: 'Analogous'     },
  { value: 'monochromatic', label: 'Monochromatic' },
  { value: 'complementary', label: 'Complementary' },
  { value: 'triadic',       label: 'Triadic'       },
]

interface HarmonyPickerProps {
  mode: HarmonyMode
  onChange: (mode: HarmonyMode) => void
}

export default function HarmonyPicker({ mode, onChange }: HarmonyPickerProps) {
  return (
    <div
      className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-none snap-x snap-mandatory"
      style={{ WebkitOverflowScrolling: 'touch' }}
      onClick={e => e.stopPropagation()}
    >
      {MODES.map(m => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`
            px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap
            transition-all duration-150 cursor-pointer select-none shrink-0 snap-start
            ${mode === m.value
              ? 'bg-[#1A73E8] text-white'
              : 'text-[#5F6368] hover:bg-[#F1F3F4] hover:text-[#202124]'
            }
          `}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}