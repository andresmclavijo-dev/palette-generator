import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'

export function UserMenu({
  email, isPro, avatarUrl, onSignOut, onManage,
}: {
  email: string
  isPro: boolean
  avatarUrl?: string
  onSignOut: () => void
  onManage: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const initial = email.charAt(0).toUpperCase()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      {avatarUrl ? (
        <button
          onClick={() => setOpen(o => !o)}
          className="rounded-full overflow-hidden transition-all hover:ring-2 hover:ring-black/10"
          style={{ width: 36, height: 36 }}
          aria-label="Account menu"
          aria-expanded={open}
        >
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(o => !o)}
          className="rounded-full flex items-center justify-center text-[13px] font-bold bg-primary text-primary-foreground transition-all hover:ring-2 hover:ring-black/10"
          style={{ width: 36, height: 36 }}
          aria-label="Account menu"
          aria-expanded={open}
        >
          {initial}
        </button>
      )}

      {open && (
        <div
          className="absolute top-full right-0 mt-2 bg-card rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 200 }}
        >
          <div className="px-4 py-3 border-b border-border-light">
            <p className="text-[13px] font-semibold m-0 text-foreground">{email}</p>
            {isPro && (
              <Badge variant="pro" className="mt-1">PRO</Badge>
            )}
          </div>
          {isPro && (
            <button
              onClick={() => { onManage(); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-[13px] text-foreground hover:bg-surface transition-all"
            >
              Manage subscription
            </button>
          )}
          <button
            onClick={() => { onSignOut(); setOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-surface transition-all"
            style={{ color: 'hsl(var(--destructive))' }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
