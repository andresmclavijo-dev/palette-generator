import { useEffect, useState } from 'react'
import {
  Shuffle, Sparkles, Lock, Download,
  Undo2, Redo2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { readableOn } from '@/lib/colorEngine'
import { BRAND_VIOLET, BRAND_DARK } from '@/lib/tokens'
import { analytics } from '@/lib/posthog'
import { Badge } from '@/components/ui/badge'
import { DarkTooltip } from './DarkTooltip'

export function PreviewMode({
  swatches, isPro, onGenerate, onExport, onUndo, onRedo, onProGate, onLock, visionFilter,
}: {
  swatches: { id: string; hex: string; locked: boolean }[]
  isPro: boolean
  onGenerate: () => void
  onExport: () => void
  onUndo: () => void
  onRedo: () => void
  onProGate: (feature?: string, source?: string) => void
  onLock: (id: string) => void
  visionFilter?: string
}) {
  const hexes = swatches.map(s => s.hex)
  const c = (i: number) => hexes[i % hexes.length]
  const [entering, setEntering] = useState(true)

  useEffect(() => {
    requestAnimationFrame(() => setEntering(false))
  }, [])

  return (
    <div className="absolute inset-0" style={{ backgroundColor: 'hsl(var(--surface-warm))' }}>
      {/* Scrollable content area */}
      <div className="absolute inset-0 overflow-y-auto">
        {/* ─ Mockup grid ─ */}
        <div
          style={{
            padding: '68px 24px 80px',
            opacity: entering ? 0 : 1,
            transition: 'opacity 300ms ease 100ms',
            filter: visionFilter,
          }}
      >
        <div
          className="grid mx-auto"
          style={{ gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 1000 }}
        >
          {/* Card 1: Landing page (FREE) */}
          <MockupCard label="Landing page" badge="Free" badgeStyle="free">
            <LandingMockup c={c} />
          </MockupCard>

          {/* Card 2: Dashboard (PRO) */}
          <MockupCard
            label="Dashboard"
            badge="PRO"
            badgeStyle="pro"
            blurred={!isPro}
            onProClick={() => { onProGate('preview_dashboard', 'preview_grid'); analytics.track('pro_gate_hit', { feature: 'preview_dashboard' }) }}
          >
            <DashboardMockup c={c} />
          </MockupCard>

          {/* Card 3: Mobile app (PRO, full width) */}
          <div style={{ gridColumn: '1 / -1' }}>
            <MockupCard
              label="Mobile app"
              badge="PRO"
              badgeStyle="pro"
              blurred={!isPro}
              onProClick={() => { onProGate('preview_mobile', 'preview_grid'); analytics.track('pro_gate_hit', { feature: 'preview_mobile' }) }}
            >
              <MobileAppMockup c={c} />
            </MockupCard>
          </div>
        </div>
      </div>{/* close padding/content div */}
      </div>{/* close scrollable content area */}

      {/* ─ Floating control footer ─ */}
      <div
        className="absolute z-20 flex items-center"
        style={{
          bottom: 12,
          left: 12,
          right: 12,
          height: 52,
          borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.04)',
          padding: '4px 8px',
          gap: 6,
          transform: entering ? 'translateY(20px)' : 'translateY(0)',
          opacity: entering ? 0 : 1,
          transition: 'transform 200ms ease-out 100ms, opacity 200ms ease-out 100ms',
        }}
      >
        {/* Color swatches */}
        <div className="flex items-center" style={{ gap: 6 }}>
          {swatches.map(s => (
            <button
              key={s.id}
              onClick={() => onLock(s.id)}
              className="relative flex items-center justify-center transition-all hover:scale-105"
              style={{
                width: 36, height: 36, padding: 0, borderRadius: 8,
                backgroundColor: s.hex, border: '1px solid rgba(0,0,0,0.08)',
              }}
              aria-label={`${s.hex} ${s.locked ? '(locked)' : '(unlocked)'}`}
            >
              {s.locked && (
                <Lock size={12} style={{ color: readableOn(s.hex) }} />
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, backgroundColor: 'rgba(0,0,0,0.08)', margin: '0 6px' }} />

        {/* Tool buttons */}
        <div className="flex items-center" style={{ gap: 6 }}>
          <DarkTooltip label="Generate" position="top">
            <button
              onClick={onGenerate}
              className="flex items-center justify-center transition-all hover:bg-black/[0.06]"
              style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
              aria-label="Generate new palette"
            >
              <Shuffle size={20} strokeWidth={1.5} style={{ color: 'hsl(var(--foreground))' }} />
            </button>
          </DarkTooltip>
          <DarkTooltip label="Undo" position="top">
            <button
              onClick={onUndo}
              className="flex items-center justify-center transition-all hover:bg-black/[0.06]"
              style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
              aria-label="Undo"
            >
              <Undo2 size={20} strokeWidth={1.5} style={{ color: 'hsl(var(--foreground))' }} />
            </button>
          </DarkTooltip>
          <DarkTooltip label="Redo" position="top">
            <button
              onClick={onRedo}
              className="flex items-center justify-center transition-all hover:bg-black/[0.06]"
              style={{ width: 36, height: 36, padding: 0, borderRadius: 8 }}
              aria-label="Redo"
            >
              <Redo2 size={20} strokeWidth={1.5} style={{ color: 'hsl(var(--foreground))' }} />
            </button>
          </DarkTooltip>
        </div>

        <div className="flex-1" />

        {/* Generate + Export */}
        <Button
          variant="outline"
          size="default"
          onClick={onGenerate}
          className="text-[13px] font-medium gap-1.5"
        >
          <Sparkles size={16} strokeWidth={1.5} />
          Generate
        </Button>
        <Button
          variant="default"
          size="default"
          onClick={onExport}
          className="text-[13px] font-semibold gap-1.5"
        >
          <Download size={16} strokeWidth={1.5} />
          Export
        </Button>
      </div>
    </div>
  )
}

// ─── Mockup Card Wrapper ─────────────────────────────────────
function MockupCard({
  label, badge, badgeStyle, blurred, onProClick, children,
}: {
  label: string
  badge: string
  badgeStyle: 'free' | 'pro'
  blurred?: boolean
  onProClick?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden" style={{ borderRadius: 12, backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3" style={{ height: 28, backgroundColor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex" style={{ gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#eab308' }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e' }} />
        </div>
        <div className="flex-1 h-4 rounded" style={{ backgroundColor: '#e5e7eb', maxWidth: 180 }} />
      </div>

      {/* Content */}
      <div className="relative">
        <div style={{ filter: blurred ? 'blur(4px)' : undefined, opacity: blurred ? 0.5 : 1 }}>
          {children}
        </div>

        {/* PRO lock overlay */}
        {blurred && (
          <button
            onClick={onProClick}
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            aria-label={`Unlock ${label} preview`}
          >
            <div
              className="flex flex-col items-center gap-2"
              style={{
                backgroundColor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: 12,
                padding: '16px 24px',
              }}
            >
              <Lock size={24} style={{ color: BRAND_VIOLET }} />
              <span className="text-[13px] font-semibold" style={{ color: BRAND_DARK }}>
                {label} preview
              </span>
              <Badge variant="pro">PRO</Badge>
            </div>
          </button>
        )}
      </div>

      {/* Label */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <span className="text-[12px] font-medium" style={{ color: BRAND_DARK }}>{label}</span>
        {badgeStyle === 'pro' ? (
          <Badge variant="pro">{badge}</Badge>
        ) : (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5"
            style={{
              borderRadius: 4,
              backgroundColor: '#e5e7eb',
              color: '#374151',
            }}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Landing Page Mockup ─────────────────────────────────────
function LandingMockup({ c }: { c: (i: number) => string }) {
  return (
    <div style={{ height: 280 }}>
      {/* Nav */}
      <div className="flex items-center justify-between px-4" style={{ height: 36, backgroundColor: '#ffffff' }}>
        <div className="w-16 h-3 rounded" style={{ backgroundColor: c(0) }} />
        <div className="flex gap-3">
          <div className="w-10 h-2.5 rounded bg-gray-200" />
          <div className="w-10 h-2.5 rounded bg-gray-200" />
          <div className="w-14 h-6 rounded-full" style={{ backgroundColor: c(1) }} />
        </div>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center" style={{ height: 140, backgroundColor: c(0) }}>
        <div className="w-32 h-3 rounded-full mb-2" style={{ backgroundColor: readableOn(c(0)), opacity: 0.8 }} />
        <div className="w-48 h-2 rounded-full mb-4" style={{ backgroundColor: readableOn(c(0)), opacity: 0.4 }} />
        <div className="flex gap-2">
          <div className="w-20 h-7 rounded-full" style={{ backgroundColor: c(1) }} />
          <div className="w-20 h-7 rounded-full" style={{ border: `1.5px solid ${readableOn(c(0))}`, opacity: 0.5 }} />
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-3 p-4" style={{ backgroundColor: '#ffffff' }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: c(i + 2) }} />
            <div className="w-12 h-1.5 rounded bg-gray-200" />
            <div className="w-16 h-1 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard Mockup ────────────────────────────────────────
function DashboardMockup({ c }: { c: (i: number) => string }) {
  return (
    <div className="flex" style={{ height: 280 }}>
      {/* Sidebar */}
      <div className="flex flex-col gap-2 p-2" style={{ width: 60, backgroundColor: c(0) }}>
        <div className="w-7 h-7 rounded-lg mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="w-7 h-5 rounded mx-auto" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 p-3" style={{ backgroundColor: '#f9fafb' }}>
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-lg p-2" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
              <div className="w-8 h-1.5 rounded bg-gray-200 mb-1" />
              <div className="w-12 h-3 rounded" style={{ backgroundColor: c(i + 1), opacity: 0.8 }} />
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="rounded-lg p-3" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', height: 140 }}>
          <div className="w-16 h-2 rounded bg-gray-200 mb-3" />
          <div className="flex items-end gap-1.5 h-[90px]">
            {[65, 40, 80, 55, 90, 45, 70, 60].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${h}%`, backgroundColor: c(i), opacity: 0.7 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mobile App Mockup ───────────────────────────────────────
function MobileAppMockup({ c }: { c: (i: number) => string }) {
  return (
    <div className="flex justify-center gap-4 py-4 px-6" style={{ height: 300, backgroundColor: '#f9fafb' }}>
      {[0, 1, 2].map(screen => (
        <div
          key={screen}
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{ width: 120, backgroundColor: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-2" style={{ height: 18, backgroundColor: c(screen), fontSize: 8 }}>
            <span style={{ color: readableOn(c(screen)), opacity: 0.6, fontSize: 7 }}>9:41</span>
            <div className="flex gap-0.5">
              <div className="w-2 h-1.5 rounded-sm" style={{ backgroundColor: readableOn(c(screen)), opacity: 0.4 }} />
              <div className="w-2 h-1.5 rounded-sm" style={{ backgroundColor: readableOn(c(screen)), opacity: 0.4 }} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-2 flex flex-col gap-1.5">
            {screen === 0 && (
              <>
                <div className="w-16 h-2 rounded" style={{ backgroundColor: c(0), opacity: 0.8 }} />
                <div className="w-full h-1.5 rounded bg-gray-100" />
                <div className="w-3/4 h-1.5 rounded bg-gray-100" />
                <div className="mt-1 w-14 h-5 rounded-full" style={{ backgroundColor: c(1) }} />
              </>
            )}
            {screen === 1 && (
              <>
                <div className="w-12 h-2 rounded bg-gray-200" />
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="h-8 rounded" style={{ backgroundColor: c(i), opacity: 0.6 }} />
                  ))}
                </div>
              </>
            )}
            {screen === 2 && (
              <>
                <div className="w-full h-16 rounded-lg" style={{ backgroundColor: c(2), opacity: 0.5 }} />
                <div className="w-14 h-2 rounded bg-gray-200 mt-1" />
                <div className="w-full h-1.5 rounded bg-gray-100" />
              </>
            )}
          </div>

          {/* Tab bar */}
          <div className="flex items-center justify-around px-1" style={{ height: 22, borderTop: '1px solid #e5e7eb' }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: i === screen ? c(screen) : '#d1d5db' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
