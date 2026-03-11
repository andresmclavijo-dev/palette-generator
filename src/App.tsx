import { useCallback, useEffect, useState } from 'react'
import PaletteCanvas from './components/palette/PaletteCanvas'
import { randomPalette } from './lib/colorEngine'

// Seed palette — hardcoded for Milestone 1
const SEED_PALETTE = ['#3A86FF', '#5E9EFF', '#8AB8FF', '#B8D4FF', '#E8F1FF']

export default function App() {
  const [palette, setPalette] = useState<string[]>(SEED_PALETTE)
  const [isAnimating, setIsAnimating] = useState(false)

  // Milestone 1: regenerate with random colors on spacebar
  const regeneratePalette = useCallback(() => {
    setIsAnimating(true)
    setPalette(randomPalette(5))
    setTimeout(() => setIsAnimating(false), 300)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore spacebar when focused on an input
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        regeneratePalette()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [regeneratePalette])

  return (
    <div className="w-screen h-screen overflow-hidden relative">

      {/* Palette */}
      <div
        className="w-full h-full transition-opacity duration-200"
        style={{ opacity: isAnimating ? 0.6 : 1 }}
      >
        <PaletteCanvas hexColors={palette} />
      </div>

      {/* Spacebar hint — fades out on first interaction */}
      <SpacebarHint onDismiss={regeneratePalette} />
    </div>
  )
}

// Small hint overlay — auto-dismisses after first generation
function SpacebarHint({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(true)

  const handleClick = () => {
    setVisible(false)
    onDismiss()
  }

  if (!visible) return null

  return (
    <div
      className="
        absolute bottom-8 left-1/2 -translate-x-1/2
        flex items-center gap-2 px-4 py-2 rounded-full
        bg-black/20 backdrop-blur-sm
        text-white/70 text-xs font-mono tracking-widest
        cursor-pointer select-none
        hover:bg-black/30 transition-colors duration-150
        animate-pulse
      "
      onClick={handleClick}
    >
      <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/90 text-[10px]">
        SPACE
      </kbd>
      <span>to generate</span>
    </div>
  )
}
