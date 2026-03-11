import { useEffect } from 'react'
import PaletteCanvas from './components/palette/PaletteCanvas'
import HarmonyPicker from './components/palette/HarmonyPicker'
import ShortcutLegend from './components/palette/ShortcutLegend'
import { usePaletteStore } from './store/paletteStore'

export default function App() {
  const { swatches, harmonyMode, generate, lockSwatch, editSwatch, setHarmonyMode, undo } =
    usePaletteStore()

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const inInput = e.target instanceof HTMLInputElement
      if (inInput) return

      if (e.code === 'Space') {
        e.preventDefault()
        generate()
      }

      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        undo()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [generate, undo])

  return (
    <div className="w-screen h-screen overflow-hidden relative">

      {/* ── Palette ── */}
      <PaletteCanvas
        swatches={swatches}
        onLock={lockSwatch}
        onEdit={editSwatch}
      />

      {/* ── Bottom chrome — harmony picker + shortcut legend ── */}
      <div
        className="
          absolute bottom-0 left-0 right-0
          flex items-end justify-between
          px-6 pb-5 pt-16
          pointer-events-none
          bg-gradient-to-t from-black/20 to-transparent
        "
      >
        {/* Shortcut legend — left */}
        <ShortcutLegend />

        {/* Harmony picker — center */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-5 pointer-events-auto">
          <HarmonyPicker mode={harmonyMode} onChange={setHarmonyMode} />
        </div>

        {/* Locked count — right */}
        <LockedCount count={swatches.filter(s => s.locked).length} />
      </div>
    </div>
  )
}

// ── Small indicator showing how many swatches are locked ────────
function LockedCount({ count }: { count: number }) {
  if (count === 0) return <div className="w-16" /> // spacer to keep layout balanced

  return (
    <div className="flex items-center gap-1.5 pointer-events-none select-none">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span className="text-[10px] font-mono text-white/40 tracking-wider">
        {count} locked
      </span>
    </div>
  )
}

