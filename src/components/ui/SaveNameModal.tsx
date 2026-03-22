import { useEffect, useRef, useState } from 'react'
import { BRAND_VIOLET } from '../../lib/tokens'
import { Button } from './button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from './dialog'

interface SaveNameModalProps {
  open: boolean
  defaultName: string
  onConfirm: (name: string) => void
  onClose: () => void
}

export default function SaveNameModal({ open, defaultName, onConfirm, onClose }: SaveNameModalProps) {
  const [name, setName] = useState(defaultName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(defaultName)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 100)
    }
  }, [open, defaultName])

  // Visual Viewport API — adjust dialog when mobile keyboard opens
  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    if (!vv) return
    const handleResize = () => {
      const offset = window.innerHeight - vv.height
      document.documentElement.style.setProperty('--kb-offset', `${offset}px`)
    }
    vv.addEventListener('resize', handleResize)
    return () => {
      vv.removeEventListener('resize', handleResize)
      document.documentElement.style.setProperty('--kb-offset', '0px')
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(name.trim() || defaultName)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-md"
        style={{ transform: 'translate(-50%, -50%) translateY(calc(var(--kb-offset, 0px) / -2))' }}
      >
        <DialogHeader>
          <DialogTitle>Save Palette</DialogTitle>
          <DialogDescription>Give your palette a name</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <label htmlFor="palette-name" className="sr-only">Palette name</label>
          <input
            id="palette-name"
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Palette name"
            maxLength={60}
            className="w-full h-10 px-3 rounded-button border border-border bg-card text-sm text-foreground placeholder-muted outline-none transition-all"
            onFocus={e => {
              e.currentTarget.style.borderColor = BRAND_VIOLET
              e.currentTarget.style.boxShadow = `0 0 0 3px rgba(108,71,255,0.15)`
              setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'hsl(var(--border))'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />

          <DialogFooter>
            <Button type="button" variant="outline" size="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="default">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
