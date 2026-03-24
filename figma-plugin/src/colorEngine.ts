/**
 * Portable color engine for the Figma plugin.
 * Mirrors the core algorithms from src/lib/colorEngine.ts using chroma-js.
 */
import chroma from 'chroma-js'
import type { HarmonyMode, PaletteColor } from './types'

// ── Color naming ─────────────────────────────────────────────────
type HueEntry = { max: number; base: string; vivid?: string; dark?: string; pale?: string }

const HUE_MAP: HueEntry[] = [
  { max: 8,   base: 'Red',    vivid: 'Crimson',  dark: 'Maroon',   pale: 'Blush'    },
  { max: 20,  base: 'Red',    vivid: 'Scarlet',  dark: 'Maroon',   pale: 'Rose'     },
  { max: 32,  base: 'Orange', vivid: 'Tangerine',dark: 'Rust',     pale: 'Peach'    },
  { max: 45,  base: 'Amber',  vivid: 'Gold',     dark: 'Brown',    pale: 'Cream'    },
  { max: 58,  base: 'Yellow', vivid: 'Yellow',   dark: 'Olive',    pale: 'Butter'   },
  { max: 75,  base: 'Lime',   vivid: 'Chartreuse',dark: 'Moss',    pale: 'Mint'     },
  { max: 150, base: 'Green',  vivid: 'Emerald',  dark: 'Forest',   pale: 'Sage'     },
  { max: 175, base: 'Teal',   vivid: 'Jade',     dark: 'Teal',     pale: 'Seafoam'  },
  { max: 195, base: 'Cyan',   vivid: 'Aqua',     dark: 'Teal',     pale: 'Ice'      },
  { max: 225, base: 'Sky',    vivid: 'Azure',    dark: 'Navy',     pale: 'Mist'     },
  { max: 255, base: 'Blue',   vivid: 'Cobalt',   dark: 'Navy',     pale: 'Powder'   },
  { max: 275, base: 'Indigo', vivid: 'Indigo',   dark: 'Midnight', pale: 'Lavender' },
  { max: 295, base: 'Violet', vivid: 'Violet',   dark: 'Plum',     pale: 'Wisteria' },
  { max: 320, base: 'Purple', vivid: 'Magenta',  dark: 'Plum',     pale: 'Lilac'    },
  { max: 338, base: 'Pink',   vivid: 'Hot Pink', dark: 'Berry',    pale: 'Blush'    },
  { max: 350, base: 'Rose',   vivid: 'Rose',     dark: 'Crimson',  pale: 'Petal'    },
  { max: 360, base: 'Red',    vivid: 'Crimson',  dark: 'Maroon',   pale: 'Blush'    },
]

export function getColorName(hex: string): string {
  try {
    const [h, s, l] = chroma(hex).hsl()
    if (isNaN(s) || s < 0.06) {
      if (l > 0.93) return 'White'
      if (l > 0.78) return 'Silver'
      if (l > 0.55) return 'Light Gray'
      if (l > 0.30) return 'Gray'
      if (l > 0.12) return 'Dark Gray'
      return 'Black'
    }
    const hue = isNaN(h) ? 0 : ((h % 360) + 360) % 360
    const entry = HUE_MAP.find(e => hue <= e.max) ?? HUE_MAP[HUE_MAP.length - 1]

    if (l > 0.88) return entry.pale ?? `Light ${entry.base}`
    if (l > 0.78) return `Pale ${entry.base}`
    if (l > 0.70) return `Light ${entry.base}`
    if (l < 0.15) return `Deep ${entry.dark ?? entry.base}`
    if (l < 0.22) return entry.dark ?? `Dark ${entry.base}`
    if (l < 0.30) return `Dark ${entry.base}`
    if (l < 0.38) return entry.dark ?? `Deep ${entry.base}`
    if (s > 0.85) return entry.vivid ?? `Vivid ${entry.base}`
    if (s > 0.65) return entry.vivid ?? entry.base
    if (s < 0.25) return `Muted ${entry.base}`
    if (s < 0.45) return `Soft ${entry.base}`

    return entry.base
  } catch {
    return ''
  }
}

// ── Palette generators ───────────────────────────────────────────
function randomPalette(count: number): string[] {
  return Array.from({ length: count }, () => chroma.random().hex())
}

function analogousPalette(seed: string, count: number): string[] {
  const [h, s, l] = chroma(seed).hsl()
  const step = count <= 3 ? 35 : count <= 4 ? 30 : 25
  return Array.from({ length: count }, (_, i) => {
    const offset = (i - Math.floor(count / 2)) * step
    return chroma.hsl(((h + offset) + 360) % 360, s, l).hex()
  })
}

function monochromaticPalette(seed: string, count: number): string[] {
  const [h, s] = chroma(seed).hsl()
  return Array.from({ length: count }, (_, i) =>
    chroma.hsl(h, s, 0.15 + i * (0.70 / (count - 1))).hex()
  )
}

function complementaryPalette(seed: string, count: number): string[] {
  const [h, s, l] = chroma(seed).hsl()
  const all = [
    chroma.hsl(h, s, Math.min(l + 0.15, 0.88)).hex(),
    chroma.hsl(h, s, l).hex(),
    chroma.hsl(h, s, Math.max(l - 0.15, 0.12)).hex(),
    chroma.hsl((h + 180) % 360, s, l).hex(),
    chroma.hsl((h + 180) % 360, s, Math.max(l - 0.12, 0.12)).hex(),
  ]
  return all.slice(0, count)
}

function triadicPalette(seed: string, count: number): string[] {
  const [h, s, l] = chroma(seed).hsl()
  const all = [
    chroma.hsl(h, s, l).hex(),
    chroma.hsl(h, s, Math.max(l - 0.18, 0.12)).hex(),
    chroma.hsl((h + 120) % 360, s, l).hex(),
    chroma.hsl((h + 240) % 360, s, l).hex(),
    chroma.hsl((h + 240) % 360, s, Math.max(l - 0.18, 0.12)).hex(),
  ]
  return all.slice(0, count)
}

export function generateByMode(mode: HarmonyMode, seed: string | null, count: number): string[] {
  const s = seed ?? chroma.random().hex()
  switch (mode) {
    case 'analogous':     return analogousPalette(s, count)
    case 'monochromatic': return monochromaticPalette(s, count)
    case 'complementary': return complementaryPalette(s, count)
    case 'triadic':       return triadicPalette(s, count)
    case 'random':
    default:              return randomPalette(count)
  }
}

// ── Helpers ──────────────────────────────────────────────────────
export function hexToFigmaRGB(hex: string): { r: number; g: number; b: number } {
  const [r, g, b] = chroma(hex).rgb()
  return { r: r / 255, g: g / 255, b: b / 255 }
}

export function figmaRGBToHex(r: number, g: number, b: number): string {
  return chroma(r * 255, g * 255, b * 255).hex()
}

// ── Shade scale generation ──────────────────────────────────────
const SHADE_STEPS: { shade: number; mix: string; amount: number }[] = [
  { shade: 50,  mix: '#ffffff', amount: 0.95 },
  { shade: 100, mix: '#ffffff', amount: 0.85 },
  { shade: 200, mix: '#ffffff', amount: 0.70 },
  { shade: 300, mix: '#ffffff', amount: 0.50 },
  { shade: 400, mix: '#ffffff', amount: 0.25 },
  { shade: 500, mix: '#000000', amount: 0.00 }, // base
  { shade: 600, mix: '#000000', amount: 0.15 },
  { shade: 700, mix: '#000000', amount: 0.30 },
  { shade: 800, mix: '#000000', amount: 0.50 },
  { shade: 900, mix: '#000000', amount: 0.70 },
]

export function generateShadeScale(hex: string): { shade: number; hex: string }[] {
  return SHADE_STEPS.map(({ shade, mix, amount }) => ({
    shade,
    hex: amount === 0 ? hex : chroma.mix(hex, mix, amount, 'lab').hex(),
  }))
}

export function makePaletteColors(hexes: string[], lockedIndices: number[], previous: PaletteColor[]): PaletteColor[] {
  return hexes.map((hex, i) => {
    if (lockedIndices.includes(i) && previous[i]) {
      return previous[i]
    }
    return { hex, name: getColorName(hex), locked: false }
  })
}
