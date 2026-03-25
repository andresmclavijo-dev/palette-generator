import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  compact?: boolean
  collapsed?: boolean
}

export function ThemeToggle({ compact, collapsed = false }: ThemeToggleProps) {
  const { resolved, setTheme } = useTheme()

  const toggle = () => setTheme(resolved === 'light' ? 'dark' : 'light')

  // Collapsed dock: single icon button
  if (collapsed) {
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

  // Expanded dock: 2-button pill
  return (
    <div className={cn('flex items-center gap-0.5 bg-surface border border-border rounded-pill p-1', compact && 'w-fit')}>
      <button
        onClick={() => setTheme('light')}
        aria-label="Light mode"
        className={cn(
          'w-8 h-8 flex items-center justify-center rounded-button transition-all duration-150',
          resolved === 'light'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        aria-label="Dark mode"
        className={cn(
          'w-8 h-8 flex items-center justify-center rounded-button transition-all duration-150',
          resolved === 'dark'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Moon size={16} />
      </button>
    </div>
  )
}
