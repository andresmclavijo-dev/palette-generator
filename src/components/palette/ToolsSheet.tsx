import { useEffect, useRef, useState } from 'react'
import { usePro } from '../../hooks/usePro'
import { extractColorsFromFile } from '../../lib/kMeans'
import type { VisionMode } from './VisionSimulator'

interface ToolsSheetProps {
  open: boolean
  onClose: () => void
  onProGate: () => void
  onImagePalette: (hexes: string[]) => void
  onAiOpen: () => void
  onPreviewOpen: () => void
  visionMode: VisionMode
  onVisionChange: (mode: VisionMode) => void
}

const VISION_MODES: { value: VisionMode; label: string }[] = [
  { value: 'protanopia',    label: 'Protanopia' },
  { value: 'deuteranopia',  label: 'Deuteranopia' },
  { value: 'tritanopia',    label: 'Tritanopia' },
  { value: 'achromatopsia', label: 'Achromatopsia' },
]

export default function ToolsSheet({
  open, onClose, onProGate,
  onImagePalette, onAiOpen, onPreviewOpen,
  visionMode, onVisionChange,
}: ToolsSheetProps) {
  const { isPro } = usePro()
  const [visible, setVisible] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [visionExpanded, setVisionExpanded] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
  }, [open])

  const handleImageClick = () => {
    if (isPro) { fileRef.current?.click(); return }
    // All non-Pro users → Pro upgrade modal
    onProGate(); onClose()
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImageLoading(true)
    try {
      const colors = await extractColorsFromFile(file)
      onImagePalette(colors.slice(0, 5))
      onClose()
    } catch {
      setToast("Couldn't read image \u2014 try another.")
      setTimeout(() => setToast(''), 3000)
    } finally {
      setImageLoading(false)
    }
  }

  const handleVisionClick = () => {
    if (!isPro) { onProGate(); onClose(); return }
    setVisionExpanded(o => !o)
  }

  const handleVisionSelect = (mode: VisionMode) => {
    onVisionChange(mode)
  }

  const handlePreviewClick = () => {
    onPreviewOpen()
    onClose()
  }

  const handleAiClick = () => {
    onAiOpen()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl overflow-hidden"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 220ms ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-gray-100">
          <span className="text-[15px] font-semibold text-gray-800">Tools</span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
            aria-label="Close tools"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {/* Tool items */}
        <div className="py-2">
          {/* Image */}
          <button
            onClick={handleImageClick}
            disabled={imageLoading}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-gray-800">
                  {imageLoading ? 'Analyzing\u2026' : 'Image'}
                </span>
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5">Extract palette from any photo</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Vision */}
          <button
            onClick={handleVisionClick}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-gray-800">Vision</span>
                {visionMode !== 'normal' && (
                  <span className="text-[10px] text-blue-500 font-medium">{visionMode}</span>
                )}
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5">Check color blindness accessibility</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: visionExpanded ? 'rotate(90deg)' : undefined, transition: 'transform 150ms' }}
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* Vision sub-options — Pro only */}
          {visionExpanded && isPro && (
            <div className="pl-[4.5rem] pr-5 pb-2 space-y-1">
              <button
                onClick={() => handleVisionSelect('normal')}
                className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  visionMode === 'normal' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Normal {visionMode === 'normal' && '\u2713'}
              </button>
              {VISION_MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => handleVisionSelect(m.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                    visionMode === m.value ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {m.label} {visionMode === m.value && '\u2713'}
                </button>
              ))}
            </div>
          )}

          {/* Preview */}
          <button
            onClick={handlePreviewClick}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-gray-800">Preview</span>
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5">See palette in realistic UI mockups</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>

          {/* AI */}
          <button
            onClick={handleAiClick}
            className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <span className="text-[18px]">✨</span>
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-gray-800">AI</span>
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5">3 free prompts per day</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-lg bg-gray-900/90 text-white text-[12px] font-medium whitespace-nowrap shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
