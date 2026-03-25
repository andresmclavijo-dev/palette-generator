import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Lock, Maximize2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BRAND_VIOLET, BRAND_DARK } from '@/lib/tokens'
import { mapPreviewColors } from '@/lib/previewColors'
import { BrandPattern } from './BrandPattern'
import { LandingPreview } from './LandingPreview'
import { DashboardPreview } from './DashboardPreview'
import { MobilePreview } from './MobilePreview'

type TemplateId = 'brand' | 'landing' | 'dashboard' | 'mobile'

interface Template {
  id: TemplateId
  label: string
  free: boolean
}

const TEMPLATES: Template[] = [
  { id: 'brand', label: 'Brand Pattern', free: true },
  { id: 'landing', label: 'Landing Page', free: true },
  { id: 'dashboard', label: 'Dashboard', free: false },
  { id: 'mobile', label: 'Mobile App', free: false },
]

/** Fixed internal render size for each template */
const TEMPLATE_SIZES: Record<TemplateId, { w: number; h: number }> = {
  brand: { w: 600, h: 375 },
  landing: { w: 800, h: 600 },
  dashboard: { w: 900, h: 520 },
  mobile: { w: 380, h: 650 },
}

/**
 * Renders children at a fixed internal size and CSS-scales to fit container width.
 * Prevents text reflow / layout breaking at different card sizes.
 */
function ScaledFrame({ templateWidth, templateHeight, children }: {
  templateWidth: number
  templateHeight: number
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w > 0) setScale(Math.min(w / templateWidth, 1))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [templateWidth])

  return (
    <div ref={ref} style={{ overflow: 'hidden', height: scale > 0 ? templateHeight * scale : 0 }}>
      <div style={{
        width: templateWidth,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        opacity: scale > 0 ? 1 : 0,
      }}>
        {children}
      </div>
    </div>
  )
}

export function PreviewGrid({
  hexes,
  isPro,
  onProGate,
  isMobile,
}: {
  hexes: string[]
  isPro: boolean
  onProGate: (feature?: string, source?: string) => void
  isMobile?: boolean
}) {
  const palette = useMemo(() => mapPreviewColors(hexes), [hexes])
  const [expanded, setExpanded] = useState<TemplateId | null>(null)

  const handleExpand = useCallback((id: TemplateId, free: boolean) => {
    if (!free && !isPro) {
      onProGate(`preview_${id}`, 'preview_grid')
      return
    }
    setExpanded(id)
  }, [isPro, onProGate])

  // Close on Escape
  useEffect(() => {
    if (!expanded) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [expanded])

  const renderTemplate = (id: TemplateId) => {
    switch (id) {
      case 'brand': return <BrandPattern p={palette} />
      case 'landing': return <LandingPreview p={palette} />
      case 'dashboard': return <DashboardPreview p={palette} />
      case 'mobile': return <MobilePreview p={palette} />
    }
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 16,
          maxWidth: 1000,
          margin: '0 auto',
          paddingTop: isMobile ? 8 : 0,
          paddingBottom: isMobile ? 160 : 0,
        }}
      >
        {TEMPLATES.map(t => {
          const locked = !t.free && !isPro
          const size = TEMPLATE_SIZES[t.id]
          return (
            <div
              key={t.id}
              className="overflow-hidden"
              style={{
                borderRadius: 16,
                backgroundColor: '#ffffff',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}
            >
              {/* Browser chrome */}
              <div
                className="flex items-center gap-2 px-3"
                style={{ height: 32, backgroundColor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
              >
                <div className="flex" style={{ gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#eab308' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                </div>
                <div className="flex-1 h-4 rounded" style={{ backgroundColor: '#e5e7eb', maxWidth: 200 }} />
                <button
                  onClick={() => handleExpand(t.id, t.free)}
                  className="flex items-center justify-center transition-opacity opacity-50 hover:opacity-100"
                  style={{
                    width: 24, height: 24, borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.06)',
                    border: 'none', cursor: 'pointer', color: '#6b7280',
                  }}
                  aria-label={`Expand ${t.label}`}
                >
                  <Maximize2 size={11} />
                </button>
              </div>

              {/* Template content — scaled to fit */}
              <div className="relative" style={{ overflow: 'hidden' }}>
                <div style={{ filter: locked ? 'blur(5px)' : undefined, opacity: locked ? 0.5 : 1, pointerEvents: 'none' }}>
                  <ScaledFrame templateWidth={size.w} templateHeight={size.h}>
                    {renderTemplate(t.id)}
                  </ScaledFrame>
                </div>

                {/* Pro lock overlay */}
                {locked && (
                  <button
                    onClick={() => onProGate(`preview_${t.id}`, 'preview_grid')}
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    style={{ background: 'none', border: 'none' }}
                    aria-label={`Unlock ${t.label} preview`}
                  >
                    <div
                      className="flex flex-col items-center gap-2.5"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderRadius: 14,
                        padding: '20px 28px',
                      }}
                    >
                      <Lock size={22} style={{ color: BRAND_VIOLET }} />
                      <span className="text-[13px] font-semibold" style={{ color: BRAND_DARK }}>
                        Go Pro to preview {t.label}
                      </span>
                      <Badge variant="pro">PRO</Badge>
                    </div>
                  </button>
                )}
              </div>

              {/* Label bar */}
              <div
                className="flex items-center gap-2 px-3"
                style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '8px 12px' }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', opacity: 0.6 }}>{t.label}</span>
                {t.free ? (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5"
                    style={{ borderRadius: 4, backgroundColor: '#e5e7eb', color: '#374151' }}
                  >
                    Free
                  </span>
                ) : (
                  <Badge variant="pro">PRO</Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Fullscreen overlay — renders at native size (no scaling) */}
      {expanded && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setExpanded(null)}
        >
          <button
            onClick={() => setExpanded(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
          <div
            className="overflow-auto rounded-2xl"
            style={{
              maxWidth: '92vw',
              maxHeight: '90vh',
              backgroundColor: '#ffffff',
              boxShadow: '0 20px 80px rgba(0,0,0,0.4)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {renderTemplate(expanded)}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
