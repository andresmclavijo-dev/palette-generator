import type { PreviewPalette } from '@/lib/previewColors'

export function BrandPattern({ p }: { p: PreviewPalette }) {
  const c = p.all
  const n = c.length

  return (
    <svg viewBox="0 0 800 500" className="block w-full h-auto" aria-hidden="true" style={{ backgroundColor: p.surface }}>
      {/* ── Background layer: large soft shapes ── */}
      {/* Quarter circle — top-left */}
      <path d="M 0 0 L 260 0 A 260 260 0 0 1 0 260 Z" fill={c[0 % n]} opacity="0.12" />
      {/* Half circle — right edge */}
      <circle cx="800" cy="250" r="200" fill={c[1 % n]} opacity="0.08" />
      {/* Large rounded rect — bottom */}
      <rect x="200" y="360" width="400" height="140" rx="70" fill={c[2 % n]} opacity="0.1" />

      {/* ── Mid layer: main shapes ── */}
      {/* Large circle — upper left */}
      <circle cx="140" cy="160" r="110" fill={c[0 % n]} opacity="0.8" />
      {/* Overlapping rounded rect */}
      <rect x="60" y="220" width="180" height="120" rx="20" fill={c[1 % n]} opacity="0.75" />
      {/* Small circle overlap */}
      <circle cx="200" cy="200" r="44" fill={c[2 % n]} opacity="0.85" />

      {/* Diagonal stripe band — center */}
      <g transform="rotate(-12 500 160)">
        <rect x="320" y="80" width="320" height="28" rx="14" fill={c[0 % n]} opacity="0.85" />
        <rect x="340" y="120" width="280" height="22" rx="11" fill={c[1 % n]} opacity="0.7" />
        <rect x="360" y="152" width="240" height="18" rx="9" fill={c[2 % n]} opacity="0.6" />
        {n > 3 && <rect x="380" y="180" width="200" height="14" rx="7" fill={c[3]} opacity="0.5" />}
        {n > 4 && <rect x="400" y="204" width="160" height="12" rx="6" fill={c[4]} opacity="0.45" />}
      </g>

      {/* Half circle — mid-right */}
      <path d="M 620 180 A 70 70 0 0 1 620 320" fill={c[(n > 3 ? 3 : 0) % n]} opacity="0.65" />

      {/* Concentric arcs — bottom-right */}
      <path d="M 800 500 A 200 200 0 0 0 600 300" fill="none" stroke={c[0 % n]} strokeWidth="24" opacity="0.18" strokeLinecap="round" />
      <path d="M 800 500 A 150 150 0 0 0 650 350" fill="none" stroke={c[1 % n]} strokeWidth="18" opacity="0.3" strokeLinecap="round" />
      <path d="M 800 500 A 100 100 0 0 0 700 400" fill="none" stroke={c[2 % n]} strokeWidth="12" opacity="0.5" strokeLinecap="round" />

      {/* ── Detail layer: small elements ── */}
      {/* Scattered dots */}
      {[
        [420, 300, 20], [490, 340, 14], [540, 280, 24], [580, 340, 10],
        [340, 400, 12], [400, 430, 18], [470, 450, 9], [310, 340, 8],
      ].map(([cx, cy, r], i) => (
        <circle key={`dot-${i}`} cx={cx} cy={cy} r={r} fill={c[i % n]} opacity={0.5 + (i % 3) * 0.15} />
      ))}

      {/* Triangle — lower left */}
      <polygon points="50,450 190,450 120,350" fill={c[(n > 3 ? 3 : 1) % n]} opacity="0.45" />
      {/* Small triangle accent */}
      <polygon points="270,380 320,380 295,340" fill={c[0 % n]} opacity="0.35" />

      {/* Grid of rounded squares — right */}
      {[0, 1, 2].map(row =>
        [0, 1, 2].map(col => (
          <rect
            key={`sq-${row}-${col}`}
            x={640 + col * 44}
            y={300 + row * 44}
            width="36" height="36" rx="8"
            fill={c[(row * 3 + col) % n]}
            opacity={0.4 + row * 0.1}
          />
        ))
      )}

      {/* Accent lines — top */}
      {[0, 1, 2, 3, 4].map(i => (
        <line
          key={`ln-${i}`}
          x1={320 + i * 4} y1={28 + i * 10}
          x2={520 - i * 25} y2={28 + i * 10}
          stroke={c[i % n]} strokeWidth={3 - i * 0.3} strokeLinecap="round" opacity={0.4 + i * 0.08}
        />
      ))}

      {/* Thin diagonal lines — mid-left accent */}
      {[0, 1, 2].map(i => (
        <line
          key={`diag-${i}`}
          x1={260 + i * 16} y1={120}
          x2={310 + i * 16} y2={240}
          stroke={c[i % n]} strokeWidth="1.5" opacity="0.25" strokeLinecap="round"
        />
      ))}

      {/* Small dots row — bottom accent */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <circle
          key={`sdot-${i}`}
          cx={240 + i * 28} cy={470}
          r="3" fill={c[i % n]} opacity="0.4"
        />
      ))}

      {/* Quarter circle — bottom-left corner */}
      <path d="M 0 500 L 0 400 A 100 100 0 0 1 100 500 Z" fill={c[(n > 4 ? 4 : 1) % n]} opacity="0.3" />
    </svg>
  )
}
