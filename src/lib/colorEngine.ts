import chroma from 'chroma-js'

export type HarmonyMode = 'random' | 'analogous' | 'monochromatic' | 'complementary' | 'triadic'

// ── Shades (light → dark, N steps) ────────────────────────────────
export function generateShades(hex: string, count = 10): string[] {
  try {
    const [h, s] = chroma(hex).hsl()
    const safeS = isNaN(s) ? 0 : s
    return Array.from({ length: count }, (_, i) => {
      const l = 0.95 - i * (0.80 / (count - 1))
      return chroma.hsl(h, safeS, l).hex()
    })
  } catch {
    return Array.from({ length: count }, () => '#888888')
  }
}

// ── Color naming — refined hue ranges ─────────────────────────────
// Each entry: [hueMax, name, vivid override, dark override]
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
    // Achromatic
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

    // More granular naming to avoid duplicates in analogous/random modes
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

// ── Swatch ────────────────────────────────────────────────────────
export interface Swatch {
  id: string
  hex: string
  locked: boolean
}

// ── Generators ────────────────────────────────────────────────────
export function randomPalette(count = 5): string[] {
  return Array.from({ length: count }, () => chroma.random().hex())
}

export function analogousPalette(seed: string, count = 5): string[] {
  const [h, s, l] = chroma(seed).hsl()
  const step = count <= 3 ? 35 : count <= 4 ? 30 : 25
  return Array.from({ length: count }, (_, i) => {
    const offset = (i - Math.floor(count / 2)) * step
    return chroma.hsl(((h + offset) + 360) % 360, s, l).hex()
  })
}

export function monochromaticPalette(seed: string, count = 5): string[] {
  const [h, s] = chroma(seed).hsl()
  return Array.from({ length: count }, (_, i) =>
    chroma.hsl(h, s, 0.15 + i * (0.70 / (count - 1))).hex()
  )
}

export function complementaryPalette(seed: string, count = 5): string[] {
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

export function triadicPalette(seed: string, count = 5): string[] {
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

export function generateByMode(mode: HarmonyMode, seed: string | null, count = 5): string[] {
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

// ── Swatch factory ────────────────────────────────────────────────
export function makeSwatch(hex: string, locked = false): Swatch {
  return { id: crypto.randomUUID(), hex, locked }
}

export function mergePalette(current: Swatch[], freshHexes: string[]): Swatch[] {
  return Array.from({ length: freshHexes.length }, (_, i) => {
    const existing = current[i]
    if (existing?.locked) return existing
    // Preserve ID so React reuses the DOM node → CSS background transition animates
    if (existing) return { ...existing, hex: freshHexes[i] }
    return makeSwatch(freshHexes[i])
  })
}

// ── Visual helpers ────────────────────────────────────────────────
export function isNearWhite(hex: string): boolean {
  try { return chroma(hex).get('hsl.l') > 0.88 } catch { return false }
}

export function isLight(hex: string): boolean {
  try { return chroma(hex).luminance() > 0.4 } catch { return true }
}

export function readableOn(bg: string): string {
  try {
    return chroma.contrast(bg, '#ffffff') > chroma.contrast(bg, '#000000')
      ? '#ffffff' : '#000000'
  } catch { return '#000000' }
}

export function getColorInfo(hex: string): { rgb: string; hsl: string } {
  try {
    const c = chroma(hex)
    const [r, g, b] = c.rgb()
    const [h, s, l] = c.hsl()
    return {
      rgb: `${r}, ${g}, ${b}`,
      hsl: `${Math.round(isNaN(h) ? 0 : h)}°, ${Math.round((isNaN(s) ? 0 : s) * 100)}%, ${Math.round(l * 100)}%`,
    }
  } catch {
    return { rgb: '0, 0, 0', hsl: '0°, 0%, 0%' }
  }
}

export function getContrastBadge(hex: string): { ratio: number; level: 'AAA' | 'AA' | 'Fail'; pass: boolean } {
  try {
    const white = chroma.contrast(hex, '#ffffff')
    const black = chroma.contrast(hex, '#000000')
    const ratio = Math.max(white, black)
    const rounded = Math.round(ratio * 10) / 10
    if (ratio >= 7) return { ratio: rounded, level: 'AAA', pass: true }
    if (ratio >= 4.5) return { ratio: rounded, level: 'AA', pass: true }
    return { ratio: rounded, level: 'Fail', pass: false }
  } catch {
    return { ratio: 1, level: 'Fail', pass: false }
  }
}

export function parseHex(raw: string): string | null {
  const c = raw.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{6}$/.test(c)) return `#${c.toUpperCase()}`
  if (/^[0-9a-fA-F]{3}$/.test(c)) return `#${c.split('').map(x => x+x).join('').toUpperCase()}`
  return null
}

// ── Slugify color name for CSS variables ─────────────────────────
export function slugifyColorName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// ── Deduplicate color names across a palette ─────────────────────
export function getDeduplicatedNames(hexes: string[]): string[] {
  const names = hexes.map(h => getColorName(h))
  const freq: Record<string, number> = {}
  for (const n of names) if (n) freq[n] = (freq[n] || 0) + 1
  const seen: Record<string, number> = {}
  return names.map(name => {
    if (!name || freq[name] <= 1) return name
    seen[name] = (seen[name] || 0) + 1
    return seen[name] === 1 ? name : `${name} ${seen[name]}`
  })
}

// ── Tailwind shade labels ────────────────────────────────────────
export const TAILWIND_SHADE_LABELS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

export function encodePalette(hexes: string[]): string {
  return hexes.map(h => h.replace('#', '')).join('-')
}

export function decodePalette(param: string): string[] | null {
  const parts = param.split('-')
  if (parts.length < 3 || parts.length > 8) return null
  const valid = parts.every(p => /^[0-9a-fA-F]{6}$/.test(p))
  if (!valid) return null
  return parts.map(p => `#${p.toUpperCase()}`)
}
