import chroma from 'chroma-js'

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
    chroma.hsl(h + (i - 2) * 30, s, l).hex()
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
  return [0, 15, -15, 180, 195].map(offset =>
    chroma.hsl(h + offset, s, l).hex()
  )
}

// --- Swatch factory ---

export function makeSwatch(hex: string): Swatch {
  return {
    id: crypto.randomUUID(),
    hex,
    locked: false,
  }
}

// --- Merge locked swatches with fresh generation ---

export function mergePalette(current: Swatch[], freshHexes: string[]): Swatch[] {
  return current.map((swatch, i) =>
    swatch.locked ? swatch : makeSwatch(freshHexes[i])
  )
}

// --- Contrast helper (WCAG AA threshold) ---

export function getContrastLevel(hex: string): 'AA' | 'AAA' | 'fail' {
  const ratio = chroma.contrast(hex, '#ffffff')
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  return 'fail'
}

// --- Readable label color (black or white) ---

export function readableOn(bg: string): string {
  return chroma.contrast(bg, '#ffffff') > chroma.contrast(bg, '#000000')
    ? '#ffffff'
    : '#000000'
}
