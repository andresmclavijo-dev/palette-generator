import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { BRAND_DARK } from '@/lib/tokens'
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

/** Fixed internal render width for each template */
const TEMPLATE_WIDTH: Record<TemplateId, number> = {
  brand: 600,
  landing: 800,
  dashboard: 900,
  mobile: 380,
}

/**
 * Renders children at a fixed internal width and CSS-scales to fit container.
 * Centers content when the container is wider than the template.
 */
function ScaledFrame({ templateWidth, children }: {
  templateWidth: number
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [cw, setCw] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      if (w > 0) {
        setCw(w)
        setScale(Math.min(w / templateWidth, 1))
      }
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [templateWidth])

  const centered = scale >= 1 && cw > templateWidth

  return (
    <div ref={ref} style={{ height: '100%', overflow: 'hidden' }}>
      <div style={{
        width: templateWidth,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        opacity: scale > 0 ? 1 : 0,
        ...(centered && { marginLeft: (cw - templateWidth) / 2 }),
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

  const renderTemplate = (id: TemplateId) => {
    switch (id) {
      case 'brand': return <BrandPattern p={palette} />
      case 'landing': return <LandingPreview p={palette} />
      case 'dashboard': return <DashboardPreview p={palette} />
      case 'mobile': return <MobilePreview p={palette} />
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 16,
        maxWidth: 1000,
        margin: '0 auto',
        paddingTop: isMobile ? 8 : 0,
        paddingBottom: isMobile ? 16 : 0,
      }}
    >
      {TEMPLATES.map(t => {
        const locked = !t.free && !isPro
        const tw = TEMPLATE_WIDTH[t.id]
        return (
          <div
            key={t.id}
            className="overflow-hidden"
            style={{
              borderRadius: 16,
              backgroundColor: '#ffffff',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Browser chrome */}
            <div
              className="flex items-center px-3"
              style={{ height: 30, backgroundColor: '#F5F5F5', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}
            >
              <div className="flex" style={{ gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FF5F57' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FEBC2E' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#28C840' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 12px' }}>
                <div style={{ width: '60%', height: 14, borderRadius: 4, backgroundColor: '#e5e7eb' }} />
              </div>
            </div>

            {/* Template content — uniform 3:2 aspect ratio, scaled to fit */}
            <div className="relative" style={{ aspectRatio: '3/2', overflow: 'hidden' }}>
              <div style={{
                filter: locked ? 'blur(5px)' : undefined,
                opacity: locked ? 0.5 : 1,
                pointerEvents: 'none',
                height: '100%',
              }}>
                <ScaledFrame templateWidth={tw}>
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
                    <Badge variant="pro" className="text-[12px] px-2.5 py-1">PRO</Badge>
                    <span className="text-[13px] font-semibold" style={{ color: BRAND_DARK }}>
                      Go Pro to preview {t.label}
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Label bar */}
            <div
              className="flex items-center gap-2"
              style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '8px 12px', flexShrink: 0 }}
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
  )
}
