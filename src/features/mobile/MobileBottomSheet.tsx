import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface MobileBottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  full?: boolean
  children: React.ReactNode
}

export function MobileBottomSheet({ open, onClose, title, subtitle, full, children }: MobileBottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="bottom"
        className={cn(
          'rounded-t-[20px] border-t-0 px-5 pb-0 pt-0',
          full ? 'max-h-[90dvh]' : 'max-h-[55dvh]',
        )}
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.1)',
        }}
        aria-describedby={subtitle ? undefined : undefined}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-3">
          <div className="w-10 h-[5px] rounded-full bg-border" />
        </div>

        {(title || subtitle) && (
          <SheetHeader className="pb-3">
            {title && <SheetTitle className="text-lg font-bold">{title}</SheetTitle>}
            {subtitle && <SheetDescription>{subtitle}</SheetDescription>}
          </SheetHeader>
        )}

        <div className="overflow-auto flex-1">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
