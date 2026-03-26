// SINGLE SOURCE OF TRUTH — all Pro gating decisions live here.
// If you need to check whether a feature is Pro, import from here.
// Never hardcode Pro checks elsewhere.

export const PRO_GATES = {
  // Color count
  MAX_FREE_COLORS: 5,
  MAX_PRO_COLORS: 8,

  // Saved palettes
  MAX_FREE_SAVES: 3,

  // AI prompts
  MAX_FREE_AI_PER_DAY: 3,

  // Export formats
  EXPORT_FREE: ['css', 'svg'] as const,
  EXPORT_PRO: ['tailwind'] as const,

  // Accessibility Lens modes
  LENS_FREE: ['normal', 'protanopia', 'deuteranopia'] as const,
  LENS_PRO: ['tritanopia', 'achromatopsia'] as const,

  // Features
  SHADE_SCALES: 'pro',
  IMAGE_EXTRACTION: 'pro',
  EXPORT_WATERMARK: 'free',
  AI_UNLIMITED: 'pro',
} as const

/** Check if an export format is available on the free tier */
export function isExportFormatFree(format: string): boolean {
  return (PRO_GATES.EXPORT_FREE as readonly string[]).includes(format.toLowerCase())
}

/** Check if a lens mode is available on the free tier */
export function isLensModeFree(mode: string): boolean {
  return (PRO_GATES.LENS_FREE as readonly string[]).includes(mode.toLowerCase())
}

/** Check if a given color count is within the user's tier limit */
export function isColorCountAllowed(count: number, isPro: boolean): boolean {
  return count <= (isPro ? PRO_GATES.MAX_PRO_COLORS : PRO_GATES.MAX_FREE_COLORS)
}
