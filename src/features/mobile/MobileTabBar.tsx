import type { MobileTab } from './MobileShell'

interface MobileTabBarProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
}

const tabs: { id: MobileTab; label: string; activeIcon: string; inactiveIcon: string }[] = [
  { id: 'studio', label: 'Studio', activeIcon: '✦', inactiveIcon: '✧' },
  { id: 'library', label: 'Library', activeIcon: '◆', inactiveIcon: '◇' },
  { id: 'profile', label: 'Profile', activeIcon: '●', inactiveIcon: '○' },
]

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <nav
      className="flex-none bg-white/90 border-t border-border/30"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)',
      }}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around pt-2">
        {tabs.map(({ id, label, activeIcon, inactiveIcon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-1 transition-all duration-200"
              style={{ minHeight: 44 }}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className="transition-all duration-200"
                style={{
                  fontSize: isActive ? 20 : 18,
                  color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                }}
                aria-hidden="true"
              >
                {isActive ? activeIcon : inactiveIcon}
              </span>
              <span
                className="text-[10px] transition-colors duration-200"
                style={{
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
