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
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const newPos = {
      top: position === 'bottom' ? rect.bottom + 8 : rect.top - 8,
      left: rect.left + rect.width / 2,
    }
    setPos(newPos)

    // Clamp after render so tooltip stays in viewport
    requestAnimationFrame(() => {
      if (!tooltipRef.current) return
      const tip = tooltipRef.current.getBoundingClientRect()
      const pad = 8
      let clampedLeft = newPos.left
      if (tip.left < pad) {
        clampedLeft = newPos.left + (pad - tip.left)
      } else if (tip.right > window.innerWidth - pad) {
        clampedLeft = newPos.left - (tip.right - window.innerWidth + pad)
      }
      if (clampedLeft !== newPos.left) {
        setPos(prev => ({ ...prev, left: clampedLeft }))
      }
    })
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
          ref={tooltipRef}
          className="fixed pointer-events-none"
          style={{
            top: pos.top,
            left: pos.left,
            transform,
            zIndex: 9999,
          }}
        >
          <div className="px-2.5 py-1.5 rounded-lg bg-foreground text-card text-xs font-medium shadow-lg whitespace-nowrap pointer-events-none">
            {text}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
