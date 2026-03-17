import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Swatch } from '../../lib/colorEngine'
import { getDeduplicatedNames } from '../../lib/colorEngine'
import ColorSwatch from './ColorSwatch'

export type ActivePanel = { type: 'picker' | 'shades' | 'info'; swatchIndex: number } | null

interface PaletteCanvasProps {
  swatches: Swatch[]
  onLock: (id: string) => void
  onEdit: (id: string, hex: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  activePanel: ActivePanel
  onPanelChange: (panel: ActivePanel) => void
}

export default function PaletteCanvas({ swatches, onLock, onEdit, onReorder, activePanel, onPanelChange }: PaletteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const dragRef = useRef<number | null>(null)
  const overRef = useRef<number | null>(null)
  const onReorderRef = useRef(onReorder)
  onReorderRef.current = onReorder

  const handleDragStart = useCallback((index: number) => {
    dragRef.current = index
    overRef.current = index
    setDragIndex(index)
    setOverIndex(index)
  }, [])

  useEffect(() => {
    if (dragIndex === null) return

    const handleMove = (e: PointerEvent) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const isVertical = rect.height > rect.width
      const fraction = isVertical
        ? (e.clientY - rect.top) / rect.height
        : (e.clientX - rect.left) / rect.width
      if (!swatches.length) return
      const idx = Math.max(0, Math.min(swatches.length - 1, Math.floor(fraction * swatches.length)))
      overRef.current = idx
      setOverIndex(idx)
    }

    const handleUp = () => {
      const from = dragRef.current
      const to = overRef.current
      if (from !== null && to !== null && from !== to) {
        onReorderRef.current(from, to)
      }
      dragRef.current = null
      overRef.current = null
      setDragIndex(null)
      setOverIndex(null)
    }

    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
    document.addEventListener('pointercancel', handleUp)
    return () => {
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
      document.removeEventListener('pointercancel', handleUp)
    }
  }, [dragIndex, swatches.length])

  const dedupedNames = useMemo(() => getDeduplicatedNames(swatches.map(s => s.hex)), [swatches])

  // Compute visual reorder during drag
  const displayOrder = (() => {
    const indices = swatches.map((_, i) => i)
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) return indices
    const order = [...indices]
    const [removed] = order.splice(dragIndex, 1)
    order.splice(overIndex, 0, removed)
    return order
  })()

  return (
    <div
      ref={containerRef}
      className="flex flex-col sm:flex-row w-full h-full"
      style={{ touchAction: dragIndex !== null ? 'none' : undefined }}
    >
      {displayOrder.map((swatchIdx) => {
        const swatch = swatches[swatchIdx]
        return (
          <ColorSwatch
            key={swatch.id}
            hex={swatch.hex}
            locked={swatch.locked}
            index={swatchIdx}
            isDragging={dragIndex === swatchIdx}
            dedupedName={dedupedNames[swatchIdx]}
            onLock={() => onLock(swatch.id)}
            onEdit={(hex) => onEdit(swatch.id, hex)}
            onDragStart={() => handleDragStart(swatchIdx)}
            activePanel={activePanel}
            onPanelChange={onPanelChange}
          />
        )
      })}
    </div>
  )
}
