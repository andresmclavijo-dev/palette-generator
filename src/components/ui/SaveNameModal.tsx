import { useEffect, useRef, useState } from 'react'

const BRAND = '#1A73E8'

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
      // Focus + select after render
      requestAnimationFrame(() => {
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-[90vw] max-w-sm bg-white rounded-2xl shadow-xl p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-[16px] font-semibold text-gray-800 mb-1">Save Palette</div>
        <p className="text-[12px] text-gray-400 mb-4">Give your palette a name</p>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Palette name"
            maxLength={60}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 placeholder-gray-300 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all"
            onKeyDown={e => { if (e.key === 'Escape') onClose() }}
          />

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-full text-[13px] font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-10 rounded-full text-[13px] font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
              style={{ backgroundColor: BRAND }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
