import ColorSwatch from './ColorSwatch'

interface PaletteCanvasProps {
  hexColors: string[]
}

export default function PaletteCanvas({ hexColors }: PaletteCanvasProps) {
  return (
    <div className="flex w-full h-full">
      {hexColors.map((hex, i) => (
        <ColorSwatch key={`${hex}-${i}`} hex={hex} index={i} />
      ))}
    </div>
  )
}
