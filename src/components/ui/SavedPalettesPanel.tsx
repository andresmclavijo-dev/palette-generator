import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface SavedPalette {
  id: string
  name: string
  hexes: string[]
  created_at: string
}

interface SavedPalettesPanelProps {
  open: boolean
  onClose: () => void
  userId: string
  onLoad: (hexes: string[]) => void
}

export default function SavedPalettesPanel({ open, onClose, userId, onLoad }: SavedPalettesPanelProps) {
  const [palettes, setPalettes] = useState<SavedPalette[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !userId) return
    setLoading(true)
    supabase
      .from('saved_palettes')
      .select('id, name, hexes, created_at')
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

  const handleLoad = (hexes: string[]) => {
    onLoad(hexes)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative max-w-md w-[90vw] max-h-[80vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <span className="text-[16px] font-semibold text-gray-800">Saved Palettes</span>
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
            <div className="text-center py-8 text-sm text-gray-400">Loading...</div>
          ) : palettes.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">No saved palettes yet</div>
          ) : (
            <div className="space-y-3">
              {palettes.map(p => (
                <div key={p.id} className="border border-gray-100 rounded-xl p-3 hover:border-gray-200 transition-colors">
                  {/* Color preview */}
                  <div className="flex h-8 rounded-lg overflow-hidden mb-2">
                    {p.hexes.map((h, i) => (
                      <div key={i} className="flex-1" style={{ backgroundColor: h }} />
                    ))}
                  </div>

                  {/* Name + actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-gray-700 truncate mr-2">{p.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleLoad(p.hexes)}
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
