import { useState } from 'react'

const TOOLTIP_BG = '#1F2937'

/** Positioned tooltip bubble — used standalone (DockItem) or via DarkTooltip wrapper */
export function DarkTooltipBubble({ label, position }: { label: string; position: 'right' | 'bottom' | 'top' }) {
  const posClass =
    position === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2'
    : position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    : 'top-full left-1/2 -translate-x-1/2 mt-2'

  const arrowStyle: React.CSSProperties = {
    width: 6, height: 6, backgroundColor: TOOLTIP_BG, transform: 'rotate(45deg)',
    ...(position === 'right'
      ? { left: -3, top: '50%', marginTop: -3 }
      : position === 'top'
        ? { bottom: -3, left: '50%', marginLeft: -3 }
        : { top: -3, left: '50%', marginLeft: -3 }),
  }

  return (
    <div className={`absolute z-50 whitespace-nowrap pointer-events-none ${posClass}`} role="tooltip">
      <div
        className="relative text-[11px] font-medium text-white"
        style={{ backgroundColor: TOOLTIP_BG, padding: '4px 9px', borderRadius: 6 }}
      >
        {label}
        <div className="absolute" style={arrowStyle} />
      </div>
    </div>
  )
}

/** Wrapper that shows a dark tooltip on hover */
export function DarkTooltip({
  label, position, children,
}: {
  label: string
  position: 'right' | 'bottom' | 'top'
  children: React.ReactNode
}) {
  const [show, setShow] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && <DarkTooltipBubble label={label} position={position} />}
    </div>
  )
}
