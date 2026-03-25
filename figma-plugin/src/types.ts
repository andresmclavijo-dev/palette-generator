// ── Shared types between plugin sandbox (code.ts) and UI (ui.ts) ──

export type HarmonyMode = 'random' | 'analogous' | 'monochromatic' | 'complementary' | 'triadic'

export interface PaletteColor {
  hex: string
  name: string
  locked: boolean
}

export interface SavedPalette {
  id: string
  name: string
  colors: PaletteColor[]
  date: string
}

// Messages from UI → Plugin sandbox
export type UIMessage =
  | { type: 'generate'; mode: HarmonyMode; count: number; seedColor: string | null; lockedIndices: number[] }
  | { type: 'apply-to-selection'; colors: string[] }
  | { type: 'push-variables'; colors: PaletteColor[]; prefix: string; includeShades: boolean }
  | { type: 'extract-from-selection' }
  | { type: 'set-onboarded' }
  | { type: 'notify'; message: string }
  | { type: 'ui-ready'; count: number }
  | { type: 'save-palette'; name: string; colors: PaletteColor[] }
  | { type: 'load-palettes' }
  | { type: 'delete-palette'; id: string }
  | { type: 'set-ai-usage'; usage: { count: number; date: string } }
  | { type: 'set-auth'; token: string; user: { id: string; email: string; isPro: boolean } }
  | { type: 'clear-auth' }
  | { type: 'get-auth' }

// Messages from Plugin sandbox → UI
export type PluginMessage =
  | { type: 'palette-generated'; colors: PaletteColor[] }
  | { type: 'colors-applied'; count: number }
  | { type: 'variables-pushed'; count: number }
  | { type: 'colors-extracted'; colors: string[] }
  | { type: 'selection-changed'; hasSelection: boolean; count: number }
  | { type: 'init'; hasSeenOnboarding: boolean; palettes: SavedPalette[]; aiUsage: { count: number; date: string } | null; auth: { token: string; user: { id: string; email: string; isPro: boolean } } | null }
  | { type: 'error'; message: string }
  | { type: 'palettes-loaded'; palettes: SavedPalette[] }
  | { type: 'palette-saved'; palette: SavedPalette }
  | { type: 'palette-deleted'; id: string }
