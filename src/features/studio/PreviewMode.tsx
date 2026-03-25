import { useEffect, useState } from 'react'
import { PreviewGrid } from '@/components/preview/PreviewGrid'

export function PreviewMode({
  swatches, isPro, onProGate, visionFilter,
}: {
  swatches: { id: string; hex: string; locked: boolean }[]
  isPro: boolean
  onProGate: (feature?: string, source?: string) => void
  visionFilter?: string
}) {
  const hexes = swatches.map(s => s.hex)
  const [entering, setEntering] = useState(true)

  useEffect(() => {
    requestAnimationFrame(() => setEntering(false))
  }, [])

  return (
    <div className="absolute inset-0" style={{ backgroundColor: 'hsl(var(--surface-warm))' }}>
      {/* Scrollable content area */}
      <div className="absolute inset-0 overflow-y-auto">
        <div
          style={{
            padding: '68px 24px 80px',
            opacity: entering ? 0 : 1,
            transition: 'opacity 300ms ease 100ms',
            filter: visionFilter,
          }}
        >
          <PreviewGrid
            hexes={hexes}
            isPro={isPro}
            onProGate={onProGate}
          />
        </div>
      </div>
    </div>
  )
}
