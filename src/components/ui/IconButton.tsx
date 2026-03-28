import * as React from 'react'
import { cn } from '@/lib/utils'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode
  label: string
  size?: number
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, size = 44, className, disabled, style, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-pill bg-surface',
        'text-muted-foreground',
        'transition-all duration-150 ease-[cubic-bezier(0,0,0.2,1)]',
        'hover:text-primary hover:scale-[1.08]',
        'active:scale-[0.96]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'disabled:pointer-events-none disabled:opacity-50',
        'motion-reduce:transform-none',
        className,
      )}
      style={{ width: size, height: size, minWidth: size, minHeight: size, ...style }}
      {...props}
    >
      {icon}
    </button>
  ),
)

IconButton.displayName = 'IconButton'

export default IconButton
