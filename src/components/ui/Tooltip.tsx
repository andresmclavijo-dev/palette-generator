import { useState, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'

interface TooltipProps {
  text: string
  children: ReactNode
  position?: 'top' | 'bottom'
}

export default function Tooltip({ text, children, position = 'bottom' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), 400)
  }, [])

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setVisible(false)
  }, [])

  const isTop = position === 'top'

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <div
        className={`absolute left-1/2 -translate-x-1/2 z-[80] pointer-events-none transition-opacity duration-150
          ${isTop ? 'bottom-full mb-2' : 'top-full mt-2'}
          ${visible ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <div className="relative px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium shadow-lg whitespace-nowrap">
          {text}
          {/* Arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45
              ${isTop ? '-bottom-1' : '-top-1'}
            `}
          />
        </div>
      </div>
    </div>
  )
}
