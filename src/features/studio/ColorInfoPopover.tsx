import { useEffect, useState } from 'react'
import { getColorName, getColorInfo } from '@/lib/colorEngine'
import { BRAND_DARK } from '@/lib/tokens'

function InfoRow({ label, value, copied, onClick }: { label: string; value: string; copied: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full text-left transition-all hover:bg-surface -mx-1 px-1 rounded"
      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px' }}
      aria-label={`Copy ${label} value`}
    >
      <span className="text-[10px] font-bold tracking-wider opacity-40 w-7" style={{ color: BRAND_DARK }}>{label}</span>
      <span className="text-[12px] font-mono" style={{ color: copied ? 'hsl(var(--success))' : 'hsl(var(--foreground))' }}>
        {copied ? 'Copied!' : value}
      </span>
    </button>
  )
}

export function ColorInfoPopover({ hex, anchorRect, onClose }: { hex: string; anchorRect: DOMRect; onClose: () => void }) {
  const name = getColorName(hex)
  const { rgb, hsl } = getColorInfo(hex)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const copyValue = async (label: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val)
      setCopied(label)
      setTimeout(() => setCopied(null), 1200)
    } catch { /* silent */ }
  }

  // Position to the right of the anchor button; if too close to right edge, show to the left
  const popoverWidth = 210
  const spaceRight = window.innerWidth - anchorRect.right
  const showRight = spaceRight > popoverWidth + 16
  const top = anchorRect.top + anchorRect.height / 2
  const left = showRight ? anchorRect.right + 8 : anchorRect.left - popoverWidth - 8

  return (
    <>
      {/* Click-outside overlay */}
      <div className="fixed inset-0 z-[79]" onClick={onClose} />
      <div
        className="fixed z-[80] bg-card"
        style={{
          top,
          left,
          transform: 'translateY(-50%)',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          border: '1px solid rgba(0,0,0,0.06)',
          width: popoverWidth,
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={`Color details for ${hex}`}
      >
        <div style={{ height: 6, backgroundColor: hex }} />
        <div style={{ padding: '12px 16px' }}>
          <p className="text-[15px] font-bold m-0" style={{ color: BRAND_DARK }}>{name}</p>
          <div className="mt-2 flex flex-col gap-1">
            <InfoRow label="HEX" value={hex.toUpperCase()} copied={copied === 'HEX'} onClick={() => copyValue('HEX', hex.toUpperCase())} />
            <InfoRow label="RGB" value={rgb} copied={copied === 'RGB'} onClick={() => copyValue('RGB', rgb)} />
            <InfoRow label="HSL" value={hsl} copied={copied === 'HSL'} onClick={() => copyValue('HSL', hsl)} />
          </div>
        </div>
      </div>
    </>
  )
}
