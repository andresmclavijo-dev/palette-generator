import { useMemo, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { readableOn, generateShades, TAILWIND_SHADE_LABELS } from '../../lib/colorEngine'
import { BRAND_VIOLET } from '../../lib/tokens'
import { showToast } from '../../utils/toast'

function shadeContrastRatio(bg: string, fg: string): number {
  try {
    const parse = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
    const lum = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }
    const [r1, g1, b1] = parse(bg)
    const [r2, g2, b2] = parse(fg)
    const l1 = lum(r1, g1, b1), l2 = lum(r2, g2, b2)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  } catch { return 1 }
}

export function ShadesSpecimen({ open, hex, onClose }: { open: boolean; hex: string; onClose: () => void }) {
  const shades = useMemo(() => generateShades(hex, 10), [hex])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const handleCopy = async (shade: string, i: number) => {
    try {
      await navigator.clipboard.writeText(shade.toUpperCase())
      setCopiedIdx(i)
      showToast('Copied!')
      setTimeout(() => setCopiedIdx(null), 1200)
    } catch { /* silent */ }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            Shade scale
            <div
              style={{
                width: 24, height: 24, borderRadius: 6,
                backgroundColor: hex, flexShrink: 0,
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            />
            <span className="text-[13px] font-mono font-normal" style={{ color: '#6b7280' }}>
              {hex.toUpperCase()}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* 2×5 Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginTop: 8 }}>
          {shades.map((shade, i) => {
            const label = TAILWIND_SHADE_LABELS[i]
            const isBase = label === 500
            const labelColor = readableOn(shade)
            const isCopied = copiedIdx === i
            const isHovered = hoveredIdx === i
            const whiteRatio = shadeContrastRatio(shade, '#ffffff')
            const blackRatio = shadeContrastRatio(shade, '#000000')
            const whitePass = whiteRatio >= 4.5
            const blackPass = blackRatio >= 4.5
            const ratioLabel = `${whiteRatio.toFixed(1)}:1`
            const ratingLabel = whiteRatio >= 7 ? 'AAA' : whiteRatio >= 4.5 ? 'AA' : whiteRatio >= 3 ? 'AA18' : 'Fail'

            return (
              <button
                key={label}
                onClick={() => handleCopy(shade, i)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative flex flex-col items-center justify-end cursor-pointer"
                style={{
                  height: 80,
                  borderRadius: 12,
                  backgroundColor: shade,
                  paddingBottom: 8,
                  border: isBase
                    ? '2px solid #ffffff'
                    : isCopied
                      ? `2px solid ${BRAND_VIOLET}`
                      : '1px solid rgba(0,0,0,0.06)',
                  boxShadow: isBase
                    ? '0 0 0 2px rgba(108,71,255,0.3)'
                    : isCopied
                      ? '0 0 0 2px rgba(108,71,255,0.2)'
                      : undefined,
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 150ms ease, border 300ms ease, box-shadow 300ms ease',
                }}
                aria-label={`Copy shade ${label}: ${shade}`}
              >
                {/* Hover contrast tooltip */}
                {isHovered && (
                  <div
                    className="absolute font-mono"
                    style={{
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginBottom: 6,
                      backgroundColor: '#1F2937',
                      color: '#ffffff',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 10,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    {ratioLabel} {ratingLabel} {whitePass ? '\u2713' : ''}
                  </div>
                )}

                {/* Contrast dots */}
                <div className="absolute flex" style={{ top: 6, right: 6, gap: 3 }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    opacity: whitePass ? 1 : 0.3,
                    border: '0.5px solid rgba(0,0,0,0.1)',
                  }} />
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    backgroundColor: '#000000',
                    opacity: blackPass ? 1 : 0.3,
                  }} />
                </div>

                {/* Copy icon on hover */}
                {isHovered && !isCopied && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ borderRadius: 12 }}>
                    <Copy size={16} strokeWidth={1.5} style={{ color: labelColor, opacity: 0.7 }} />
                  </div>
                )}

                {/* Copied checkmark */}
                {isCopied && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ borderRadius: 12 }}>
                    <Check size={16} strokeWidth={2} style={{ color: labelColor }} />
                  </div>
                )}

                {/* Labels */}
                <span className="text-[10px]" style={{ color: labelColor, lineHeight: 1.2, fontWeight: isBase ? 700 : 600 }}>
                  {isBase ? '500 \u00b7 Base' : String(label)}
                </span>
                <span className="text-[10px] font-mono" style={{ color: labelColor, opacity: 0.7, lineHeight: 1.2 }}>
                  {shade.toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
