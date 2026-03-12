const BRAND = '#1A73E8'

interface SaveModalProps {
  onClose: () => void
}

export default function SaveModal({ onClose }: SaveModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-[320px] max-w-[90vw] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="text-[28px] mb-2">💾</div>
          <h2 className="text-[18px] font-bold text-gray-900">Save Palette</h2>
          <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
            Create a free account to save unlimited palettes and access your collection anywhere.
          </p>
        </div>

        <div className="px-6 pt-2 pb-6 space-y-2">
          <a
            href="mailto:hello@paletta.app?subject=Paletta%20Early%20Access"
            className="flex items-center justify-center w-full h-11 rounded-full text-white text-[14px] font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: BRAND }}
            onClick={onClose}
          >
            Get early access →
          </a>
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
