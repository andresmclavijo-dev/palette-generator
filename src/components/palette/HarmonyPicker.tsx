import type { HarmonyMode } from '../../lib/colorEngine'

const MODES: { value: HarmonyMode; label: string }[] = [
  { value: 'random',         label: 'Random'        },
  { value: 'analogous',      label: 'Analogous'     },
  { value: 'monochromatic',  label: 'Mono'          },
  { value: 'complementary',  label: 'Complement'    },
  { value: 'triadic',        label: 'Triadic'       },
]

interface HarmonyPickerProps {
  mode: HarmonyMode
  onChange: (mode: HarmonyMode) => void
}

export default function HarmonyPicker({ mode, onChange }: HarmonyPickerProps) {
  return (
    <div
      className="
        flex items-center gap-0.5 p-1 rounded-full
        bg-black/25 backdrop-blur-md
        border border-white/10
      "
      // Prevent clicks from bubbling to swatch lock handler
      onClick={e => e.stopPropagation()}
    >
      {MODES.map(m => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`
            px-3 py-1 rounded-full text-[11px] font-mono tracking-wider
            transition-all duration-150 cursor-pointer
            ${mode === m.value
              ? 'bg-white text-black font-semibold'
              : 'text-white/60 hover:text-white/90 hover:bg-white/10'
            }
          `}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
