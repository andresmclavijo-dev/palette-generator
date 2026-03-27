import { useEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { parseHex } from '@/lib/colorEngine'

export function ColorInfoPopover({
  hex, swatchId, anchorRect, onClose, onEditSwatch,
}: {
  hex: string
  swatchId: string
  anchorRect: DOMRect
  onClose: () => void
  onEditSwatch: (id: string, hex: string) => void
}) {
  const [pickerColor, setPickerColor] = useState(hex)
  const [hexDraft, setHexDraft] = useState(hex.replace('#', '').toUpperCase())
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local state when the external hex changes (e.g. from undo/redo)
  useEffect(() => {
    setPickerColor(hex)
    setHexDraft(hex.replace('#', '').toUpperCase())
  }, [hex])

  // Cleanup debounce timer
  useEffect(() => () => { if (commitTimer.current) clearTimeout(commitTimer.current) }, [])

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const liveHex = pickerColor

  const handlePickerChange = (newHex: string) => {
    setPickerColor(newHex)
    setHexDraft(newHex.replace('#', '').toUpperCase())
    if (commitTimer.current) clearTimeout(commitTimer.current)
    commitTimer.current = setTimeout(() => {
      onEditSwatch(swatchId, newHex)
    }, 80)
  }

  const handleHexSubmit = () => {
    const parsed = parseHex('#' + hexDraft)
    if (parsed) {
      setPickerColor(parsed)
      onEditSwatch(swatchId, parsed)
    } else {
      setHexDraft(pickerColor.replace('#', '').toUpperCase())
    }
  }

  // Position to the right of the anchor; flip left if not enough space
  const popoverWidth = 220
  const popoverEstHeight = 300
  const spaceRight = window.innerWidth - anchorRect.right
  const showRight = spaceRight > popoverWidth + 16
  const rawTop = anchorRect.top + anchorRect.height / 2
  const maxTop = window.innerHeight - popoverEstHeight / 2 - 12
  const minTop = popoverEstHeight / 2 + 12
  const top = Math.max(minTop, Math.min(rawTop, maxTop))
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
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          border: '0.5px solid hsl(var(--border))',
          width: popoverWidth,
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={`Edit color ${hex}`}
      >
        {/* Color preview strip */}
        <div style={{ height: 6, backgroundColor: liveHex }} />

        <div style={{ padding: 16 }} className="flex flex-col gap-3">
          {/* Color picker */}
          <div className="react-colorful-wrapper rounded-xl overflow-hidden">
            <HexColorPicker
              color={pickerColor}
              onChange={handlePickerChange}
            />
          </div>

          {/* Hex input */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-button shrink-0 border border-border"
              style={{ backgroundColor: liveHex }}
              aria-hidden="true"
            />
            <div className="flex items-center flex-1 border border-border rounded-button overflow-hidden bg-surface">
              <span className="text-[13px] font-mono text-muted-foreground pl-2.5">#</span>
              <input
                value={hexDraft}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase()
                  setHexDraft(val)
                  if (val.length === 6) {
                    const parsed = parseHex('#' + val)
                    if (parsed) {
                      setPickerColor(parsed)
                      if (commitTimer.current) clearTimeout(commitTimer.current)
                      commitTimer.current = setTimeout(() => {
                        onEditSwatch(swatchId, parsed)
                      }, 80)
                    }
                  }
                }}
                onBlur={handleHexSubmit}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleHexSubmit()
                }}
                maxLength={6}
                className="flex-1 bg-transparent text-[13px] font-mono text-foreground outline-none py-1.5 px-1"
                style={{ border: 'none' }}
                aria-label="Hex color value"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
