import { useEffect, useRef, useState } from 'react'
import {
  Sparkles, Folder, User, ChevronLeft, ChevronRight,
  MoreHorizontal, ExternalLink,
} from 'lucide-react'
import { BRAND_VIOLET, BRAND_DARK } from '../../lib/tokens'
import { DarkTooltip, DarkTooltipBubble } from './DarkTooltip'

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
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.04)',
          padding: expanded ? '14px 12px' : '12px 8px',
        }}
      >
        {/* Dock logo */}
        <div
          className="flex items-center shrink-0"
          style={{
            justifyContent: expanded ? 'flex-start' : 'center',
            padding: expanded ? '2px 6px 0' : '2px 0 0',
            marginBottom: expanded ? 14 : 10,
            gap: 10,
          }}
        >
          <div
            className="flex items-center justify-center text-white font-bold shrink-0"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: BRAND_VIOLET,
              fontSize: 16,
            }}
          >
            P
          </div>
          {expanded && (
            <span className="text-[15px] font-bold" style={{ color: BRAND_DARK }}>Paletta</span>
          )}
        </div>

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

        {/* Info / Legal links */}
        <DockInfoMenu expanded={expanded} />

        {/* Collapse / Expand toggle */}
        {expanded ? (
          <button
            onClick={onToggle}
            className="flex items-center w-full text-[13px] font-medium transition-all hover:bg-black/[0.04]"
            style={{ height: 44, padding: '0 14px', gap: 8, borderRadius: 10, color: '#9ca3af' }}
            aria-label="Collapse dock"
          >
            <ChevronLeft size={16} />
            <span>Collapse</span>
          </button>
        ) : (
          <DarkTooltip label="Expand" position="right">
            <button
              onClick={onToggle}
              className="mx-auto flex items-center justify-center transition-all"
              style={{ width: 40, height: 40, flexShrink: 0, padding: 0, borderRadius: 10, color: '#9ca3af' }}
              aria-label="Expand dock"
            >
              <ChevronRight size={16} />
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
        className={`flex items-center transition-all duration-150 ease-in-out${pulse ? ' dock-pulse' : ''}`}
        style={{
          width: isCollapsed ? 48 : '100%',
          height: 48,
          flexShrink: 0,
          borderRadius: 12,
          padding: expanded ? '0 14px' : '0',
          gap: expanded ? 12 : 0,
          justifyContent: expanded ? 'flex-start' : 'center',
          backgroundColor: primary
            ? BRAND_VIOLET
            : active
              ? 'rgba(108,71,255,0.08)'
              : 'transparent',
          color: primary ? '#ffffff' : active ? BRAND_VIOLET : '#374151',
          fontWeight: active || primary ? 600 : 500,
        }}
        onMouseOver={(e) => {
          if (primary) (e.currentTarget.style.backgroundColor = '#7C5AFF')
          else if (!active) (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')
        }}
        onMouseOut={(e) => {
          if (primary) (e.currentTarget.style.backgroundColor = BRAND_VIOLET)
          else if (!active) (e.currentTarget.style.backgroundColor = 'transparent')
        }}
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
            <span
              className="absolute flex items-center justify-center font-bold text-white leading-none pointer-events-none"
              style={{
                top: -4,
                right: -4,
                height: 14,
                fontSize: 7,
                padding: '0 4px',
                borderRadius: 4,
                backgroundColor: BRAND_VIOLET,
                border: '1px solid #ffffff',
              }}
            >
              PRO
            </span>
          )}
        </span>
        {expanded && (
          <>
            <span className="text-[14px] whitespace-nowrap">{label}</span>
            {badge && (
              <span
                className="text-[8px] font-bold text-white flex items-center justify-center"
                style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 4, backgroundColor: BRAND_VIOLET, padding: '0 5px' }}
              >
                {badge}
              </span>
            )}
            {proBadge && (
              <span
                className="text-[8px] font-bold text-white"
                style={{ marginLeft: 'auto', borderRadius: 4, backgroundColor: BRAND_VIOLET, padding: '2px 5px' }}
              >
                PRO
              </span>
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

  const shortcuts = [
    { key: 'Space', desc: 'Generate' },
    { key: 'U', desc: 'Undo' },
    { key: 'R', desc: 'Redo' },
  ]

  if (expanded) {
    return (
      <div className="flex flex-col" style={{ gap: 4, marginBottom: 8 }}>
        {links.map(l => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] transition-all hover:underline"
            style={{ color: '#9ca3af', textDecoration: 'none', padding: '0 14px' }}
          >
            {l.label}
          </a>
        ))}
        <p className="text-[10px] m-0" style={{ color: '#d1d5db', padding: '4px 14px 0' }}>
          Built with Paletta
        </p>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative flex justify-center py-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-all hover:bg-gray-100"
        style={{ color: '#9ca3af' }}
        aria-label="Info and legal links"
        aria-expanded={open}
      >
        <MoreHorizontal size={20} />
      </button>

      {open && (
        <div
          className="absolute z-50 bg-white rounded-xl overflow-hidden"
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
              className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium transition-all hover:bg-gray-50"
              style={{ color: '#374151', textDecoration: 'none' }}
              role="menuitem"
            >
              {l.label}
              <ExternalLink size={10} className="opacity-40 ml-auto" />
            </a>
          ))}

          <div className="border-t border-gray-100 my-1" />

          <div className="px-4 py-1.5">
            <p className="text-[10px] font-semibold m-0 mb-1" style={{ color: '#9ca3af' }}>Shortcuts</p>
            {shortcuts.map(s => (
              <div key={s.key} className="flex items-center justify-between py-0.5">
                <span className="text-[11px]" style={{ color: '#6b7280' }}>{s.desc}</span>
                <kbd
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
                >
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 my-1" />
          <div className="px-4 py-1">
            <p className="text-[10px] m-0" style={{ color: '#d1d5db' }}>Built with Paletta</p>
          </div>
        </div>
      )}
    </div>
  )
}
