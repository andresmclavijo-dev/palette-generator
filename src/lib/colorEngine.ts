import chroma from 'chroma-js'

export type HarmonyMode = 'random' | 'analogous' | 'monochromatic' | 'complementary' | 'triadic'

// --- Shades (light → dark, 10 steps) ---

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

// --- Color naming (HSL-based, no external deps) ---

const HUE_NAMES: [number, string][] = [
  [15,  'Red'],
  [30,  'Orange'],
  [50,  'Yellow'],
  [70,  'Lime'],
  [150, 'Green'],
  [185, 'Teal'],
  [210, 'Cyan'],
  [250, 'Blue'],
  [280, 'Indigo'],
  [320, 'Purple'],
  [345, 'Pink'],
  [360, 'Red'],
]

export function getColorName(hex: string): string {
  try {
    const [h, s, l] = chroma(hex).hsl()
    if (s < 0.08) {
      if (l > 0.92) return 'White'
      if (l > 0.70) return 'Light Gray'
      if (l > 0.40) return 'Gray'
      if (l > 0.15) return 'Dark Gray'
      return 'Black'
    }
    const hue = isNaN(h) ? 0 : h
    const hueName = HUE_NAMES.find(([max]) => hue <= max)?.[1] ?? 'Red'
    const lightPrefix =
      l > 0.88 ? 'Pale '   :
      l > 0.72 ? 'Light '  :
      l > 0.55 ? ''        :
      l > 0.35 ? 'Deep '   : 'Dark '
    const satSuffix = s < 0.25 ? ' Mist' : s > 0.80 ? ' Vivid' : ''
    return `${lightPrefix}${hueName}${satSuffix}`
  } catch {
    return ''
  }
}

export interface Swatch {
  id: string
  hex: string
  locked: boolean
}

// --- Generators ---

export function randomPalette(count = 5): string[] {
  return Array.from({ length: count }, () => chroma.random().hex())
}

export function analogousPalette(seed: string, count = 5): string[] {
  const [h, s, l] = chroma(seed).hsl()
  return Array.from({ length: count }, (_, i) =>
    chroma.hsl((h + (i - 2) * 28 + 360) % 360, s, l).hex()
  )
}

export function monochromaticPalette(seed: string, count = 5): string[] {
  const [h, s] = chroma(seed).hsl()
  return Array.from({ length: count }, (_, i) =>
    chroma.hsl(h, s, 0.15 + i * 0.17).hex()
  )
}

export function complementaryPalette(seed: string): string[] {
  const [h, s, l] = chroma(seed).hsl()
  // Two shades of seed + two shades of complement
  return [
    chroma.hsl(h, s, Math.min(l + 0.12, 0.9)).hex(),
    chroma.hsl(h, s, l).hex(),
    chroma.hsl(h, s, Math.max(l - 0.12, 0.1)).hex(),
    chroma.hsl((h + 180) % 360, s, l).hex(),
    chroma.hsl((h + 180) % 360, s, Math.max(l - 0.1, 0.1)).hex(),
  ]
}

export function triadicPalette(seed: string): string[] {
  const [h, s, l] = chroma(seed).hsl()
  return [
    chroma.hsl(h, s, l).hex(),
    chroma.hsl(h, s, Math.max(l - 0.15, 0.1)).hex(),
    chroma.hsl((h + 120) % 360, s, l).hex(),
    chroma.hsl((h + 240) % 360, s, l).hex(),
    chroma.hsl((h + 240) % 360, s, Math.max(l - 0.15, 0.1)).hex(),
  ]
}

// --- Dispatch by mode ---

export function generateByMode(mode: HarmonyMode, seed: string | null, count = 5): string[] {
  const s = seed ?? chroma.random().hex()
  switch (mode) {
    case 'analogous':      return analogousPalette(s, count)
    case 'monochromatic':  return monochromaticPalette(s, count)
    case 'complementary':  return complementaryPalette(s)
    case 'triadic':        return triadicPalette(s)
    case 'random':
    default:               return randomPalette(count)
  }
}

// --- Swatch factory ---

export function makeSwatch(hex: string, locked = false): Swatch {
  return { id: crypto.randomUUID(), hex, locked }
}

// --- Merge: locked swatches survive regeneration ---

export function mergePalette(current: Swatch[], freshHexes: string[]): Swatch[] {
  return current.map((swatch, i) =>
    swatch.locked ? swatch : makeSwatch(freshHexes[i])
  )
}

// --- Visual helpers ---

/** True when lightness > 0.88 — swatch needs an edge shadow */
export function isNearWhite(hex: string): boolean {
  try {
    return chroma(hex).get('hsl.l') > 0.88
  } catch {
    return false
  }
}

/** Returns '#ffffff' or '#000000' for best readability on bg */
export function readableOn(bg: string): string {
  try {
    return chroma.contrast(bg, '#ffffff') > chroma.contrast(bg, '#000000')
      ? '#ffffff'
      : '#000000'
  } catch {
    return '#000000'
  }
}

/** Validate a hex string — returns cleaned hex or null */
export function parseHex(raw: string): string | null {
  const cleaned = raw.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) return `#${cleaned.toUpperCase()}`
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const expanded = cleaned.split('').map(c => c + c).join('')
    return `#${expanded.toUpperCase()}`
  }
  return null
}

// --- Contrast helper (WCAG) ---

export function getContrastLevel(hex: string): 'AA' | 'AAA' | 'fail' {
  const ratio = chroma.contrast(hex, '#ffffff')
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  return 'fail'
}
