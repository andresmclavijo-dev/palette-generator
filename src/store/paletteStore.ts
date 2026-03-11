import { create } from 'zustand'
import {
  type Swatch,
  type HarmonyMode,
  makeSwatch,
  mergePalette,
  generateByMode,
} from '../lib/colorEngine'

const SEED_HEX = ['#3A86FF', '#5E9EFF', '#8AB8FF', '#B8D4FF', '#E8F1FF']
const HISTORY_LIMIT = 20

interface PaletteState {
  swatches: Swatch[]
  count: number           // active swatch count (3–5 free)
  harmonyMode: HarmonyMode
  seedColor: string | null
  history: Swatch[][]
  historyIndex: number
  // Actions
  generate: () => void
  setSwatches: (swatches: Swatch[]) => void
  setCount: (n: number) => void
  lockSwatch: (id: string) => void
  editSwatch: (id: string, hex: string) => void
  setHarmonyMode: (mode: HarmonyMode) => void
  setSeedColor: (hex: string) => void
  undo: () => void
}

function pushHistory(history: Swatch[][], index: number, snapshot: Swatch[]) {
  const trimmed = history.slice(0, index + 1)
  const next = [...trimmed, snapshot].slice(-HISTORY_LIMIT)
  return { history: next, historyIndex: next.length - 1 }
}

export const usePaletteStore = create<PaletteState>((set, get) => ({
  swatches: SEED_HEX.map(h => makeSwatch(h)),
  count: 5,
  harmonyMode: 'random',
  seedColor: null,
  history: [SEED_HEX.map(h => makeSwatch(h))],
  historyIndex: 0,

  generate: () => {
    const { swatches, harmonyMode, seedColor, count, history, historyIndex } = get()
    const seed = seedColor ?? swatches.find(s => !s.locked)?.hex ?? null
    const freshHexes = generateByMode(harmonyMode, seed, count)
    const next = mergePalette(swatches.slice(0, count), freshHexes)
    const hist = pushHistory(history, historyIndex, next)
    set({ swatches: next, ...hist })
  },

  setSwatches: (swatches) => {
    const hist = pushHistory(get().history, get().historyIndex, swatches)
    set({ swatches, count: swatches.length, ...hist })
  },

  setCount: (n) => {
    const { swatches, harmonyMode, seedColor, count, history, historyIndex } = get()
    if (n === count) return
    let next: Swatch[]
    if (n < count) {
      // Shrink — keep first n
      next = swatches.slice(0, n)
    } else {
      // Grow — generate fresh colors for new slots
      const seed = seedColor ?? swatches[0]?.hex ?? null
      const fresh = generateByMode(harmonyMode, seed, n)
      next = [
        ...swatches,
        ...Array.from({ length: n - count }, (_, i) => makeSwatch(fresh[count + i] ?? fresh[i])),
      ]
    }
    const hist = pushHistory(history, historyIndex, next)
    set({ swatches: next, count: n, ...hist })
  },

  lockSwatch: (id) =>
    set(state => ({
      swatches: state.swatches.map(s => s.id === id ? { ...s, locked: !s.locked } : s),
    })),

  editSwatch: (id, hex) => {
    const { swatches, history, historyIndex } = get()
    const next = swatches.map(s => s.id === id ? { ...s, hex } : s)
    const hist = pushHistory(history, historyIndex, next)
    set({ swatches: next, seedColor: hex, ...hist })
  },

  setHarmonyMode: (harmonyMode) => set({ harmonyMode }),
  setSeedColor: (hex) => set({ seedColor: hex }),

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return
    const prev = historyIndex - 1
    set({ swatches: history[prev], historyIndex: prev, count: history[prev].length })
  },
}))
