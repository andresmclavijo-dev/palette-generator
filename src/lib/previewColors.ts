import chroma from 'chroma-js'

export interface PreviewPalette {
  /** Darkest color in the palette */
  darkest: string
  /** Lightest color in the palette */
  lightest: string
  /** Most saturated/vibrant color */
  primary: string
  /** Second most saturated color (falls back to primary) */
  secondary: string
  /** Third color (falls back to secondary) */
  accent: string
  /** All palette colors in original order */
  all: string[]
  /** Readable text on primary */
  onPrimary: string
  /** Readable text on darkest */
  onDarkest: string
  /** Readable text on lightest */
  onLightest: string
  /** Dark text for light backgrounds */
  textDark: string
  /** Light text for dark backgrounds */
  textLight: string
  /** Muted text (60% opacity of textDark) */
  textMuted: string
  /** Very light tint of primary for surface/card backgrounds */
  primaryTint: string
  /** Surface background — very light neutral derived from lightest */
  surface: string
}

export function mapPreviewColors(hexes: string[]): PreviewPalette {
  const colors = hexes.map(h => {
    const hex = h.startsWith('#') ? h : `#${h}`
    try { chroma(hex); return hex } catch { return '#6C47FF' }
  })

  // Sort by luminance
  const byLum = [...colors].sort((a, b) => chroma(a).luminance() - chroma(b).luminance())
  const darkest = byLum[0]
  const lightest = byLum[byLum.length - 1]

  // Sort by chroma (saturation × lightness weighting) to find most vibrant
  const byVibrance = [...colors].sort((a, b) => {
    const [, sa, la] = chroma(a).hsl()
    const [, sb, lb] = chroma(b).hsl()
    // Weight: high saturation + midrange lightness = most vibrant
    const va = (sa || 0) * (1 - Math.abs(0.5 - (la || 0.5)))
    const vb = (sb || 0) * (1 - Math.abs(0.5 - (lb || 0.5)))
    return vb - va
  })

  const primary = byVibrance[0]
  const secondary = byVibrance[1] || primary
  const accent = byVibrance[2] || secondary

  // Derive readable text colors
  const onPrimary = chroma.contrast(primary, '#ffffff') >= 4.5 ? '#ffffff' : '#1a1a2e'
  const onDarkest = chroma.contrast(darkest, '#ffffff') >= 4.5 ? '#ffffff' : '#1a1a2e'
  const onLightest = chroma.contrast(lightest, '#1a1a2e') >= 4.5 ? '#1a1a2e' : '#ffffff'

  // Derive text colors from darkest palette color
  const textDark = chroma(darkest).luminance() < 0.15
    ? darkest
    : chroma.mix(darkest, '#000000', 0.5).hex()

  const textLight = chroma(lightest).luminance() > 0.7
    ? lightest
    : chroma.mix(lightest, '#ffffff', 0.5).hex()

  const textMuted = chroma(textDark).alpha(0.55).css()

  // Primary tint — very light version of primary for backgrounds
  const primaryTint = chroma.mix(primary, '#ffffff', 0.92).hex()

  // Surface — very light neutral
  const surface = chroma(lightest).luminance() > 0.8
    ? chroma.mix(lightest, '#ffffff', 0.5).hex()
    : '#f8f9fa'

  return {
    darkest, lightest, primary, secondary, accent,
    all: colors,
    onPrimary, onDarkest, onLightest,
    textDark, textLight, textMuted,
    primaryTint, surface,
  }
}
