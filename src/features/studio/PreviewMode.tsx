import { useEffect, useState } from 'react'
import {
  Shuffle, Sparkles, Lock, Download,
  Undo2, Redo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { readableOn } from '@/lib/colorEngine'
import { DarkTooltip } from './DarkTooltip'
import { PreviewGrid } from '@/components/preview/PreviewGrid'

export function PreviewMode({
  swatches, isPro, onGenerate, onExport, onUndo, onRedo, onProGate, onLock, visionFilter,
}: {
  swatches: { id: string; hex: string; locked: boolean }[]
  isPro: boolean
  onGenerate: () => void
  onExport: () => void
  onUndo: () => void
  onRedo: () => void
  onProGate: (feature?: string, source?: string) => void
  onLock: (id: string) => void
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
            padding: '24px 24px 80px',
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

      {/* ─ Floating control footer ─ */}
      <div
        className="absolute z-20 flex items-center"
        style={{
          bottom: 12,
          left: 12,
          right: 12,
          height: 52,
          borderRadius: 12,
          backgroundColor: 'hsl(var(--card) / 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1px solid hsl(var(--border-light))',
          padding: '4px 8px',
          gap: 6,
          transform: entering ? 'translateY(20px)' : 'translateY(0)',
          opacity: entering ? 0 : 1,
          transition: 'transform 200ms ease-out 100ms, opacity 200ms ease-out 100ms',
        }}
      >
        {/* Color swatches */}
        <div className="flex items-center" style={{ gap: 6 }}>
          {swatches.map(s => (
            <button
              key={s.id}
              onClick={() => onLock(s.id)}
              className="relative flex items-center justify-center transition-all active:scale-[0.98] hover:scale-105"
              style={{
                width: 36, height: 36, padding: 0, borderRadius: 8,
                backgroundColor: s.hex, border: '1px solid rgba(0,0,0,0.08)',
              }}
              aria-label={`${s.hex} ${s.locked ? '(locked)' : '(unlocked)'}`}
            >
              {s.locked && (
                <Lock size={12} style={{ color: readableOn(s.hex) }} />
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, backgroundColor: 'hsl(var(--border-light))', margin: '0 6px' }} />

        {/* Tool buttons */}
        <div className="flex items-center" style={{ gap: 6 }}>
          <DarkTooltip label="Generate" position="top">
            <button
              onClick={onGenerate}
              className="flex items-center justify-center text-foreground transition-all hover:bg-surface/50 active:scale-[0.98]"
              style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
              aria-label="Generate new palette"
            >
              <Shuffle size={16} strokeWidth={1.5} />
            </button>
          </DarkTooltip>
          <DarkTooltip label="Undo" position="top">
            <button
              onClick={onUndo}
              className="flex items-center justify-center text-foreground transition-all hover:bg-surface/50 active:scale-[0.98]"
              style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
              aria-label="Undo"
            >
              <Undo2 size={16} strokeWidth={1.5} />
            </button>
          </DarkTooltip>
          <DarkTooltip label="Redo" position="top">
            <button
              onClick={onRedo}
              className="flex items-center justify-center text-foreground transition-all hover:bg-surface/50 active:scale-[0.98]"
              style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
              aria-label="Redo"
            >
              <Redo2 size={16} strokeWidth={1.5} />
            </button>
          </DarkTooltip>
        </div>

        <div className="flex-1" />

        {/* Generate + Export */}
        <button
          onClick={onGenerate}
          className="h-9 px-4 flex items-center gap-1.5 rounded-button bg-card border border-border text-foreground text-[13px] font-medium hover:bg-surface transition-colors active:scale-[0.98]"
          aria-label="Generate new palette"
        >
          <Sparkles size={16} strokeWidth={1.5} />
          Generate
        </button>
        <Button
          variant="default"
          size="default"
          onClick={onExport}
          className="text-[13px] font-semibold gap-1.5"
        >
          <Download size={16} strokeWidth={1.5} />
          Export
        </Button>
      </div>
    </div>
  )
}
