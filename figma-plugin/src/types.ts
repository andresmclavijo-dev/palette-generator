// ── Shared types between plugin sandbox (code.ts) and UI (ui.ts) ──

export type HarmonyMode = 'random' | 'analogous' | 'monochromatic' | 'complementary' | 'triadic'

export interface PaletteColor {
  hex: string
  name: string
  locked: boolean
}

// Messages from UI → Plugin sandbox
export type UIMessage =
  | { type: 'generate'; mode: HarmonyMode; count: number; seedColor: string | null; lockedIndices: number[] }
  | { type: 'apply-to-selection'; colors: string[] }
  | { type: 'push-variables'; colors: PaletteColor[]; prefix: string; includeShades: boolean }
  | { type: 'ai-generate'; prompt: string; count: number }
  | { type: 'extract-from-selection' }
  | { type: 'set-onboarded' }
  | { type: 'notify'; message: string }
  | { type: 'ui-ready'; count: number }

// Messages from Plugin sandbox → UI
export type PluginMessage =
  | { type: 'palette-generated'; colors: PaletteColor[] }
  | { type: 'colors-applied'; count: number }
  | { type: 'variables-pushed'; count: number }
  | { type: 'colors-extracted'; colors: string[] }
  | { type: 'selection-changed'; hasSelection: boolean; count: number }
  | { type: 'ai-loading'; loading: boolean }
  | { type: 'init'; hasSeenOnboarding: boolean }
  | { type: 'error'; message: string }
