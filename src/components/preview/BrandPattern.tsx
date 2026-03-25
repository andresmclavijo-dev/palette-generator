import type { PreviewPalette } from '@/lib/previewColors'

/**
 * Geometric modernist / Bauhaus-inspired brand pattern.
 * Uses only: quarter-circles, half-circles, rectangles, donut shapes.
 * Solid fills, no opacity, no gradients. Tightly packed grid composition.
 */
export function BrandPattern({ p }: { p: PreviewPalette }) {
  const c = p.all
  const n = c.length

  return (
    <svg viewBox="0 0 600 375" className="block w-full h-auto" aria-hidden="true" style={{ backgroundColor: p.darkest }}>
      {/* ═══ Row 1 — top band (y: 0–150) ═══ */}

      {/* Top-left: quarter circle, center at origin */}
      <path d="M 0,0 L 185,0 A 185,185 0 0,1 0,185 Z" fill={c[0 % n]} />

      {/* Top-center: rectangle */}
      <rect x="185" y="0" width="230" height="145" fill={c[1 % n]} />

      {/* Top-right: quarter circle, center at (600,0) */}
      <path d="M 600,0 L 600,185 A 185,185 0 0,0 415,0 Z" fill={c[2 % n]} />

      {/* ═══ Row 2 — middle band (y: 145–265) ═══ */}

      {/* Left: tall rectangle */}
      <rect x="0" y="185" width="145" height="190" fill={c[2 % n]} />

      {/* Below top-center rect: filler rect */}
      <rect x="185" y="145" width="120" height="70" fill={c[(n > 3 ? 3 : 0) % n]} />

      {/* Between top-right QC and right edge: filler */}
      <rect x="415" y="145" width="100" height="120" fill={c[(n > 4 ? 4 : 1) % n]} />

      {/* Center: donut (ring with cutout) */}
      <circle cx="300" cy="230" r="95" fill={c[(n > 3 ? 3 : 0) % n]} />
      <circle cx="300" cy="230" r="40" fill={p.darkest} />

      {/* Right: half-circle clipped at edge */}
      <circle cx="600" cy="255" r="80" fill={c[1 % n]} />

      {/* ═══ Row 3 — bottom band (y: 265–375) ═══ */}

      {/* Bottom-left: half circle, center at bottom edge */}
      <circle cx="72" cy="375" r="125" fill={c[1 % n]} />

      {/* Bottom-center: arch (rounded rect) */}
      <rect x="200" y="310" width="210" height="65" rx="32" fill={c[0 % n]} />

      {/* Bottom-right: quarter circle, center at (600,375) */}
      <path d="M 600,375 L 600,200 A 175,175 0 0,0 425,375 Z" fill={c[(n > 4 ? 4 : 2) % n]} />

      {/* ═══ Small accent shapes in gaps ═══ */}

      <circle cx="160" cy="315" r="22" fill={c[2 % n]} />
      <circle cx="400" cy="285" r="16" fill={c[1 % n]} />
      <circle cx="250" cy="280" r="13" fill={c[(n > 3 ? 3 : 0) % n]} />
      <circle cx="480" cy="340" r="11" fill={c[0 % n]} />
      <circle cx="355" cy="355" r="16" fill={c[2 % n]} />
      <circle cx="520" cy="160" r="14" fill={c[0 % n]} />
      <circle cx="330" cy="150" r="10" fill={c[2 % n]} />
      <circle cx="145" cy="280" r="8" fill={c[1 % n]} />
    </svg>
  )
}
