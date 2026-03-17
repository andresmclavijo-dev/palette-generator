import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface TooltipProps {
  text: string
  children: ReactNode
  disabled?: boolean
  position?: 'top' | 'bottom'
}

export default function Tooltip({ text, children, disabled, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    if (position === 'bottom') {
      setPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      })
    } else {
      setPos({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      })
    }
  }, [position])

  const show = useCallback(() => {
    if (disabled) return
    timerRef.current = setTimeout(() => {
      updatePos()
      setVisible(true)
    }, 350)
  }, [disabled, updatePos])

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    setVisible(false)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (disabled) hide()
  }, [disabled, hide])

  const transform = position === 'bottom'
    ? 'translate(-50%, 0)'
    : 'translate(-50%, -100%)'

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </div>
      {visible && createPortal(
        <div
          className="fixed pointer-events-none"
          style={{
            top: pos.top,
            left: pos.left,
            transform,
            zIndex: 9999,
          }}
        >
          <div className="px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium shadow-lg whitespace-nowrap pointer-events-none">
            {text}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
