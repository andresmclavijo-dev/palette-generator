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
  harmonyMode: HarmonyMode
  seedColor: string | null
  history: Swatch[][]
  historyIndex: number

  // Actions
  generate: () => void
  setSwatches: (swatches: Swatch[]) => void
  lockSwatch: (id: string) => void
  editSwatch: (id: string, hex: string) => void
  setHarmonyMode: (mode: HarmonyMode) => void
  setSeedColor: (hex: string) => void
  undo: () => void
}

function pushHistory(history: Swatch[][], index: number, snapshot: Swatch[]): {
  history: Swatch[][]
  historyIndex: number
} {
  // Trim any forward history after current index, then push
  const trimmed = history.slice(0, index + 1)
  const next = [...trimmed, snapshot].slice(-HISTORY_LIMIT)
  return { history: next, historyIndex: next.length - 1 }
}

export const usePaletteStore = create<PaletteState>((set, get) => ({
  swatches: SEED_HEX.map(h => makeSwatch(h)),
  harmonyMode: 'random',
  seedColor: null,
  history: [SEED_HEX.map(h => makeSwatch(h))],
  historyIndex: 0,

  generate: () => {
    const { swatches, harmonyMode, seedColor, history, historyIndex } = get()
    const seed = seedColor ?? swatches.find(s => !s.locked)?.hex ?? null
    const freshHexes = generateByMode(harmonyMode, seed)
    const next = mergePalette(swatches, freshHexes)
    const hist = pushHistory(history, historyIndex, next)
    set({ swatches: next, ...hist })
  },

  setSwatches: (swatches) => {
    const hist = pushHistory(get().history, get().historyIndex, swatches)
    set({ swatches, ...hist })
  },

  lockSwatch: (id) =>
    set(state => ({
      swatches: state.swatches.map(s =>
        s.id === id ? { ...s, locked: !s.locked } : s
      ),
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
    set({ swatches: history[prev], historyIndex: prev })
  },
}))

