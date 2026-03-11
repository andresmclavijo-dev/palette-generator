import { useState } from 'react'

const SHORTCUTS = [
  { keys: ['Space'],   label: 'Generate'      },
  { keys: ['⌘Z'],     label: 'Undo'          },
  { keys: ['Click'],   label: 'Lock/unlock'   },
  { keys: ['2×Hex'],  label: 'Edit color'    },
  { keys: ['Shades'],  label: 'View shades'   },
]

export default function ShortcutLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      {/* ? toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="
          w-7 h-7 rounded-full flex items-center justify-center
          bg-black/20 hover:bg-black/35 backdrop-blur-sm
          text-white/50 hover:text-white/80
          text-[11px] font-mono font-bold
          transition-all duration-150 select-none
        "
        aria-label="Keyboard shortcuts"
      >
        ?
      </button>

      {/* Popup */}
      {open && (
        <div
          className="
            absolute bottom-10 left-0
            flex flex-col gap-2 p-3 rounded-xl
            bg-black/50 backdrop-blur-md border border-white/10
            min-w-[180px]
          "
        >
          {SHORTCUTS.map(({ keys, label }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <span className="text-white/40 text-[10px] font-mono tracking-wider">{label}</span>
              <div className="flex gap-1">
                {keys.map(k => (
                  <kbd key={k} className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 text-[9px] font-mono">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

