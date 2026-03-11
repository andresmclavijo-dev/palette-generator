import { useState } from 'react'

type Tab = 'css' | 'tailwind' | 'hex'

interface ExportPanelProps {
  hexes: string[]
  onClose: () => void
}

function buildCSS(hexes: string[]): string {
  return [
    ':root {',
    ...hexes.map((h, i) => `  --color-${i + 1}: ${h};`),
    '}'
  ].join('\n')
}

function buildTailwind(hexes: string[]): string {
  const inner = hexes.map((h, i) => `      ${i + 1}: '${h}',`).join('\n')
  return `// tailwind.config.js\ncolors: {\n  brand: {\n${inner}\n  },\n}`
}

function buildHex(hexes: string[]): string {
  return hexes.join('  ')
}

export default function ExportPanel({ hexes, onClose }: ExportPanelProps) {
  const [tab, setTab]     = useState<Tab>('css')
  const [copied, setCopied] = useState(false)

  const content = tab === 'css'
    ? buildCSS(hexes)
    : tab === 'tailwind'
    ? buildTailwind(hexes)
    : buildHex(hexes)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* silent */ }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'css',      label: 'CSS Vars'  },
    { id: 'tailwind', label: 'Tailwind'  },
    { id: 'hex',      label: 'Hex List'  },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-30"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="
          absolute bottom-16 right-4 z-40
          w-72 rounded-2xl overflow-hidden
          bg-black/75 backdrop-blur-xl
          border border-white/10
          shadow-2xl
        "
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/8">
          <span className="text-[11px] font-mono text-white/50 tracking-widest uppercase">Export</span>
          <button
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-white/8">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setCopied(false) }}
              className={`
                flex-1 py-2.5 text-[10px] font-mono tracking-wider
                transition-all duration-150
                ${tab === t.id
                  ? 'text-white/90 border-b-2 border-white/40'
                  : 'text-white/35 hover:text-white/60'
                }
              `}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Color preview row */}
        <div className="flex h-8">
          {hexes.map(h => (
            <div key={h} className="flex-1" style={{ backgroundColor: h }} />
          ))}
        </div>

        {/* Code block */}
        <pre className="px-4 py-3 text-[11px] font-mono text-white/65 leading-relaxed whitespace-pre-wrap break-all">
          {content}
        </pre>

        {/* Copy button */}
        <div className="px-4 pb-4">
          <button
            onClick={handleCopy}
            className="
              w-full py-2.5 rounded-xl
              bg-white/10 hover:bg-white/18
              text-[11px] font-mono tracking-wider
              text-white/70 hover:text-white/95
              transition-all duration-150
              flex items-center justify-center gap-2
            "
          >
            {copied ? (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy all
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
