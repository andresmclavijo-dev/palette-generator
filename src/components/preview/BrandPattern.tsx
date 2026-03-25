import type { PreviewPalette } from '@/lib/previewColors'

export function BrandPattern({ p }: { p: PreviewPalette }) {
  const c = p.all
  const n = c.length

  return (
    <svg viewBox="0 0 800 500" className="block w-full h-auto" aria-hidden="true" style={{ backgroundColor: p.surface }}>
      {/* Large circle — top left */}
      <circle cx="160" cy="140" r="120" fill={c[0 % n]} opacity="0.85" />

      {/* Overlapping rectangle — center left */}
      <rect x="80" y="200" width="200" height="140" rx="16" fill={c[1 % n]} opacity="0.7" />

      {/* Small circle — overlap */}
      <circle cx="220" cy="180" r="50" fill={c[2 % n]} opacity="0.75" />

      {/* Large rounded rect — right half */}
      <rect x="360" y="60" width="340" height="220" rx="24" fill={c[0 % n]} opacity="0.12" />

      {/* Diagonal stripe band */}
      <rect x="400" y="80" width="260" height="32" rx="16" fill={c[1 % n]} opacity="0.9"
        transform="rotate(-8 530 96)"
      />
      <rect x="380" y="130" width="280" height="24" rx="12" fill={c[2 % n]} opacity="0.7"
        transform="rotate(-8 520 142)"
      />
      {n > 3 && (
        <rect x="420" y="170" width="220" height="20" rx="10" fill={c[3]} opacity="0.6"
          transform="rotate(-8 530 180)"
        />
      )}

      {/* Concentric arcs — bottom right */}
      <path
        d="M 700 500 A 180 180 0 0 1 520 320"
        fill="none" stroke={c[0 % n]} strokeWidth="28" opacity="0.25"
      />
      <path
        d="M 700 500 A 130 130 0 0 1 570 370"
        fill="none" stroke={c[1 % n]} strokeWidth="20" opacity="0.4"
      />
      <path
        d="M 700 500 A 80 80 0 0 1 620 420"
        fill="none" stroke={c[2 % n]} strokeWidth="14" opacity="0.6"
      />

      {/* Scattered dots — middle area */}
      {[
        [450, 310, 18], [510, 350, 12], [560, 290, 22],
        [340, 380, 10], [400, 420, 16], [480, 440, 8],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={c[i % n]} opacity="0.55" />
      ))}

      {/* Triangle — bottom left */}
      <polygon
        points="60,440 180,440 120,340"
        fill={c[(n > 3 ? 3 : 1) % n]} opacity="0.5"
      />

      {/* Small square grid — right middle */}
      {[0, 1, 2].map(row =>
        [0, 1, 2].map(col => (
          <rect
            key={`${row}-${col}`}
            x={620 + col * 44}
            y={300 + row * 44}
            width="36"
            height="36"
            rx="6"
            fill={c[(row * 3 + col) % n]}
            opacity="0.45"
          />
        ))
      )}

      {/* Horizontal lines — top accent */}
      {[0, 1, 2, 3].map(i => (
        <line
          key={`line-${i}`}
          x1="320" y1={32 + i * 12}
          x2={480 - i * 30} y2={32 + i * 12}
          stroke={c[i % n]} strokeWidth="4" strokeLinecap="round" opacity="0.5"
        />
      ))}
    </svg>
  )
}
