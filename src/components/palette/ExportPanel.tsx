import { useState } from 'react'
import { getColorName, slugifyColorName, generateShades, TAILWIND_SHADE_LABELS } from '../../lib/colorEngine'
import { usePro } from '../../hooks/usePro'

type Tab = 'css' | 'tailwind' | 'hex'
const BRAND = '#1A73E8'

interface ExportPanelProps {
  hexes: string[]
  onClose: () => void
}

const WATERMARK = '/* Made with Paletta · paletta.app */'

function getSlug(h: string, seen: Record<string, number>): string {
  let slug = slugifyColorName(getColorName(h) || 'color')
  if (!slug) slug = 'color'
  seen[slug] = (seen[slug] || 0) + 1
  return seen[slug] > 1 ? `${slug}-${seen[slug]}` : slug
}

function buildCSS(hexes: string[], isPro: boolean): string {
  const seen: Record<string, number> = {}
  const lines: string[] = []
  for (const h of hexes) {
    const key = getSlug(h, seen)
    if (isPro) {
      const shades = generateShades(h, 10)
      shades.forEach((s, i) => {
        lines.push(`  --color-${key}-${TAILWIND_SHADE_LABELS[i]}: ${s};`)
      })
    } else {
      lines.push(`  --color-${key}: ${h};`)
    }
  }
  const prefix = isPro ? '' : WATERMARK + '\n'
  return prefix + [':root {', ...lines, '}'].join('\n')
}

function buildTailwind(hexes: string[], isPro: boolean): string {
  const seen: Record<string, number> = {}
  if (isPro) {
    const blocks = hexes.map(h => {
      const key = getSlug(h, seen)
      const shades = generateShades(h, 10)
      const inner = shades.map((s, i) => `        ${TAILWIND_SHADE_LABELS[i]}: '${s}',`).join('\n')
      return `    '${key}': {\n${inner}\n    },`
    }).join('\n')
    return `// tailwind.config.js\ncolors: {\n${blocks}\n}`
  }
  const inner = hexes.map(h => {
    const key = getSlug(h, seen)
    return `    '${key}': '${h}',`
  }).join('\n')
  return WATERMARK + `\n// tailwind.config.js\ncolors: {\n${inner}\n}`
}

function buildHex(hexes: string[], isPro: boolean): string {
  const prefix = isPro ? '' : WATERMARK + '\n'
  return prefix + hexes.join('\n')
}

export default function ExportPanel({ hexes, onClose }: ExportPanelProps) {
  const { isPro } = usePro()
  const [tab,    setTab]    = useState<Tab>('css')
  const [copied, setCopied] = useState(false)

  const content =
    tab === 'css'      ? buildCSS(hexes, isPro) :
    tab === 'tailwind' ? buildTailwind(hexes, isPro) :
                         buildHex(hexes, isPro)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* silent */ }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'css',      label: 'CSS Variables' },
    { id: 'tailwind', label: 'Tailwind'      },
    { id: 'hex',      label: 'Hex List'      },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 mb-0 rounded-t-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-gray-100">
          <span className="text-[15px] font-semibold text-gray-800">Export Palette</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="block">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Swatch strip */}
        <div className="flex h-10 mx-5 mt-4 rounded-xl overflow-hidden border border-gray-100">
          {hexes.map((h, i) => <div key={i} className="flex-1" style={{ backgroundColor: h }} />)}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 mt-3">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 h-8 rounded-full text-[12px] font-medium transition-all duration-150
                ${tab === t.id ? 'text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
              style={tab === t.id ? { backgroundColor: BRAND } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Code */}
        <div className="mx-5 mt-3 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
          <pre className="p-4 text-[12px] font-mono text-gray-700 leading-relaxed overflow-x-auto whitespace-pre">
            {content}
          </pre>
        </div>

        {/* Copy button */}
        <div className="px-5 pt-4 pb-2">
          <button
            onClick={handleCopy}
            className={`w-full h-10 rounded-full text-[13px] font-semibold transition-all duration-150
              ${copied
                ? 'bg-green-500 text-white'
                : 'text-white hover:opacity-90 active:scale-98'
              }`}
            style={!copied ? { backgroundColor: BRAND } : undefined}
          >
            {copied ? '✓ Copied to clipboard' : 'Copy'}
          </button>
        </div>

        {/* Pro upgrade note */}
        {!isPro && (
          <div className="px-5 pb-4 text-center">
            <span className="text-[11px] text-gray-400">
              ✦ Free plan includes <span className="font-mono">/* Made with Paletta */</span> comment · Upgrade to remove
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
