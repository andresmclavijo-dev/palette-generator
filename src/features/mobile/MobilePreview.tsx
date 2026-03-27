import { useState } from 'react'
import { Code } from 'lucide-react'
import { usePaletteStore } from '@/store/paletteStore'
import { usePro } from '@/hooks/usePro'
import { VisionFilterDefs } from '@/components/palette/VisionSimulator'
import type { VisionMode } from '@/components/palette/VisionSimulator'
import { PreviewGrid } from '@/components/preview/PreviewGrid'
import ExportPanel from '@/components/palette/ExportPanel'
import { ProUpgradeModal } from '@/features/pro/ProUpgradeModal'
import { Button } from '@/components/ui/button'
import { analytics } from '@/lib/posthog'

export function MobilePreview() {
  const { isPro } = usePro()
  const { swatches, generate, count } = usePaletteStore()
  const [exportOpen, setExportOpen] = useState(false)
  const [proOpen, setProOpen] = useState(false)
  const [visionMode] = useState<VisionMode>('normal')

  const visionFilter = visionMode !== 'normal' ? `url(#vision-${visionMode})` : undefined

  const openProModal = (feature?: string, source?: string) => {
    if (feature) analytics.track('pro_gate_hit', { feature, source: source ?? 'mobile_preview' })
    analytics.track('pro_modal_opened')
    setProOpen(true)
  }

  const triggerGenerate = () => {
    generate()
    analytics.track('palette_generated', { method: 'button', color_count: count })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Minimal brand header */}
      <div className="flex items-center justify-center" style={{ height: 48 }}>
        <img
          src="/logo.svg"
          alt="Paletta"
          className="shrink-0"
          style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'contain' }}
        />
      </div>

      {/* Preview content */}
      <div
        className="flex-1 overflow-auto px-3 pt-1 pb-4"
        style={{ WebkitOverflowScrolling: 'touch', filter: visionFilter }}
      >
        <PreviewGrid
          hexes={swatches.map(s => s.hex)}
          isPro={isPro}
          onProGate={openProModal}
          isMobile
        />
      </div>

      {/* Bottom action bar — two equal buttons */}
      <div
        className="bg-card shrink-0"
        style={{
          margin: '6px 12px 0',
          borderRadius: 16,
          border: '0.5px solid hsl(var(--border))',
        }}
      >
        <div className="flex items-center gap-2" style={{ padding: '8px 12px' }}>
          <button
            onClick={() => setExportOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 border border-border rounded-button transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            style={{ height: 44, borderRadius: 8 }}
            aria-label="Get code"
          >
            <Code size={16} className="text-foreground" />
            <span className="text-[14px] font-semibold text-foreground">Get code</span>
          </button>
          <Button
            onClick={triggerGenerate}
            size="lg"
            className="flex-1 text-[14px] font-bold"
            style={{ height: 44, borderRadius: 8, boxShadow: '0 4px 20px rgba(108,71,255,0.3)' }}
            aria-label="Generate new palette"
          >
            Generate
          </Button>
        </div>
      </div>

      {/* Export dialog */}
      <ExportPanel
        open={exportOpen}
        hexes={swatches.map(s => s.hex)}
        onClose={() => setExportOpen(false)}
        onProGate={() => { setExportOpen(false); openProModal('export', 'mobile_preview') }}
      />

      {/* Pro modal */}
      <ProUpgradeModal
        open={proOpen}
        onClose={() => setProOpen(false)}
        paletteColors={swatches.map(s => s.hex)}
      />

      <VisionFilterDefs />
    </div>
  )
}
