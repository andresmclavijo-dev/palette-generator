import type { PreviewPalette } from '@/lib/previewColors'

export function BrandPattern({ p }: { p: PreviewPalette }) {
  const c = p.all
  const n = c.length

  return (
    <svg viewBox="0 0 800 500" className="block w-full h-auto" aria-hidden="true" style={{ backgroundColor: p.surface }}>
      {/* ── Large organic blob shapes ── */}

      {/* Blob 1 — top-left, largest */}
      <path
        d="M 40,80 C 80,-20 240,-40 340,30 C 440,100 420,200 360,270 C 300,340 160,350 80,290 C 0,230 -20,140 40,80 Z"
        fill={c[0 % n]}
        opacity="0.92"
      />

      {/* Blob 2 — center, wide and warm */}
      <path
        d="M 300,120 C 380,60 520,50 620,120 C 720,190 710,310 620,370 C 530,430 380,430 290,360 C 200,290 220,180 300,120 Z"
        fill={c[1 % n]}
        opacity="0.87"
      />

      {/* Blob 3 — bottom-left overlap */}
      <path
        d="M 50,310 C 100,250 220,240 300,300 C 380,360 370,460 290,500 C 210,540 70,520 20,450 C -30,380 0,370 50,310 Z"
        fill={c[2 % n]}
        opacity="0.9"
      />

      {/* Blob 4 — top-right (if 4+ colors) */}
      {n > 3 && (
        <path
          d="M 560,0 C 640,-20 770,20 800,90 C 830,160 790,250 710,270 C 630,290 560,240 530,170 C 500,100 480,20 560,0 Z"
          fill={c[3]}
          opacity="0.85"
        />
      )}

      {/* Blob 5 — bottom-right (if 5+ colors) */}
      {n > 4 && (
        <path
          d="M 500,320 C 570,280 700,290 760,360 C 820,430 800,500 720,520 C 640,540 530,510 480,440 C 430,370 430,360 500,320 Z"
          fill={c[4]}
          opacity="0.88"
        />
      )}

      {/* Blob 6 — small accent, upper center overlap */}
      <path
        d="M 380,20 C 430,-10 510,10 530,60 C 550,110 520,160 470,170 C 420,180 370,150 360,100 C 350,50 330,50 380,20 Z"
        fill={c[0 % n]}
        opacity="0.65"
      />

      {/* Blob 7 — small accent, right edge */}
      <path
        d="M 710,140 C 750,110 800,130 810,180 C 820,230 790,280 750,290 C 710,300 680,270 670,220 C 660,170 670,170 710,140 Z"
        fill={c[2 % n]}
        opacity="0.6"
      />

      {/* ── Small accent elements ── */}

      {/* Scattered organic dots of varying size */}
      {[
        [190, 140, 14], [460, 240, 10], [640, 100, 12], [360, 450, 9],
        [100, 420, 11], [550, 450, 13], [740, 380, 8], [680, 40, 10],
        [240, 210, 7], [500, 160, 9],
      ].map(([cx, cy, r], i) => (
        <circle key={`d-${i}`} cx={cx} cy={cy} r={r} fill={c[i % n]} opacity={0.35 + (i % 4) * 0.1} />
      ))}

      {/* Curved accent arcs */}
      <path d="M 170,50 Q 220,10 270,45" fill="none" stroke={c[2 % n]} strokeWidth="3.5" opacity="0.3" strokeLinecap="round" />
      <path d="M 600,430 Q 650,400 700,440" fill="none" stroke={c[0 % n]} strokeWidth="3" opacity="0.25" strokeLinecap="round" />
      <path d="M 430,70 Q 465,45 500,75" fill="none" stroke={c[1 % n]} strokeWidth="2.5" opacity="0.25" strokeLinecap="round" />

      {/* Small organic blob accent — lower center */}
      <path
        d="M 400,400 C 420,385 450,390 460,410 C 470,430 455,450 435,455 C 415,460 395,445 390,425 C 385,405 380,415 400,400 Z"
        fill={c[1 % n]}
        opacity="0.5"
      />

      {/* Small organic blob accent — mid right */}
      <path
        d="M 650,200 C 670,185 695,190 705,210 C 715,230 700,250 680,255 C 660,260 640,245 635,225 C 630,205 630,215 650,200 Z"
        fill={c[0 % n]}
        opacity="0.45"
      />
    </svg>
  )
}
