import { useEffect, useRef } from 'react'
import { analytics } from '../lib/posthog'

interface ShortcutsPanelProps {
  open: boolean
  onClose: () => void
  /** Ref to the trigger button — used for click-outside detection */
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const shortcuts: { key: string; label: string }[] = [
  { key: 'Space', label: 'Generate new palette' },
  { key: '⌘ Z', label: 'Undo' },
  { key: '⌘ ⇧ Z', label: 'Redo' },
  { key: 'Esc', label: 'Close panels' },
]

export default function ShortcutsPanel({ open, onClose, triggerRef }: ShortcutsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const hasFiredRef = useRef(false)

  // PostHog event — fire once per open
  useEffect(() => {
    if (open && !hasFiredRef.current) {
      analytics.track('shortcuts_panel_opened')
      hasFiredRef.current = true
    }
    if (!open) hasFiredRef.current = false
  }, [open])

  // Click-outside detection
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) return
      onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, triggerRef])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Keyboard shortcuts"
      className="absolute bottom-12 left-0 z-[100] rounded-xl bg-white border border-gray-200 overflow-y-auto"
      style={{
        width: 280,
        maxHeight: 400,
        padding: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        animation: 'fadeIn 150ms ease',
      }}
    >
      <h2
        className="text-sm font-semibold mb-3"
        style={{ color: 'hsl(var(--foreground))' }}
      >
        Keyboard shortcuts
      </h2>

      <div>
        {shortcuts.map((s, i) => (
          <div
            key={s.key}
            className="flex items-center justify-between py-1.5"
            style={i < shortcuts.length - 1 ? { borderBottom: '1px solid hsl(var(--border-light))' } : undefined}
          >
            <span className="text-sm font-normal" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</span>
            <kbd
              className="inline-block px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-md font-mono text-xs text-center font-semibold"
              style={{ minWidth: 32 }}
            >
              {s.key}
            </kbd>
          </div>
        ))}
      </div>

      <p className="text-xs mt-3" style={{ color: 'hsl(var(--muted-foreground))' }}>
        Click a swatch to lock &middot; Click hex to copy &middot; Double-click hex to edit &middot; Drag to reorder
      </p>
    </div>
  )
}
