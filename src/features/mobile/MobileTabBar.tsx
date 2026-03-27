import { Sparkles, LayoutTemplate, Bookmark, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MobileTab } from './MobileShell'

interface MobileTabBarProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
}

const tabs: { id: MobileTab; label: string; Icon: typeof Sparkles }[] = [
  { id: 'studio', label: 'Studio', Icon: Sparkles },
  { id: 'preview', label: 'Preview', Icon: LayoutTemplate },
  { id: 'library', label: 'Library', Icon: Bookmark },
  { id: 'profile', label: 'Profile', Icon: User },
]

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <nav
      className="flex-none bg-card"
      style={{
        margin: '6px 12px',
        marginBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        borderRadius: 16,
        border: '0.5px solid hsl(var(--border))',
        padding: '6px 0 8px',
      }}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              data-tour-id={id === 'preview' ? 'preview-nav' : undefined}
              className="flex-1 flex flex-col items-center gap-1 py-2 transition-all duration-200"
              style={{ minHeight: 44 }}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={20}
                className={cn(
                  'transition-all duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className={cn(
                'text-[11px] tracking-tight',
                isActive ? 'font-bold text-primary' : 'font-medium text-muted-foreground'
              )}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
