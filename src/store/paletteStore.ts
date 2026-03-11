// Zustand store — wired in Milestone 2
// Placeholder to lock in the interface shape now.

import { create } from 'zustand'
import type { Swatch } from '../lib/colorEngine'

export interface PaletteState {
  swatches: Swatch[]
  harmonyMode: 'random' | 'analogous' | 'monochromatic' | 'complementary'
  seedColor: string | null
  // Actions
  setSwatches: (swatches: Swatch[]) => void
  lockSwatch: (id: string) => void
  editSwatch: (id: string, hex: string) => void
  setHarmonyMode: (mode: PaletteState['harmonyMode']) => void
}

export const usePaletteStore = create<PaletteState>((set) => ({
  swatches: [],
  harmonyMode: 'random',
  seedColor: null,

  setSwatches: (swatches) => set({ swatches }),

  lockSwatch: (id) =>
    set((state) => ({
      swatches: state.swatches.map((s) =>
        s.id === id ? { ...s, locked: !s.locked } : s
      ),
    })),

  editSwatch: (id, hex) =>
    set((state) => ({
      swatches: state.swatches.map((s) =>
        s.id === id ? { ...s, hex } : s
      ),
    })),

  setHarmonyMode: (harmonyMode) => set({ harmonyMode }),
}))
