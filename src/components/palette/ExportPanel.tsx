import { useState } from 'react'
import { Copy, Check, Lock } from 'lucide-react'
import { getColorName, slugifyColorName, generateShades, TAILWIND_SHADE_LABELS } from '../../lib/colorEngine'
import { usePro } from '../../hooks/usePro'
import { showToast } from '../../utils/toast'
import { analytics } from '../../lib/posthog'
import { Badge } from '@/components/ui/badge'
import { BRAND_VIOLET } from '../../lib/tokens'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription,
} from '../ui/dialog'

type Format = 'css' | 'tailwind' | 'svg'
type NamingMode = 'default' | 'smart'

interface ExportPanelProps {
  open: boolean
  hexes: string[]
  onClose: () => void
  onProGate?: () => void
}

const WATERMARK = '/* Made with Paletta · usepaletta.io */'

const SMART_NAMES = ['primary', 'secondary', 'accent', 'highlight', 'dark', 'surface', 'muted', 'subtle']

function getSlug(h: string, seen: Record<string, number>): string {
  let slug = slugifyColorName(getColorName(h) || 'color')
  if (!slug) slug = 'color'
  seen[slug] = (seen[slug] || 0) + 1
  return seen[slug] > 1 ? `${slug}-${seen[slug]}` : slug
}

function buildCSS(hexes: string[], isPro: boolean, naming: NamingMode): string {
  const seen: Record<string, number> = {}
  const lines: string[] = []
  for (let i = 0; i < hexes.length; i++) {
    const h = hexes[i]
    const key = naming === 'smart' ? (SMART_NAMES[i] || `color-${i + 1}`) : getSlug(h, seen)
    if (isPro) {
      const shades = generateShades(h, 10)
      shades.forEach((s, j) => {
        lines.push(`  --color-${key}-${TAILWIND_SHADE_LABELS[j]}: ${s};`)
      })
    } else {
      lines.push(`  --color-${key}: ${h};`)
    }
  }
  const prefix = isPro ? '' : WATERMARK + '\n'
  return prefix + [':root {', ...lines, '}'].join('\n')
}

function buildTailwind(hexes: string[], isPro: boolean, naming: NamingMode): string {
  const seen: Record<string, number> = {}
  if (isPro) {
    const blocks = hexes.map((h, i) => {
      const key = naming === 'smart' ? (SMART_NAMES[i] || `color-${i + 1}`) : getSlug(h, seen)
      const shades = generateShades(h, 10)
      const inner = shades.map((s, j) => `        ${TAILWIND_SHADE_LABELS[j]}: '${s}',`).join('\n')
      return `      '${key}': {\n${inner}\n      },`
    }).join('\n')
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${blocks}\n      }\n    }\n  }\n}`
  }
  const inner = hexes.map((h, i) => {
    const key = naming === 'smart' ? (SMART_NAMES[i] || `color-${i + 1}`) : getSlug(h, seen)
    return `        '${key}': '${h}',`
  }).join('\n')
  return (isPro ? '' : WATERMARK + '\n') + `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n${inner}\n      }\n    }\n  }\n}`
}

function buildSVG(hexes: string[]): string {
  const w = 60
  const gap = 8
  const totalW = hexes.length * w + (hexes.length - 1) * gap
  const h = 80
  const rects = hexes.map((hex, i) => {
    const x = i * (w + gap)
    return `  <rect x="${x}" y="0" width="${w}" height="${h}" rx="8" fill="${hex}"/>\n  <text x="${x + w / 2}" y="${h + 16}" text-anchor="middle" font-family="monospace" font-size="10" fill="#374151">${hex.toUpperCase()}</text>`
  }).join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${h + 24}" width="${totalW}" height="${h + 24}">\n${rects}\n</svg>`
}

const FORMATS: { id: Format; label: string; pro?: boolean }[] = [
  { id: 'css', label: 'CSS' },
  { id: 'tailwind', label: 'Tailwind' },
  { id: 'svg', label: 'SVG' },
]

export default function ExportPanel({ open, hexes, onClose, onProGate }: ExportPanelProps) {
  const { isPro } = usePro()
  const [format, setFormat] = useState<Format>('css')
  const [naming, setNaming] = useState<NamingMode>('default')
  const [copied, setCopied] = useState(false)

  const content =
    format === 'css' ? buildCSS(hexes, isPro, naming) :
    format === 'tailwind' ? buildTailwind(hexes, isPro, naming) :
    buildSVG(hexes)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      showToast('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
      analytics.track('palette_exported', { format, naming, color_count: hexes.length, is_pro: isPro })
      if (!localStorage.getItem('paletta_first_export_at')) {
        localStorage.setItem('paletta_first_export_at', String(Date.now()))
        const sessionStart = Number(sessionStorage.getItem('paletta_session_start') || Date.now())
        analytics.track('first_export', { time_to_first_export_ms: Date.now() - sessionStart, format })
      }
    } catch { /* silent */ }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" style={{ maxHeight: '80vh' }}>
        <DialogHeader>
          <DialogTitle>Export palette</DialogTitle>
          <DialogDescription>Copy your palette in any format</DialogDescription>
        </DialogHeader>

        {/* Format switcher */}
        <div
          className="flex"
          style={{ backgroundColor: 'hsl(var(--border-light))', borderRadius: 8, padding: 3, gap: 3, marginBottom: 16 }}
        >
          {FORMATS.map(f => (
            <button
              key={f.id}
              onClick={() => {
                if (f.pro && !isPro && onProGate) { onProGate(); return }
                setFormat(f.id)
              }}
              className="flex items-center justify-center gap-1.5 transition-all"
              style={{
                flex: 1,
                height: 36,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: format === f.id ? 600 : 500,
                backgroundColor: format === f.id ? 'hsl(var(--card))' : 'transparent',
                boxShadow: format === f.id ? '0 1px 3px rgba(0,0,0,0.1)' : undefined,
                color: f.pro && !isPro ? 'hsl(var(--muted-foreground))' : format === f.id ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {f.pro && !isPro && <Lock size={14} strokeWidth={2} />}
              {f.label}
              {f.pro && !isPro && (
                <Badge variant="pro" className="ml-0.5">PRO</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Code block — intentionally dark theme, not tokenized */}
        <div className="relative" style={{ marginBottom: 12 }}>
          <div
            className="overflow-y-auto"
            style={{
              backgroundColor: '#111827',
              borderRadius: 12,
              padding: 16,
              maxHeight: 300,
            }}
          >
            <pre
              className="m-0 text-sm leading-relaxed whitespace-pre overflow-x-auto"
              style={{ fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace", color: '#e2e8f0' }}
            >
              {content}
            </pre>
          </div>

          {/* Copy button in code block */}
          <button
            onClick={handleCopy}
            className="absolute flex items-center justify-center transition-all"
            style={{
              top: 10, right: 10,
              width: 32, height: 32,
              padding: 0, borderRadius: 8,
              backgroundColor: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label={copied ? 'Copied' : 'Copy code'}
          >
            {copied
              ? <Check size={16} strokeWidth={1.5} style={{ color: '#22c55e' }} />
              : <Copy size={16} strokeWidth={1.5} style={{ color: '#94a3b8' }} />
            }
          </button>
        </div>

        {/* Naming toggle — only for CSS/Tailwind */}
        {format !== 'svg' && (
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Variable names:</span>
            <div className="flex" style={{ backgroundColor: 'hsl(var(--border-light))', borderRadius: 6, padding: 2, gap: 6 }}>
              {(['default', 'smart'] as NamingMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setNaming(mode)}
                  className="transition-all"
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: naming === mode ? 600 : 500,
                    backgroundColor: naming === mode ? 'hsl(var(--card))' : 'transparent',
                    boxShadow: naming === mode ? '0 1px 2px rgba(0,0,0,0.08)' : undefined,
                    color: naming === mode ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pro tease */}
        {!isPro && (
          <div
            className="flex items-center justify-between"
            style={{
              borderTop: '1px solid hsl(var(--border-light))',
              paddingTop: 16,
              marginTop: 4,
            }}
          >
            <span className="text-[12px]" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Need more? Export as SCSS or Flutter
            </span>
            {onProGate && (
              <button
                onClick={onProGate}
                className="shrink-0 text-[12px] font-semibold transition-all hover:opacity-80"
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1px solid ${BRAND_VIOLET}`,
                  backgroundColor: 'transparent',
                  color: BRAND_VIOLET,
                  cursor: 'pointer',
                }}
              >
                Unlock with Pro
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
