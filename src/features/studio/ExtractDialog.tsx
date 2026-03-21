import { useState } from 'react'
import { Image } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { BRAND_VIOLET } from '@/lib/tokens'

export function ExtractDialog({
  open, uploading, onFile, onClose, fileInputRef,
}: {
  open: boolean
  uploading: boolean
  onFile: (file: File) => void
  onClose: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const [dragOver, setDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onFile(file)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Extract from image</DialogTitle>
        </DialogHeader>

        {/* Drop zone */}
        <div
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed transition-all cursor-pointer"
          style={{
            height: 180,
            borderRadius: 12,
            borderColor: dragOver ? `${BRAND_VIOLET}66` : 'hsl(var(--border))',
            backgroundColor: dragOver ? `${BRAND_VIOLET}08` : 'hsl(var(--surface))',
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <p className="text-sm font-medium m-0" style={{ color: 'hsl(var(--muted-foreground))' }}>Analyzing…</p>
          ) : (
            <>
              <Image size={32} style={{ color: 'hsl(var(--border))' }} />
              <p className="text-sm font-medium m-0" style={{ color: 'hsl(var(--foreground))' }}>
                Drop image here
              </p>
              <p className="text-xs m-0" style={{ color: 'hsl(var(--muted))' }}>
                or click to browse · PNG, JPG, WebP
              </p>
            </>
          )}
        </div>

        <p className="text-xs mt-3 m-0" style={{ color: 'hsl(var(--muted))' }}>
          Colors are extracted using k-means clustering
        </p>
      </DialogContent>
    </Dialog>
  )
}
