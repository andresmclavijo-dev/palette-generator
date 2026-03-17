import { useEffect, useState } from 'react'

import { BRAND_VIOLET as ACCENT } from '../../lib/tokens'

const LS_KEY = 'paletta_welcomed'

export default function WelcomeModal() {
  const [open, setOpen] = useState(false)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  useEffect(() => {
    if (!localStorage.getItem(LS_KEY)) setOpen(true)
  }, [])

  const dismiss = () => {
    setOpen(false)
    localStorage.setItem(LS_KEY, '1')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={dismiss}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-[360px] max-w-[90vw] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-8 pb-2 text-center">
          <h2 className="text-[22px] font-bold text-gray-900">Welcome to Paletta</h2>
        </div>

        <div className="flex flex-col items-center gap-2 px-6 py-5">
          {isMobile ? (
            <>
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-50 text-[12px] font-medium text-gray-600 whitespace-nowrap">
                <span>Tap Generate to start</span>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-50 text-[12px] font-medium text-gray-600 whitespace-nowrap">
                <span>Tap a color to lock it</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-50 text-[12px] font-medium text-gray-600 whitespace-nowrap">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 font-mono text-[10px]">Space</kbd>
                <span>to generate</span>
              </div>
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-50 text-[12px] font-medium text-gray-600 whitespace-nowrap">
                <span>Click a color to lock it in place</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-50 text-[12px] font-medium text-gray-600 whitespace-nowrap">
            <span>✨</span>
            <span>3 AI generations left today</span>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={dismiss}
            className="w-full h-11 rounded-full text-white text-[14px] font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: ACCENT }}
          >
            Start generating &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
