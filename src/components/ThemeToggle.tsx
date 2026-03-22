import { Sun, Monitor, Moon } from 'lucide-react'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

const options: { value: Theme; icon: React.ElementType; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light mode' },
  { value: 'system', icon: Monitor, label: 'System default' },
  { value: 'dark', icon: Moon, label: 'Dark mode' },
]

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme()

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
