import { useEffect, useState } from 'react'
import { Heart, X, Link2, Share2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { BRAND_VIOLET, BRAND_DARK } from '@/lib/tokens'
import { showToast } from '@/utils/toast'
import { analytics } from '@/lib/posthog'
import ExportPanel from '@/components/palette/ExportPanel'
import { DarkTooltip } from '@/features/studio/DarkTooltip'

export function LibraryView({
  isSignedIn, userId, isPro, onLoad, onProGate, onSignIn,
}: {
  isSignedIn: boolean
  userId?: string
  isPro: boolean
  onLoad: (hexes: string[], name?: string) => void
  onProGate: (feature?: string, source?: string) => void
  onSignIn: () => void
}) {
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share
  const [palettes, setPalettes] = useState<{ id: string; name: string; colors: string[]; created_at: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; colors: string[] } | null>(null)
  const [exportColors, setExportColors] = useState<string[] | null>(null)

  useEffect(() => {
    if (!isSignedIn || !userId) return
    setLoading(true)
    ;(async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data } = await supabase
          .from('saved_palettes')
          .select('id, name, colors, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
        setPalettes(data ?? [])
      } catch { /* silent */ }
      finally { setLoading(false) }
    })()
  }, [isSignedIn, userId])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const { supabase } = await import('@/lib/supabase')
    await supabase.from('saved_palettes').delete().eq('id', deleteTarget.id)
    setPalettes(p => p.filter(x => x.id !== deleteTarget.id))
    setDeleteTarget(null)
    showToast('Palette deleted')
  }

  const handleShare = async (colors: string[]) => {
    const hex = colors.map(c => c.replace('#', '')).join('-')
    const url = `https://www.usepaletta.io/?p=${hex}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Paletta — Color Palette', text: 'Check out this color palette', url })
        analytics.track('palette_shared', { method: 'native', source: 'library' })
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied!')
      analytics.track('palette_shared', { method: 'clipboard', source: 'library' })
    } catch { /* silent */ }
  }

  // Close delete confirmation on Escape
  useEffect(() => {
    if (!deleteTarget) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setDeleteTarget(null) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [deleteTarget])

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date))
  }

  const slotsText = isPro ? 'Unlimited saves' : `${palettes.length} of 3 free slots used`

  if (!isSignedIn) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-14 h-14 rounded-card bg-primary/10 flex items-center justify-center mb-5">
          <Heart size={28} className="text-primary" />
        </div>
        <h2 className="text-[24px] font-bold" style={{ color: BRAND_DARK }}>Your collection starts here</h2>
        <p className="text-[14px] mt-2 mb-6 max-w-[320px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Save your favorites and export to Figma or Tailwind CSS. 3 free saves, unlimited with Pro.
        </p>
        <Button
          variant="default"
          size="lg"
          onClick={onSignIn}
          className="text-[16px] font-bold px-8"
        >
          Sign in to get started
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[13px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</span>
      </div>
    )
  }

  return (
    <>
    <div className="absolute inset-0 overflow-y-auto" style={{ padding: 32 }}>
      <div className="max-w-[640px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[24px] font-bold" style={{ color: BRAND_DARK }}>Library</h2>
            <p className="text-[13px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Your saved palettes</p>
          </div>
          <span className="text-[12px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{slotsText}</span>
        </div>

        {palettes.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Heart size={32} style={{ color: 'hsl(var(--border))' }} />
            <p className="text-[15px] font-medium mt-4" style={{ color: 'hsl(var(--muted-foreground))' }}>No saved palettes yet</p>
            <p className="text-[13px] mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Use the heart icon in Studio to save palettes here</p>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {palettes.map(p => (
              <div
                key={p.id}
                className="bg-card overflow-hidden cursor-pointer transition-shadow hover:shadow-md text-left w-full rounded-card"
                style={{ border: '1px solid rgba(0,0,0,0.06)' }}
                onClick={() => onLoad(p.colors, p.name)}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLoad(p.colors, p.name) } }}
                aria-label={`Load palette: ${p.name || 'Untitled'}`}
              >
                <div className="flex h-14 overflow-hidden rounded-t-card">
                  {p.colors.map((c, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex items-center justify-between px-3 py-2">
                  <div>
                    <span className="text-[13px] font-semibold block" style={{ color: BRAND_DARK }}>{p.name || 'Untitled'}</span>
                    <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>Saved {timeAgo(p.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DarkTooltip label={canNativeShare ? "Share" : "Copy link"} position="top">
                      <button
                        onClick={e => { e.stopPropagation(); handleShare(p.colors) }}
                        className="w-9 h-9 flex items-center justify-center rounded-button text-muted-foreground hover:text-foreground hover:bg-surface transition-colors active:scale-[0.98]"
                        aria-label={canNativeShare ? "Share palette" : "Copy palette link"}
                      >
                        {canNativeShare ? <Share2 size={16} /> : <Link2 size={16} />}
                      </button>
                    </DarkTooltip>
                    <DarkTooltip label="Export" position="top">
                      <button
                        onClick={e => { e.stopPropagation(); setExportColors(p.colors) }}
                        className="w-9 h-9 flex items-center justify-center rounded-button text-muted-foreground hover:text-foreground hover:bg-surface transition-colors active:scale-[0.98]"
                        aria-label="Export palette"
                      >
                        <Download size={16} />
                      </button>
                    </DarkTooltip>
                    <DarkTooltip label="Delete" position="top">
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteTarget({ id: p.id, name: p.name, colors: p.colors }) }}
                        className="w-9 h-9 flex items-center justify-center rounded-button text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors active:scale-[0.98]"
                        aria-label={`Delete ${p.name || 'Untitled'}`}
                      >
                        <X size={16} />
                      </button>
                    </DarkTooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isPro && palettes.length >= 3 && (
          <Button
            variant="default"
            size="lg"
            onClick={() => onProGate('save_limit', 'library')}
            className="w-full mt-4 text-[13px] font-semibold"
            style={{ background: `linear-gradient(135deg, ${BRAND_VIOLET}, hsl(var(--brand-violet-hover)))` }}
          >
            Go Pro for unlimited saves
          </Button>
        )}
      </div>
    </div>

    {/* Export panel */}
    <ExportPanel
      open={!!exportColors}
      hexes={exportColors ?? []}
      onClose={() => setExportColors(null)}
      onProGate={() => { setExportColors(null); onProGate('export', 'library') }}
    />

    {/* Delete confirmation modal */}
    <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete palette?</DialogTitle>
          <DialogDescription>
            &ldquo;{deleteTarget?.name || 'Untitled'}&rdquo; will be permanently deleted. This can&rsquo;t be undone.
          </DialogDescription>
        </DialogHeader>
        {deleteTarget && (
          <div className="flex rounded-button overflow-hidden h-10 mt-1">
            {deleteTarget.colors.map((c, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" size="default" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="destructive" size="default" onClick={confirmDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
