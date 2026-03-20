import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
// usePro available for future save-limit gating
import { usePaletteStore } from '@/store/paletteStore'
import { makeSwatch } from '@/lib/colorEngine'
import { showToast } from '@/utils/toast'
import { analytics } from '@/lib/posthog'
import { Button } from '@/components/ui/button'
import type { MobileTab } from './MobileShell'

interface SavedPalette {
  id: string
  name: string
  colors: string[]
  created_at: string
}

interface MobileLibraryProps {
  onNavigate: (tab: MobileTab) => void
}

export function MobileLibrary({ onNavigate }: MobileLibraryProps) {
  const { user, signInWithGoogle } = useAuth()
  const { setSwatches } = usePaletteStore()
  const [palettes, setPalettes] = useState<SavedPalette[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPalettes = useCallback(async () => {
    if (!user) { setLoading(false); return }
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase
        .from('saved_palettes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setPalettes(data ?? [])
    } catch { /* silent */ }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchPalettes() }, [fetchPalettes])

  const handleLoad = (palette: SavedPalette) => {
    setSwatches(palette.colors.map(h => makeSwatch(h)))
    showToast(`Loaded · ${palette.name}`)
    analytics.track('palette_loaded', { source: 'library' })
    onNavigate('studio')
  }

  const handleShare = async (palette: SavedPalette) => {
    const hex = palette.colors.map(c => c.replace('#', '')).join('-')
    const url = `${window.location.origin}?p=${hex}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied!')
    } catch { /* silent */ }
  }

  const handleDelete = async (id: string) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('saved_palettes').delete().eq('id', id)
      setPalettes(prev => prev.filter(p => p.id !== id))
      showToast('Deleted')
    } catch {
      showToast('Delete failed')
    }
  }

  // Signed out
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <span className="text-[40px] mb-4" aria-hidden="true">◇</span>
        <h2 className="text-xl font-extrabold text-foreground mb-1">Your collection starts here</h2>
        <p className="text-[13px] text-muted mb-6 max-w-[260px]">
          Save favorites and export to Figma or Tailwind CSS. 3 free saves, unlimited with Pro.
        </p>
        <Button
          onClick={async () => {
            const { error } = await signInWithGoogle()
            if (error) showToast('Sign-in failed')
          }}
          className="h-12 rounded-xl px-8 shadow-lg"
          style={{ boxShadow: '0 4px 20px rgba(108,71,255,0.25)' }}
        >
          Sign in to get started
        </Button>
      </div>
    )
  }

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Empty
  if (palettes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <span className="text-[40px] mb-4" aria-hidden="true">◇</span>
        <h2 className="text-xl font-extrabold text-foreground mb-1">No saved palettes yet</h2>
        <p className="text-[13px] text-muted mb-6">
          Generate a palette you love, then tap Save.
        </p>
        <Button onClick={() => onNavigate('studio')} className="h-12 rounded-xl px-8">
          Go to Studio
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-[28px] font-extrabold text-foreground leading-tight">Library</h2>
        <p className="text-[13px] text-muted">{palettes.length} palette{palettes.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-auto px-3 pb-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex flex-col gap-2.5">
          {palettes.map(palette => (
            <button
              key={palette.id}
              onClick={() => handleLoad(palette)}
              className="bg-card rounded-[18px] p-3.5 shadow-sm text-left transition-all active:scale-[0.98]"
              aria-label={`Load palette: ${palette.name}`}
            >
              {/* Color strip */}
              <div className="flex rounded-lg overflow-hidden h-14 mb-2.5">
                {palette.colors.map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                ))}
              </div>

              {/* Meta + actions */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-semibold text-foreground">{palette.name}</div>
                  <div className="text-[11px] text-muted">
                    {palette.colors.length} colors · {new Date(palette.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => handleShare(palette)}
                    className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted-foreground transition-colors active:bg-border"
                    aria-label={`Share ${palette.name}`}
                  >
                    <span className="text-[14px]" aria-hidden="true">🔗</span>
                  </button>
                  <button
                    onClick={() => handleDelete(palette.id)}
                    className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-muted-foreground transition-colors active:bg-border"
                    aria-label={`Delete ${palette.name}`}
                  >
                    <span className="text-[14px]" aria-hidden="true">🗑</span>
                  </button>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
