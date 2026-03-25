import { useEffect, useRef, useState } from 'react'
import {
  Sparkles, Folder, User, ChevronLeft, ChevronRight,
  MoreHorizontal, ExternalLink, Puzzle, Scale,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { BRAND_VIOLET } from '@/lib/tokens'
import { DarkTooltip, DarkTooltipBubble } from './DarkTooltip'
import { ThemeToggle } from '@/components/ThemeToggle'
import { analytics } from '@/lib/posthog'

type SectionId = 'studio' | 'library' | 'profile'

export function Dock({
  expanded, section, dockPulse, isPro,
  onToggle, onSectionChange, onProGate,
}: {
  expanded: boolean
  section: SectionId
  dockPulse: boolean
  isPro: boolean
  onToggle: () => void
  onSectionChange: (s: SectionId) => void
  onProGate: (feature?: string, source?: string) => void
}) {
  const dockW = expanded ? 200 : 80

  return (
    <aside
      className="shrink-0 z-40 flex flex-col"
      style={{
        width: dockW,
        transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '12px 8px 12px 8px',
      }}
    >
      <nav
        className="flex-1 flex flex-col"
        style={{
          borderRadius: 16,
          backgroundColor: 'hsl(var(--card))',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.04)',
          padding: expanded ? '14px 12px' : '12px 8px',
        }}
      >
        {/* Dock logo — navigates to Studio */}
        <button
          onClick={() => onSectionChange('studio')}
          className="flex items-center shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-pill"
          style={{
            justifyContent: expanded ? 'flex-start' : 'center',
            padding: expanded ? '2px 6px 0' : '2px 0 0',
            marginBottom: expanded ? 14 : 10,
            gap: 10,
            background: 'none',
            border: 'none',
          }}
          aria-label="Go to Studio"
        >
          <img
            src="/logo.svg"
            alt="Paletta"
            className="shrink-0"
            style={{
              width: expanded ? 40 : 48,
              height: expanded ? 40 : 48,
              borderRadius: 12,
              objectFit: 'contain',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
            }}
          />
          {expanded && (
            <span className="text-[15px] font-medium font-brand text-foreground">Paletta</span>
          )}
        </button>

        {/* Section navigation */}
        <div className="flex flex-col" style={{ gap: expanded ? 4 : 6 }}>
          <DockItem
            icon={<Sparkles size={20} />}
            label="Studio"
            active={section === 'studio'}
            expanded={expanded}
            onClick={() => onSectionChange('studio')}
            pulse={dockPulse}
          />
          <DockItem
            icon={<Folder size={20} />}
            label="Library"
            active={section === 'library'}
            expanded={expanded}
            onClick={() => onSectionChange('library')}
          />
          <DockItem
            icon={<Puzzle size={20} />}
            label="Plugin"
            active={false}
            expanded={expanded}
            onClick={() => {
              analytics.track('plugin_nav_clicked')
              window.location.href = '/plugin'
            }}
          />
          <DockItem
            icon={<User size={20} />}
            label="Profile"
            active={section === 'profile'}
            expanded={expanded}
            onClick={() => onSectionChange('profile')}
          />
        </div>

        {/* Go Pro — free users only */}
        {!isPro && (
          <>
            <div
              style={{
                height: 1,
                margin: expanded ? '4px 14px' : '4px 8px',
                backgroundColor: 'hsl(var(--border) / 0.2)',
              }}
            />
            <div className="flex flex-col" style={{ gap: expanded ? 4 : 6 }}>
              <DockItem
                icon={<Sparkles size={20} />}
                label="Go Pro"
                active={false}
                expanded={expanded}
                onClick={() => {
                  analytics.track('sidebar_go_pro_clicked')
                  onProGate('sidebar_nav', 'sidebar')
                }}
                tint
              />
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* ─── Bottom utility group ─── */}
        {expanded ? (
          <div className="flex flex-col" style={{ gap: 8 }}>
            {/* Separator */}
            <div style={{ height: 1, margin: '0 14px', backgroundColor: 'hsl(var(--border) / 0.2)' }} />

            {/* Theme toggle — full width segmented control */}
            <div style={{ padding: '0 6px' }}>
              <ThemeToggle />
            </div>

            {/* Legal — icon + text row, opens popover */}
            <DockLegalMenu expanded />

            {/* Collapse */}
            <button
              onClick={onToggle}
              className="flex items-center w-full text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
              style={{ height: 36, padding: '0 14px', gap: 10, borderRadius: 8 }}
              aria-label="Collapse dock"
            >
              <ChevronLeft size={18} />
              <span>Collapse</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center" style={{ gap: 2 }}>
            <ThemeToggle collapsed />
            <DockLegalMenu expanded={false} />
            <DarkTooltip label="Expand" position="right">
              <button
                onClick={onToggle}
                className="w-12 h-12 flex items-center justify-center rounded-pill text-muted-foreground hover:text-foreground hover:bg-surface transition-colors active:scale-[0.98]"
                aria-label="Expand dock"
              >
                <ChevronRight size={20} />
              </button>
            </DarkTooltip>
          </div>
        )}
      </nav>
    </aside>
  )
}

// ─── Dock Item ───────────────────────────────────────────────
function DockItem({
  icon, label, active, primary, expanded, onClick, badge, proBadge, pulse, tint,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  primary?: boolean
  expanded: boolean
  onClick: () => void
  badge?: string
  proBadge?: boolean
  pulse?: boolean
  tint?: boolean
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const isCollapsed = !expanded

  return (
    <div className="relative" style={{ display: 'flex', justifyContent: isCollapsed ? 'center' : 'stretch' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => { if (isCollapsed) setShowTooltip(true) }}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          'flex items-center transition-colors duration-150 ease-in-out',
          !primary && !active && !tint && 'text-muted-foreground hover:bg-surface hover:text-foreground',
          tint && 'hover:bg-surface',
          pulse && 'dock-pulse'
        )}
        style={{
          width: isCollapsed ? 48 : '100%',
          height: 48,
          flexShrink: 0,
          borderRadius: 12,
          padding: expanded ? '0 14px' : '0',
          gap: expanded ? 12 : 0,
          justifyContent: expanded ? 'flex-start' : 'center',
          ...(primary ? {
            backgroundColor: BRAND_VIOLET,
            color: '#ffffff',
            fontWeight: 600,
          } : active ? {
            backgroundColor: 'rgba(108,71,255,0.08)',
            color: BRAND_VIOLET,
            fontWeight: 600,
          } : tint ? {
            color: BRAND_VIOLET,
            fontWeight: 600,
          } : {
            fontWeight: 500,
          }),
        }}
        onMouseOver={(e) => { if (primary) e.currentTarget.style.backgroundColor = 'hsl(var(--brand-violet-hover))' }}
        onMouseOut={(e) => { if (primary) e.currentTarget.style.backgroundColor = BRAND_VIOLET }}
        aria-label={label}
      >
        <span className="shrink-0 relative" style={{ strokeWidth: primary || active ? 2 : 1.5 }}>
          {icon}
          {isCollapsed && badge && (
            <span
              className="absolute flex items-center justify-center rounded-full font-bold text-white leading-none pointer-events-none"
              style={{
                top: -4,
                right: -4,
                minWidth: 16,
                height: 16,
                fontSize: 9,
                padding: '0 3px',
                backgroundColor: BRAND_VIOLET,
                border: '1px solid #ffffff',
              }}
            >
              {badge}
            </span>
          )}
          {isCollapsed && proBadge && (
            <Badge variant="pro" className="absolute -top-1 -right-1 text-[10px] px-1 py-0 pointer-events-none border border-white">PRO</Badge>
          )}
        </span>
        {expanded && (
          <>
            <span className="text-[14px] whitespace-nowrap">{label}</span>
            {badge && (
              <span
                className="text-[10px] font-bold text-white flex items-center justify-center"
                style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 4, backgroundColor: BRAND_VIOLET, padding: '0 5px' }}
              >
                {badge}
              </span>
            )}
            {proBadge && (
              <Badge variant="pro" className="ml-auto">PRO</Badge>
            )}
          </>
        )}
      </button>

      {/* Collapsed tooltip */}
      {showTooltip && isCollapsed && (
        <DarkTooltipBubble label={label} position="right" />
      )}
    </div>
  )
}

// ─── Dock Legal Menu ────────────────────────────────────────
function DockLegalMenu({ expanded }: { expanded: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const links = [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Cookie Policy', href: '/cookie-policy' },
  ]

  const popover = open && (
    <div
      className="absolute z-50 bg-card overflow-hidden"
      style={{
        ...(expanded
          ? { left: 0, bottom: '100%', marginBottom: 6 }
          : { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 10 }),
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        minWidth: 180,
        padding: '6px 0',
      }}
      role="menu"
    >
      {links.map(l => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 text-[12px] font-medium transition-all hover:bg-surface"
          style={{ color: 'hsl(var(--foreground))', textDecoration: 'none' }}
          role="menuitem"
          onClick={() => setOpen(false)}
        >
          {l.label}
          <ExternalLink size={12} className="opacity-40 ml-auto" />
        </a>
      ))}
    </div>
  )

  if (expanded) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center w-full text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          style={{ height: 36, padding: '0 14px', gap: 10, borderRadius: 8, background: 'none', border: 'none' }}
          aria-label="Legal links"
          aria-expanded={open}
        >
          <Scale size={18} />
          <span>Legal</span>
        </button>
        {popover}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative flex justify-center py-1">
      <DarkTooltip label="Legal" position="right">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-12 h-12 flex items-center justify-center rounded-pill text-muted-foreground hover:text-foreground hover:bg-surface transition-colors active:scale-[0.98]"
          aria-label="Legal links"
          aria-expanded={open}
        >
          <MoreHorizontal size={20} />
        </button>
      </DarkTooltip>
      {popover}
    </div>
  )
}
