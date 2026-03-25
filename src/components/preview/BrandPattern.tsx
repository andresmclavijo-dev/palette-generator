import type { PreviewPalette } from '@/lib/previewColors'

export function BrandPattern({ p }: { p: PreviewPalette }) {
  const c = p.all
  const n = c.length

  return (
    <svg viewBox="0 0 600 375" className="block w-full h-auto" aria-hidden="true" style={{ backgroundColor: p.primaryTint }}>
      {/* ── Large shapes anchoring corners and center ── */}

      {/* Top-left: super-rounded rectangle, bleeds off edge */}
      <rect x="-30" y="-25" width="245" height="180" rx="50" fill={c[0 % n]} />

      {/* Top-right: quarter circle, bleeds off corner */}
      <circle cx="600" cy="0" r="155" fill={c[1 % n]} />

      {/* Center: organic kidney/bean shape */}
      <path
        d="M 230,125 C 295,85 405,95 435,155 C 465,215 425,295 350,315 C 275,335 200,300 182,245 C 164,190 165,165 230,125 Z"
        fill={c[2 % n]}
      />

      {/* Bottom-left: half circle, bleeds off left edge */}
      <circle cx="-15" cy="315" r="110" fill={c[(n > 3 ? 3 : 0) % n]} />

      {/* Bottom-right: donut ring (outer circle + background-colored cutout) */}
      <circle cx="510" cy="290" r="72" fill={c[(n > 4 ? 4 : 1) % n]} />
      <circle cx="510" cy="290" r="30" fill={p.primaryTint} />

      {/* Top-center: small rounded rectangle accent */}
      <rect x="260" y="12" width="115" height="62" rx="22" fill={c[1 % n]} />

      {/* Mid-right: half-circle arc shape */}
      <path d="M 560,135 A 48,48 0 0,1 560,231 Z" fill={c[2 % n]} />

      {/* Bottom-center: organic rounded blob, bleeds off bottom */}
      <path
        d="M 265,330 C 300,298 372,302 392,342 C 412,382 376,415 330,418 C 284,421 250,393 242,360 C 234,327 230,362 265,330 Z"
        fill={c[0 % n]}
      />

      {/* ── Small accent elements in gaps ── */}

      {[
        [165, 215, 9], [325, 55, 6], [475, 85, 11], [395, 255, 7],
        [138, 345, 8], [455, 355, 6], [568, 325, 7], [105, 125, 5],
        [345, 370, 6], [505, 158, 5], [212, 48, 7], [435, 178, 4],
      ].map(([cx, cy, r], i) => (
        <circle key={`a-${i}`} cx={cx} cy={cy} r={r} fill={c[i % n]} />
      ))}

      {/* Thin accent arcs */}
      <path d="M 178,22 Q 215,-2 250,18" fill="none" stroke={c[2 % n]} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 472,315 Q 498,298 524,318" fill="none" stroke={c[0 % n]} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
