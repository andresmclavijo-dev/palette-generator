import { Sun, Monitor, Moon } from 'lucide-react'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

const options: { value: Theme; icon: React.ElementType; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light mode' },
  { value: 'system', icon: Monitor, label: 'System default' },
  { value: 'dark', icon: Moon, label: 'Dark mode' },
]

interface ThemeToggleProps {
  compact?: boolean
  collapsed?: boolean
}

export function ThemeToggle({ compact, collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  // Collapsed dock: single cycling icon button
  if (collapsed) {
    const cycle = () => {
      if (theme === 'light') setTheme('dark')
      else if (theme === 'dark') setTheme('system')
      else setTheme('light')
    }

    const activeOption = options.find(o => o.value === theme) ?? options[0]
    const Icon = activeOption.icon

    return (
      <button
        onClick={cycle}
        aria-label={`Theme: ${theme}. Click to cycle.`}
        className="w-12 h-12 flex items-center justify-center rounded-button text-muted-foreground hover:text-foreground hover:bg-surface transition-all duration-150"
      >
        <Icon size={20} />
      </button>
    )
  }

  // Expanded dock: 3-button pill
  return (
    <div className={cn('flex items-center gap-0.5 bg-surface border border-border rounded-pill p-1', compact && 'w-fit')}>
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-button transition-all duration-150',
            theme === value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  )
}
