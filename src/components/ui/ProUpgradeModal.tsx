const BRAND = '#1A73E8'

const PRO_FEATURES = [
  { icon: '✨', text: 'AI palette from text prompt' },
  { icon: '🖼', text: 'Image → palette extraction' },
  { icon: '👁', text: 'Color blindness preview' },
  { icon: '💾', text: 'Save unlimited palettes' },
  { icon: '🎨', text: 'Full shade scales (50–900)' },
  { icon: '📤', text: 'Export without watermark' },
  { icon: '🔢', text: '6, 7 & 8 color palettes' },
]

interface ProUpgradeModalProps {
  open: boolean
  onClose: () => void
}

export default function ProUpgradeModal({ open, onClose }: ProUpgradeModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-[340px] max-w-[90vw] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="text-amber-400 text-[24px] mb-2">✦</div>
          <h2 className="text-[20px] font-bold text-gray-900">Unlock Paletta Pro</h2>
          <p className="text-[13px] text-gray-500 mt-1">$5/month · Cancel anytime</p>
        </div>

        {/* Feature list */}
        <div className="px-6 pb-5">
          <div className="space-y-2.5">
            {PRO_FEATURES.map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-[16px] w-6 text-center shrink-0">{f.icon}</span>
                <span className="text-[13px] text-gray-700">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 pt-2 pb-6 space-y-2">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-full h-11 rounded-full text-white text-[14px] font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: BRAND }}
          >
            Get Pro when it launches
          </button>
          <button
            onClick={onClose}
            className="w-full h-11 rounded-full text-[14px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
