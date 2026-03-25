import { useEffect, useRef, useState } from 'react'
import {
  Sparkles, Folder, User, ChevronLeft, ChevronRight,
  MoreHorizontal, ExternalLink, Puzzle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { BRAND_VIOLET } from '@/lib/tokens'
import { DarkTooltip, DarkTooltipBubble } from './DarkTooltip'
import { ThemeToggle } from '@/components/ThemeToggle'
import { analytics } from '@/lib/posthog'

type SectionId = 'studio' | 'library' | 'profile'

export function Dock({
  expanded, section, dockPulse,
  onToggle, onSectionChange,
}: {
  expanded: boolean
  section: SectionId
  dockPulse: boolean
  onToggle: () => void
  onSectionChange: (s: SectionId) => void
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
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profile — at bottom, separated */}
        <DockItem
          icon={<User size={20} />}
          label="Profile"
          active={section === 'profile'}
          expanded={expanded}
          onClick={() => onSectionChange('profile')}
        />

        {/* Theme toggle */}
        <div className="flex justify-center" style={{ margin: expanded ? '8px 0' : '6px 0' }}>
          <ThemeToggle compact collapsed={!expanded} />
        </div>

        {/* Info / Legal links */}
        <DockInfoMenu expanded={expanded} />

        {/* Collapse / Expand toggle */}
        {expanded ? (
          <button
            onClick={onToggle}
            className="flex items-center w-full text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            style={{ height: 48, padding: '0 14px', gap: 8, borderRadius: 12 }}
            aria-label="Collapse dock"
          >
            <ChevronLeft size={20} />
            <span>Collapse</span>
          </button>
        ) : (
          <DarkTooltip label="Expand" position="right">
            <button
              onClick={onToggle}
              className="mx-auto w-12 h-12 flex items-center justify-center rounded-pill text-muted-foreground hover:text-foreground hover:bg-surface transition-colors active:scale-[0.98]"
              aria-label="Expand dock"
            >
              <ChevronRight size={20} />
            </button>
          </DarkTooltip>
        )}
      </nav>
    </aside>
  )
}

// ─── Dock Item ───────────────────────────────────────────────
function DockItem({
  icon, label, active, primary, expanded, onClick, badge, proBadge, pulse,
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
          !primary && !active && 'text-muted-foreground hover:bg-surface hover:text-foreground',
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

// ─── Dock Info Menu ─────────────────────────────────────────
function DockInfoMenu({ expanded }: { expanded: boolean }) {
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

  if (expanded) {
    return (
      <div className="mt-4 pt-4 border-t border-border flex flex-col gap-1" style={{ marginBottom: 8 }}>
        {links.map(l => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            style={{ textDecoration: 'none', padding: '0 14px' }}
          >
            {l.label}
          </a>
        ))}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative flex justify-center py-1">
      <DarkTooltip label="More" position="right">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-12 h-12 flex items-center justify-center rounded-pill text-muted-foreground hover:text-foreground hover:bg-surface transition-colors active:scale-[0.98]"
          aria-label="Info and legal links"
          aria-expanded={open}
        >
          <MoreHorizontal size={20} />
        </button>
      </DarkTooltip>

      {open && (
        <div
          className="absolute z-50 bg-card rounded-xl overflow-hidden"
          style={{
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            minWidth: 200,
            padding: '8px 0',
          }}
          role="menu"
        >
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium transition-all hover:bg-surface"
              style={{ color: 'hsl(var(--foreground))', textDecoration: 'none' }}
              role="menuitem"
            >
              {l.label}
              <ExternalLink size={14} className="opacity-40 ml-auto" />
            </a>
          ))}

        </div>
      )}
    </div>
  )
}
