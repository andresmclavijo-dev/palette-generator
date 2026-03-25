import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  collapsed?: boolean
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { resolved, setTheme } = useTheme()

  // Collapsed dock: single icon button
  if (collapsed) {
    const toggle = () => setTheme(resolved === 'light' ? 'dark' : 'light')
    const Icon = resolved === 'dark' ? Moon : Sun
    return (
      <button
        onClick={toggle}
        aria-label={`Switch to ${resolved === 'light' ? 'dark' : 'light'} mode`}
        className="w-12 h-12 flex items-center justify-center rounded-button text-muted-foreground hover:text-foreground hover:bg-surface transition-all duration-150"
      >
        <Icon size={20} />
      </button>
    )
  }

  // Expanded dock: full-width segmented control
  return (
    <div
      className="flex items-center bg-surface border border-border"
      style={{ height: 36, borderRadius: 8, padding: 3, gap: 2, width: '100%' }}
    >
      {([
        { value: 'light' as const, Icon: Sun, label: 'Light mode' },
        { value: 'dark' as const, Icon: Moon, label: 'Dark mode' },
      ]).map(({ value, Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          className={cn(
            'flex-1 h-full flex items-center justify-center gap-1.5 transition-all duration-150',
            resolved === value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          style={{ borderRadius: 6, fontSize: 12, fontWeight: resolved === value ? 600 : 500 }}
        >
          <Icon size={14} />
          <span>{value === 'light' ? 'Light' : 'Dark'}</span>
        </button>
      ))}
    </div>
  )
}
