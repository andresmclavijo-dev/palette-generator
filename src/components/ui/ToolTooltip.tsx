import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

interface ToolTooltipProps {
  description: string
  showProBadge?: boolean
  children: ReactNode
  disabled?: boolean
}

export default function ToolTooltip({ description, showProBadge, children, disabled }: ToolTooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const newPos = {
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    }
    setPos(newPos)

    // Clamp horizontally so popover stays in viewport
    requestAnimationFrame(() => {
      if (!popoverRef.current) return
      const tip = popoverRef.current.getBoundingClientRect()
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
  }, [])

  const show = useCallback(() => {
    if (disabled) return
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }
    showTimer.current = setTimeout(() => {
      updatePos()
      setVisible(true)
    }, 150)
  }, [disabled, updatePos])

  const hide = useCallback(() => {
    if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null }
    hideTimer.current = setTimeout(() => {
      setVisible(false)
    }, 150)
  }, [])

  useEffect(() => {
    return () => {
      if (showTimer.current) clearTimeout(showTimer.current)
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  useEffect(() => {
    if (disabled) {
      setVisible(false)
      if (showTimer.current) clearTimeout(showTimer.current)
    }
  }, [disabled])

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex shrink-0"
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </div>
      {visible && createPortal(
        <div
          ref={popoverRef}
          className="fixed pointer-events-none hidden sm:block"
          style={{
            top: pos.top,
            left: pos.left,
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          {/* Arrow */}
          <div
            className="mx-auto"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '6px solid hsl(var(--card))',
              margin: '0 auto',
            }}
          />
          {/* Popover body */}
          <div className="bg-card border border-border rounded-button shadow-md px-3 py-2" style={{ maxWidth: 220 }}>
            <p className="text-[13px] text-muted-foreground leading-snug m-0">
              {description}
            </p>
            {showProBadge && (
              <Badge variant="pro" className="mt-1.5">PRO</Badge>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
