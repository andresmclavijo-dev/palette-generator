const SHORTCUTS = [
  { keys: ['Space'],   label: 'Generate'  },
  { keys: ['⌘', 'Z'], label: 'Undo'      },
  { keys: ['Click'],   label: 'Lock'      },
  { keys: ['Hex'],     label: 'Edit seed' },
]

export default function ShortcutLegend() {
  return (
    <div className="flex items-center gap-4 pointer-events-none select-none">
      {SHORTCUTS.map(({ keys, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {keys.map(k => (
              <kbd
                key={k}
                className="
                  px-1.5 py-0.5 rounded
                  bg-white/10 text-white/50
                  text-[9px] font-mono tracking-wider
                "
              >
                {k}
              </kbd>
            ))}
          </div>
          <span className="text-white/35 text-[10px] font-mono tracking-wider">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
