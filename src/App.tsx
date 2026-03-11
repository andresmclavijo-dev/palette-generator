import { useEffect, useState } from 'react'
import PaletteCanvas from './components/palette/PaletteCanvas'
import HarmonyPicker from './components/palette/HarmonyPicker'
import ShortcutLegend from './components/palette/ShortcutLegend'
import { usePaletteStore } from './store/paletteStore'
import { makeSwatch } from './lib/colorEngine'

function encodePalette(hexes: string[]): string {
  return hexes.map(h => h.replace('#', '')).join('-')
}

function decodePalette(param: string): string[] | null {
  const parts = param.split('-')
  if (parts.length !== 5) return null
  const valid = parts.every(p => /^[0-9a-fA-F]{6}$/.test(p))
  if (!valid) return null
  return parts.map(p => `#${p.toUpperCase()}`)
}

export default function App() {
  const { swatches, harmonyMode, generate, lockSwatch, editSwatch, setHarmonyMode, undo, setSwatches } = usePaletteStore()
  const [shareCopied, setShareCopied] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('p')
    if (p) {
      const hexes = decodePalette(p)
      if (hexes) setSwatches(hexes.map(h => makeSwatch(h)))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const encoded = encodePalette(swatches.map(s => s.hex))
    const url = new URL(window.location.href)
    url.searchParams.set('p', encoded)
    window.history.replaceState(null, '', url.toString())
  }, [swatches])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') { e.preventDefault(); generate() }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [generate, undo])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1600)
    } catch { /* silent */ }
  }

  const lockedCount = swatches.filter(s => s.locked).length

  return (
    <div className="w-screen h-screen overflow-hidden relative">
      <PaletteCanvas swatches={swatches} onLock={lockSwatch} onEdit={editSwatch} />
      <div
        className="absolute bottom-0 left-0 right-0 h-14 flex items-center justify-between px-4 bg-black/25 backdrop-blur-md border-t border-white/5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 w-32">
          <ShortcutLegend />
          {lockedCount > 0 && (
            <span className="text-[10px] font-mono text-white/35 tracking-wider select-none">
              {lockedCount} locked
            </span>
          )}
        </div>
        <HarmonyPicker mode={harmonyMode} onChange={setHarmonyMode} />
        <div className="flex items-center justify-end w-32">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white/90 text-[10px] font-mono tracking-wider transition-all duration-150 select-none"
          >
            <ShareIcon size={10} />
            {shareCopied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ShareIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}
