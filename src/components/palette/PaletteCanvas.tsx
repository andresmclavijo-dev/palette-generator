import type { Swatch } from '../../lib/colorEngine'
import ColorSwatch from './ColorSwatch'

interface PaletteCanvasProps {
  swatches: Swatch[]
  onLock: (id: string) => void
  onEdit: (id: string, hex: string) => void
}

export default function PaletteCanvas({ swatches, onLock, onEdit }: PaletteCanvasProps) {
  return (
    <div className="flex w-full h-full">
      {swatches.map((swatch, i) => (
        <ColorSwatch
          key={swatch.id}
          hex={swatch.hex}
          locked={swatch.locked}
          index={i}
          onLock={() => onLock(swatch.id)}
          onEdit={(hex) => onEdit(swatch.id, hex)}
        />
      ))}
    </div>
  )
}

