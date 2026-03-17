import { useEffect, useState } from 'react'
import { create } from 'zustand'

interface ToastState {
  message: string
  variant: 'default' | 'warning'
  key: number
  show: (message: string, variant?: 'default' | 'warning') => void
}

export const useToast = create<ToastState>((set) => ({
  message: '',
  variant: 'default',
  key: 0,
  show: (message, variant = 'default') =>
    set((s) => ({ message, variant, key: s.key + 1 })),
}))

export function toast(message: string, variant?: 'default' | 'warning') {
  useToast.getState().show(message, variant)
}

export default function Toast() {
  const { message, variant, key } = useToast()
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (!message) return
    setVisible(true)
    setFading(false)

    const fadeTimer = setTimeout(() => setFading(true), 900)
    const hideTimer = setTimeout(() => {
      setVisible(false)
      setFading(false)
    }, 1200)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null

  const isWarning = variant === 'warning'

  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] pointer-events-none"
      style={{
        opacity: fading ? 0 : 1,
        transition: 'opacity 300ms ease-out',
      }}
      role="status"
      aria-live="polite"
    >
      <div
        className="px-4 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap shadow-lg"
        style={
          isWarning
            ? { backgroundColor: '#FEF3C7', color: '#92400E' }
            : { backgroundColor: '#1a1a2e', color: '#ffffff' }
        }
      >
        {message}
      </div>
    </div>
  )
}
