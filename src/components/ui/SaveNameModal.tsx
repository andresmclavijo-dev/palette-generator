import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { BRAND_VIOLET } from '../../lib/tokens'

interface SaveNameModalProps {
  open: boolean
  defaultName: string
  onConfirm: (name: string) => void
  onClose: () => void
}

export default function SaveNameModal({ open, defaultName, onConfirm, onClose }: SaveNameModalProps) {
  const [name, setName] = useState(defaultName)
  const [entering, setEntering] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName(defaultName)
      setEntering(true)
      requestAnimationFrame(() => {
        setEntering(false)
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [open, defaultName])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(name.trim() || defaultName)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'opacity 150ms ease-out',
          opacity: entering ? 0 : 1,
        }}
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md bg-white shadow-2xl"
        style={{
          borderRadius: 16,
          padding: 24,
          transition: 'transform 150ms ease-out, opacity 150ms ease-out',
          transform: entering ? 'scale(0.95)' : 'scale(1)',
          opacity: entering ? 0 : 1,
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Save palette"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 m-0">Save Palette</h2>
            <p className="text-sm text-gray-500 mt-0.5 m-0">Give your palette a name</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

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
            className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 outline-none transition-all"
            style={{
              borderColor: undefined,
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = BRAND_VIOLET
              e.currentTarget.style.boxShadow = `0 0 0 3px rgba(108,71,255,0.15)`
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#e5e7eb'
              e.currentTarget.style.boxShadow = 'none'
            }}
            onKeyDown={e => { if (e.key === 'Escape') onClose() }}
          />

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 h-9 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-colors"
              style={{ backgroundColor: BRAND_VIOLET }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
