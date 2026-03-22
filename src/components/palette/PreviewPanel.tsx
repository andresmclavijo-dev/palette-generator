import { useState } from 'react'
import { AppWindow } from 'lucide-react'
import ToolTooltip from '../ui/ToolTooltip'
import PreviewModal from './PreviewModal'

interface PreviewPanelProps {
  onProGate: () => void
}

export default function PreviewPanel({ onProGate }: PreviewPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ToolTooltip description="Preview your palette in realistic UI mockups">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 h-10 px-4 rounded-full text-[14px] font-medium transition-all hover:bg-surface hover:text-foreground"
          style={{ color: 'hsl(var(--muted-foreground))' }}
          aria-label="Preview palette in UI mockups"
          aria-haspopup="dialog"
        >
          <AppWindow size={16} aria-hidden="true" />
          <span>Preview</span>
        </button>
      </ToolTooltip>

      <PreviewModal open={open} onClose={() => setOpen(false)} onProGate={onProGate} />
    </>
  )
}
