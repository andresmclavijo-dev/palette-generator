import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const BRAND = '#1A73E8'
const FREE_SAVE_LIMIT = 3

interface SavedPalette {
  id: string
  name: string
  colors: string[]
  created_at: string
}

interface SavedPalettesPanelProps {
  open: boolean
  onClose: () => void
  userId: string
  onLoad: (hexes: string[]) => void
  isPro?: boolean
  onProGate?: () => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SavedPalettesPanel({ open, onClose, userId, onLoad, isPro, onProGate }: SavedPalettesPanelProps) {
  const [palettes, setPalettes] = useState<SavedPalette[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !userId) return
    setLoading(true)
    supabase
      .from('saved_palettes')
      .select('id, name, colors, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) {
          console.error('Fetch saved palettes failed:', error.message, error)
        }
        setPalettes(data ?? [])
        setLoading(false)
      })
  }, [open, userId])

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('saved_palettes').delete().eq('id', id)
    if (error) {
      console.error('Delete palette failed:', error.message, error)
      return
    }
    setPalettes(p => p.filter(x => x.id !== id))
  }

  const handleLoad = (colors: string[]) => {
    onLoad(colors)
    onClose()
  }

  if (!open) return null

  const atLimit = !isPro && palettes.length >= FREE_SAVE_LIMIT

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative max-w-md w-[90vw] max-h-[80vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <span className="text-[16px] font-semibold text-gray-800">My Palettes</span>
            {!loading && palettes.length > 0 && (
              <span className="ml-2 text-[12px] text-gray-400">{palettes.length}{!isPro ? `/${FREE_SAVE_LIMIT}` : ''}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-[13px] text-gray-400">Loading palettes...</span>
            </div>
          ) : palettes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
              </div>
              <p className="text-[14px] font-medium text-gray-600">No saved palettes yet</p>
              <p className="text-[12px] text-gray-400 mt-1">Generate a palette and hit Save to keep it.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {palettes.map(p => (
                <div key={p.id} className="border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors">
                  {/* Color preview */}
                  <div className="flex h-8 rounded-lg overflow-hidden mb-2">
                    {p.colors.map((h, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: h }} />
                    ))}
                  </div>

                  {/* Name + meta + actions */}
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 mr-2">
                      <span className="text-[13px] font-medium text-gray-700 truncate block">{p.name}</span>
                      <span className="text-[11px] text-gray-400">
                        {p.colors.length} colors · {formatDate(p.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleLoad(p.colors)}
                        className="px-3 h-7 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold hover:bg-blue-100 transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Free user limit banner */}
              {atLimit && onProGate && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-center">
                  <p className="text-[13px] font-medium text-gray-700">
                    You've reached {FREE_SAVE_LIMIT} saved palettes
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">Upgrade to Pro for unlimited saves</p>
                  <button
                    onClick={() => { onClose(); onProGate() }}
                    className="mt-3 px-4 h-8 rounded-full text-white text-[12px] font-semibold hover:opacity-90 active:scale-95 transition-all"
                    style={{ backgroundColor: BRAND }}
                  >
                    Go Pro →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
