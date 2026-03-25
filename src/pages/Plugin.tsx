import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProBadge from '@/components/ui/ProBadge'
import { BRAND_VIOLET } from '@/lib/tokens'

const FIGMA_URL = 'https://www.figma.com/community/plugin/PLACEHOLDER'

const FEATURES = [
  {
    title: 'Variables in one click',
    description: 'Generate Figma Variables from any palette. Flat or shade scales, ready for your design system.',
    icon: VariablesIcon,
  },
  {
    title: 'Accessibility Lens',
    description: 'Simulate protanopia, deuteranopia, tritanopia, achromatopsia and monochromacy directly on your palette.',
    icon: LensIcon,
  },
  {
    title: 'AI palette generation',
    description: 'Describe a mood, brand, or concept. Get a production-ready palette in seconds.',
    icon: AiIcon,
    pro: true,
  },
  {
    title: 'Code export',
    description: 'Copy CSS custom properties or Tailwind config. Paste into your project and ship.',
    icon: CodeIcon,
  },
  {
    title: 'Shade scales',
    description: 'Generate full 50–900 shade scales for every color. Export as Tailwind or Figma Variables.',
    icon: ShadesIcon,
    pro: true,
  },
  {
    title: 'Contrast checker',
    description: 'WCAG 2.1 AA/AAA contrast ratios for every color pair. No guesswork.',
    icon: ContrastIcon,
  },
]

const FREE_FEATURES = [
  '5 colors per palette',
  '3 saved palettes',
  'CSS export',
  'Flat Variables',
  'Normal + Protanopia lens',
  '3 AI prompts/day',
]

const PRO_FEATURES = [
  '8 colors per palette',
  'Unlimited saves',
  'CSS + Tailwind export',
  'Shade Variables',
  'All 5 lens modes',
  'Unlimited AI',
]

export default function Plugin() {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Paletta for Figma — Color System Plugin'
    return () => { document.title = 'Paletta — Free Color Palette Generator' }
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4" style={{ maxWidth: 1080, margin: '0 auto' }}>
        <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label="Back to Paletta">
          <img src="/logo.svg" alt="" className="shrink-0" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'contain' }} />
          <span className="text-[16px] font-medium font-brand text-foreground">Paletta</span>
        </Link>
        <a
          href={FIGMA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-4 rounded-button flex items-center text-[13px] font-semibold text-white no-underline transition-colors"
          style={{ backgroundColor: BRAND_VIOLET }}
        >
          Install Plugin
        </a>
      </header>

      {/* Hero */}
      <section className="px-6 pt-12 pb-16 text-center" style={{ maxWidth: 680, margin: '0 auto' }}>
        <div className="flex justify-center mb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(108,71,255,0.08)' }}
          >
            <FigmaIcon />
          </div>
        </div>
        <h1 className="text-[32px] sm:text-[40px] font-extrabold text-foreground leading-tight mb-3">
          Paletta for Figma
        </h1>
        <p className="text-[16px] sm:text-[18px] text-muted-foreground leading-relaxed mb-8 max-w-[480px] mx-auto">
          Create production-ready color systems without leaving Figma
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={FIGMA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 px-8 rounded-button flex items-center text-[15px] font-semibold text-white no-underline transition-all active:scale-[0.98]"
            style={{ backgroundColor: BRAND_VIOLET }}
            aria-label="Install Paletta plugin from Figma Community"
          >
            Install Plugin
          </a>
          <Link
            to="/"
            className="h-12 px-6 rounded-button flex items-center text-[14px] font-medium text-muted-foreground no-underline hover:text-foreground transition-colors"
            style={{ border: '1px solid hsl(var(--border))' }}
          >
            Already have it? Sign in
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 pb-16" style={{ maxWidth: 880, margin: '0 auto' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(({ title, description, icon: Icon, pro }) => (
            <div
              key={title}
              className="bg-card rounded-card border border-border/40 p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(108,71,255,0.08)' }}
                >
                  <Icon />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <h3 className="text-[15px] font-semibold text-foreground leading-snug">{title}</h3>
                  {pro && <ProBadge />}
                </div>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed ml-[52px]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Free vs Pro */}
      <section className="px-6 pb-20" style={{ maxWidth: 680, margin: '0 auto' }}>
        <h2 className="text-[22px] font-bold text-foreground text-center mb-8">Free vs Pro</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Free Column */}
          <div className="bg-card rounded-card border border-border/40 p-5">
            <h3 className="text-[14px] font-bold text-foreground mb-4">Free</h3>
            <ul className="space-y-2.5 list-none p-0 m-0">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-muted-foreground leading-snug">
                  <CheckIcon className="shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Column */}
          <div
            className="rounded-card p-5 relative overflow-hidden"
            style={{
              backgroundColor: 'rgba(108,71,255,0.04)',
              border: `1.5px solid ${BRAND_VIOLET}20`,
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-[14px] font-bold text-foreground">Pro</h3>
              <ProBadge />
            </div>
            <ul className="space-y-2.5 list-none p-0 m-0">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-foreground leading-snug">
                  <CheckIcon className="shrink-0 mt-0.5" color={BRAND_VIOLET} />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="/#pro"
              className="mt-5 h-10 w-full rounded-button flex items-center justify-center text-[13px] font-semibold text-white no-underline transition-all active:scale-[0.98]"
              style={{ backgroundColor: BRAND_VIOLET }}
            >
              Go Pro — $5/month
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4" style={{ maxWidth: 880, margin: '0 auto' }}>
          <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors no-underline text-muted-foreground">
              Paletta Web
            </Link>
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors no-underline text-muted-foreground">
              Privacy
            </Link>
            <Link to="/terms-of-service" className="hover:text-foreground transition-colors no-underline text-muted-foreground">
              Terms
            </Link>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Made by{' '}
            <a
              href="https://andresclavijo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Andres Clavijo
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ── Icons ── */

function FigmaIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 24c2.2 0 4-1.8 4-4v-4H8c-2.2 0-4 1.8-4 4s1.8 4 4 4z" fill="#0ACF83" />
      <path d="M4 12c0-2.2 1.8-4 4-4h4v8H8c-2.2 0-4-1.8-4-4z" fill="#A259FF" />
      <path d="M4 4c0-2.2 1.8-4 4-4h4v8H8C5.8 8 4 6.2 4 4z" fill="#F24E1E" />
      <path d="M12 0h4c2.2 0 4 1.8 4 4s-1.8 4-4 4h-4V0z" fill="#FF7262" />
      <path d="M20 12c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4z" fill="#1ABCFE" />
    </svg>
  )
}

function CheckIcon({ className, color = 'currentColor' }: { className?: string; color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function VariablesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_VIOLET} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function LensIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_VIOLET} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" y1="8" x2="12" y2="8" />
      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
    </svg>
  )
}

function AiIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_VIOLET} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  )
}

function CodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_VIOLET} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  )
}

function ShadesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_VIOLET} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="8.5" x2="21" y2="8.5" />
      <line x1="3" y1="13" x2="21" y2="13" />
      <line x1="3" y1="17.5" x2="21" y2="17.5" />
    </svg>
  )
}

function ContrastIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_VIOLET} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 0 20" fill={BRAND_VIOLET} fillOpacity="0.15" stroke="none" />
    </svg>
  )
}
