import { useEffect, useRef } from 'react'

interface ProGateProps {
  open: boolean
  onClose: () => void
  anchorRef?: React.RefObject<HTMLElement | null>
}

export default function ProGate({ open, onClose, anchorRef }: ProGateProps) {
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        popRef.current && !popRef.current.contains(e.target as Node) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target as Node))
      ) {
        onClose()
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 10)
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler) }
  }, [open, onClose, anchorRef])

  if (!open) return null

  return (
    <div
      ref={popRef}
      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-4 text-center"
      onClick={e => e.stopPropagation()}
    >
      <div className="text-[16px] mb-1.5">🔒</div>
      <p className="text-[13px] font-semibold text-gray-800">Pro Feature</p>
      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
        $5/month when Pro launches. You'll be first to know.
      </p>
      <button
        onClick={onClose}
        className="mt-3 px-4 h-8 rounded-full text-[12px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
      >
        Got it
      </button>
    </div>
  )
}
