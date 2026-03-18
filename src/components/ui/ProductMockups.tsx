/**
 * Premium Dribbble-quality product mockups used by PreviewPanel and ProUpgradeModal.
 * Each mockup takes a `colors` array (hex strings) and renders a detailed miniature UI
 * with real text, typography, charts, avatars, and decorative elements.
 */
import type { CSSProperties, ReactNode } from 'react'

export const MOCKUP_TABS = ['Landing Page', 'Dashboard', 'Mobile App'] as const
export type MockupTab = (typeof MOCKUP_TABS)[number]

export const FALLBACK_COLORS = ['#6C47FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

export const TAB_CAPTIONS: Record<MockupTab, string> = {
  'Landing Page': 'Your colors in a real landing page →',
  'Dashboard': 'Your colors in a real dashboard →',
  'Mobile App': 'Your colors in a real mobile app →',
}

const FONT: CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif' }

function card(extra?: CSSProperties): CSSProperties {
  return {
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: 10,
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    ...extra,
  }
}

/* ------------------------------------------------------------------ */
/*  Browser chrome wrapper                                            */
/* ------------------------------------------------------------------ */

export function BrowserChrome({ children }: { children: ReactNode }) {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF5F57' }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFBD2E' }} />
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#28C840' }} />
        </div>
        <div style={{ flex: 1, margin: '0 16px', height: 20, borderRadius: 6, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 8, color: '#9CA3AF', ...FONT }}>prodmast.com</span>
        </div>
      </div>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Landing Page — Premium SaaS                                       */
/* ------------------------------------------------------------------ */

function FloatingIcon({ x, y, rotate, color, children }: { x: string; y: string; rotate: number; color: string; children: ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`,
        width: 26, height: 26, borderRadius: 8, pointerEvents: 'none',
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </div>
  )
}

export function LandingMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <BrowserChrome>
      <div style={{ ...FONT, padding: '14px 16px 12px', background: '#fff' }}>
        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: c[0] }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>Prodmast</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {['Home', 'About', 'Services', 'Contact'].map(t => (
              <span key={t} style={{ fontSize: 7, color: '#6B7280', fontWeight: 500 }}>{t}</span>
            ))}
            <span style={{ fontSize: 7, color: '#fff', background: c[0], padding: '3px 12px', borderRadius: 99, fontWeight: 600 }}>Sign Up</span>
          </div>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', position: 'relative', padding: '22px 12px 16px' }}>
          {/* Floating decorative icons — arrow, document, chart, settings, sparkle */}
          <FloatingIcon x="3%" y="6%" rotate={-12} color={c[0]}>
            <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
          </FloatingIcon>
          <FloatingIcon x="88%" y="4%" rotate={15} color={c[1] || c[0]}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
          </FloatingIcon>
          <FloatingIcon x="1%" y="62%" rotate={8} color={c[2] || c[0]}>
            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
          </FloatingIcon>
          <FloatingIcon x="90%" y="58%" rotate={-8} color={c[3] || c[0]}>
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4" />
          </FloatingIcon>
          <FloatingIcon x="14%" y="78%" rotate={20} color={c[4] || c[0]}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </FloatingIcon>

          <div style={{ fontSize: 17, fontWeight: 800, color: '#111827', lineHeight: 1.15, marginBottom: 3 }}>
            The Future of Design
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.15, marginBottom: 8 }}>
            <span style={{ color: '#111827' }}>with </span>
            <span style={{ color: c[0] }}>Latest Technology</span>
          </div>
          <div style={{ fontSize: 8, color: '#6B7280', marginBottom: 14, lineHeight: 1.5 }}>
            Expert tech to elevate your business. Let&apos;s take your product further.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 7.5, color: '#fff', background: c[0], padding: '5px 16px', borderRadius: 7, fontWeight: 600 }}>Get Started</span>
            <span style={{ fontSize: 7.5, color: c[0], border: `1.5px solid ${c[0]}`, padding: '4px 16px', borderRadius: 7, fontWeight: 600 }}>Try Demo</span>
          </div>
        </div>

        {/* Reviews */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, margin: '6px 0 14px' }}>
          <div style={{ display: 'flex', gap: 1 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <svg key={i} width="9" height="9" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span style={{ fontSize: 7.5, fontWeight: 700, color: '#111827' }}>5.0</span>
          <span style={{ fontSize: 6.5, color: '#9CA3AF' }}>from 80+ reviews</span>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          {[
            { num: '100+', label: 'Projects Delivered' },
            { num: '6+', label: 'Years of Experience' },
          ].map(s => (
            <div key={s.label} style={card({ padding: '10px 20px', textAlign: 'center' })}>
              <div style={{ fontSize: 16, fontWeight: 800, color: c[0] }}>{s.num}</div>
              <div style={{ fontSize: 6, color: '#9CA3AF', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F3F4F6', paddingTop: 8 }}>
          <span style={{ fontSize: 6, color: '#D1D5DB' }}>© 2026 Prodmast</span>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Privacy', 'Terms', 'Contact'].map(t => (
              <span key={t} style={{ fontSize: 6, color: '#D1D5DB' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}

/* ------------------------------------------------------------------ */
/*  Dashboard — NexaVerse Admin Panel                                 */
/* ------------------------------------------------------------------ */

const DASH_NAV = [
  { icon: '◉', label: 'Overview', active: true },
  { icon: '⇄', label: 'Transactions', active: false },
  { icon: '♟', label: 'Customers', active: false },
  { icon: '▤', label: 'Reports', active: false },
  { icon: '⚙', label: 'Settings', active: false },
  { icon: '⟨⟩', label: 'Developer', active: false },
]

const DASH_TX = [
  { init: 'SE', name: 'S. Evergreen', type: 'Subscription', amount: '+$120.00', ci: 0 },
  { init: 'RS', name: 'R. Sterling', type: 'Refund', amount: '-$45.00', ci: 1 },
  { init: 'JB', name: 'J. Blackburn', type: 'Payment', amount: '+$89.50', ci: 2 },
  { init: 'YW', name: 'Y. Williams', type: 'Subscription', amount: '+$120.00', ci: 3 },
  { init: 'LF', name: 'L. Frost', type: 'Payment', amount: '+$250.00', ci: 0 },
  { init: 'MS', name: 'M. Sinard', type: 'Refund', amount: '-$32.00', ci: 1 },
]

const DASH_TICKETS = [
  { email: 'jessica.smith12@example.com', issue: 'Login Issue', status: 'Open', dot: '#EF4444' },
  { email: 'daniel.reed46@random.com', issue: 'Billing Inquiry', status: 'Pending', dot: '#F59E0B' },
  { email: 'emily.wilson78@fullchannel.net', issue: 'Product Malfunction', status: 'Closed', dot: '#22C55E' },
  { email: 'andrew.johnson23@proxyhillers.org', issue: 'Feature Request', status: 'Open', dot: '#EF4444' },
]

const CHART_BARS = [
  { m: 'Jan', h: 0.45 }, { m: 'Feb', h: 0.65 }, { m: 'Mar', h: 0.55 },
  { m: 'Apr', h: 0.80 }, { m: 'May', h: 0.70 }, { m: 'Jun', h: 0.90 }, { m: 'Jul', h: 0.60 },
]

export function DashboardMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <div style={{ ...FONT, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB', display: 'flex', background: '#F0F0F0', height: 520 }}>
      {/* ======== SIDEBAR ======== */}
      <div style={{ width: 80, background: c[0], padding: '10px 6px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14, padding: '0 4px' }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 7, fontWeight: 800, color: '#fff' }}>N</span>
          </div>
          <span style={{ fontSize: 6.5, fontWeight: 700, color: '#fff' }}>NexaVerse</span>
        </div>
        {/* Nav items */}
        {DASH_NAV.map(n => (
          <div key={n.label} style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 5px', borderRadius: 4, marginBottom: 1,
            background: n.active ? 'rgba(255,255,255,0.15)' : 'transparent',
            borderLeft: n.active ? '2px solid #fff' : '2px solid transparent',
          }}>
            <span style={{ fontSize: 6, width: 10, textAlign: 'center', color: '#fff', opacity: n.active ? 1 : 0.5 }}>{n.icon}</span>
            <span style={{ fontSize: 5.5, color: '#fff', opacity: n.active ? 1 : 0.55, fontWeight: n.active ? 600 : 400 }}>{n.label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        {/* Log out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 5px' }}>
          <span style={{ fontSize: 6, color: '#fff', opacity: 0.5 }}>←</span>
          <span style={{ fontSize: 5.5, color: '#fff', opacity: 0.5 }}>Log out</span>
        </div>
      </div>

      {/* ======== MAIN CONTENT ======== */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#fff', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#111827' }}>Dashboard</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ height: 14, borderRadius: 99, background: `${c[0]}10`, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 3 }}>
              <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke={c[0]} strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <span style={{ fontSize: 4.5, color: '#9CA3AF' }}>Search transactions, customers...</span>
            </div>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: c[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 6, fontWeight: 700, color: '#fff' }}>NV</span>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '8px 10px' }}>
          {/* ---- Stat cards ---- */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginBottom: 8 }}>
            {[
              { label: 'Current MRR', value: '$12.4k', ci: 0 },
              { label: 'Current Customers', value: '16,601', ci: 1 },
              { label: 'Active Customers', value: '33%', ci: 2 },
              { label: 'Churn Rate', value: '2%', ci: 3 },
            ].map(s => (
              <div key={s.label} style={{ borderRadius: 10, padding: '7px 8px', background: c[s.ci % c.length], color: '#fff' }}>
                <div style={{ fontSize: 4.5, opacity: 0.85, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, fontWeight: 800 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* ---- Charts row: Trend | Sales donut | Transactions ---- */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', gap: 5, marginBottom: 8 }}>
            {/* Trend chart */}
            <div style={card({ padding: '7px 8px' })}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 6, fontWeight: 700, color: '#111827' }}>Trend</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {['WEEKLY', 'MONTHLY', 'YEARLY'].map((p, pi) => (
                    <span key={p} style={{
                      fontSize: 3.5, fontWeight: 600, padding: '1.5px 4px', borderRadius: 99,
                      background: pi === 1 ? c[0] : '#F3F4F6',
                      color: pi === 1 ? '#fff' : '#9CA3AF',
                    }}>{p}</span>
                  ))}
                </div>
              </div>
              {/* Y-axis + bars */}
              <div style={{ display: 'flex', gap: 3, height: 58 }}>
                {/* Y labels */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: 16, flexShrink: 0 }}>
                  {['$15k', '$10k', '$5k', '$0'].map(l => (
                    <span key={l} style={{ fontSize: 3.5, color: '#D1D5DB', textAlign: 'right' }}>{l}</span>
                  ))}
                </div>
                {/* Bars area */}
                <div style={{ flex: 1, position: 'relative' }}>
                  {/* Dashed grid lines */}
                  {[0, 1, 2, 3].map(i => (
                    <div key={`gl-${i}`} style={{ position: 'absolute', left: 0, right: 0, top: `${(i / 3) * 100}%`, borderTop: '1px dashed #F3F4F6' }} />
                  ))}
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: 3, position: 'relative', zIndex: 1 }}>
                    {CHART_BARS.map((b) => (
                      <div key={b.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: '100%', maxWidth: 14, borderRadius: '3px 3px 0 0',
                          height: `${b.h * 100}%`,
                          background: `linear-gradient(180deg, ${c[0]}, ${c[1] || c[0]})`,
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Month labels */}
              <div style={{ display: 'flex', gap: 3, marginLeft: 19, marginTop: 2 }}>
                {CHART_BARS.map(b => (
                  <div key={b.m} style={{ flex: 1, textAlign: 'center', fontSize: 3.5, color: '#9CA3AF' }}>{b.m}</div>
                ))}
              </div>
            </div>

            {/* Sales donut */}
            <div style={card({ padding: '7px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' })}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 6 }}>
                <span style={{ fontSize: 6, fontWeight: 700, color: '#111827' }}>Sales</span>
                <div style={{ display: 'flex', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: c[0] }} />
                    <span style={{ fontSize: 3.5, color: '#9CA3AF' }}>Online</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: c[1] || c[0] }} />
                    <span style={{ fontSize: 3.5, color: '#9CA3AF' }}>Offline</span>
                  </div>
                </div>
              </div>
              {/* SVG donut */}
              <svg width="52" height="52" viewBox="0 0 52 52" style={{ margin: '2px 0' }} aria-hidden="true">
                <circle cx="26" cy="26" r="20" fill="none" stroke={c[1] || c[0]} strokeWidth="7" />
                <circle cx="26" cy="26" r="20" fill="none" stroke={c[0]} strokeWidth="7"
                  strokeDasharray={`${0.65 * 125.6} ${0.35 * 125.6}`}
                  strokeDashoffset="31.4" strokeLinecap="round"
                />
                <text x="26" y="24" textAnchor="middle" style={{ fontSize: 9, fontWeight: 800, fill: '#111827' }}>342</text>
                <text x="26" y="31" textAnchor="middle" style={{ fontSize: 4.5, fill: '#9CA3AF' }}>Total</text>
              </svg>
            </div>

            {/* Transactions list */}
            <div style={card({ padding: '7px 8px' })}>
              <span style={{ fontSize: 6, fontWeight: 700, color: '#111827', display: 'block', marginBottom: 4 }}>Transactions</span>
              {DASH_TX.map((tx, i) => (
                <div key={tx.name} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2.5px 0', borderTop: i > 0 ? '1px solid #F3F4F6' : undefined }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: `${c[tx.ci % c.length]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 4, fontWeight: 700, color: c[tx.ci % c.length] }}>{tx.init}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 4.5, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.name}</div>
                    <div style={{ fontSize: 3.5, color: '#9CA3AF' }}>{tx.type}</div>
                  </div>
                  <span style={{ fontSize: 4.5, fontWeight: 600, color: tx.amount.startsWith('+') ? '#22C55E' : '#EF4444', flexShrink: 0 }}>{tx.amount}</span>
                </div>
              ))}
              <div style={{ marginTop: 4, textAlign: 'center' }}>
                <span style={{ fontSize: 4, color: c[0], fontWeight: 600 }}>View all transactions →</span>
              </div>
            </div>
          </div>

          {/* ---- Bottom row: Support Tickets | Customer Demographic ---- */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 5 }}>
            {/* Support Tickets */}
            <div style={card({ padding: '7px 8px' })}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 6, fontWeight: 700, color: '#111827' }}>Support Tickets</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[
                    { label: 'All', active: true },
                    { label: 'Open', active: false },
                    { label: 'Pending', active: false },
                    { label: 'Closed', active: false },
                  ].map(f => (
                    <span key={f.label} style={{
                      fontSize: 3.5, fontWeight: 600, padding: '1.5px 5px', borderRadius: 99,
                      background: f.active ? c[0] : '#F3F4F6',
                      color: f.active ? '#fff' : '#9CA3AF',
                    }}>{f.label}</span>
                  ))}
                </div>
              </div>
              {DASH_TICKETS.map((t, i) => (
                <div key={t.email} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 0', borderTop: i > 0 ? '1px solid #F3F4F6' : undefined }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: t.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 4, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.email}</div>
                  </div>
                  <span style={{ fontSize: 3.5, color: '#9CA3AF', flexShrink: 0 }}>{t.issue}</span>
                  <span style={{
                    fontSize: 3.5, fontWeight: 600, padding: '1px 4px', borderRadius: 99, flexShrink: 0,
                    background: t.status === 'Open' ? '#FEE2E2' : t.status === 'Pending' ? '#FEF3C7' : '#DCFCE7',
                    color: t.status === 'Open' ? '#DC2626' : t.status === 'Pending' ? '#D97706' : '#16A34A',
                  }}>{t.status}</span>
                </div>
              ))}
            </div>

            {/* Customer Demographic */}
            <div style={card({ padding: '7px 8px' })}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 6, fontWeight: 700, color: '#111827' }}>Customer Demographic</span>
                <span style={{ fontSize: 3.5, fontWeight: 700, color: '#22C55E', background: '#DCFCE7', padding: '1px 4px', borderRadius: 99 }}>ACTIVE</span>
              </div>
              {/* World map (simplified SVG) */}
              <svg viewBox="0 0 200 100" style={{ width: '100%', height: 52 }} aria-hidden="true">
                {/* Simplified continents */}
                <ellipse cx="55" cy="42" rx="28" ry="20" fill={`${c[0]}12`} />
                <ellipse cx="105" cy="38" rx="22" ry="22" fill={`${c[0]}10`} />
                <ellipse cx="150" cy="45" rx="25" ry="18" fill={`${c[0]}10`} />
                <ellipse cx="45" cy="70" rx="18" ry="10" fill={`${c[0]}08`} />
                <ellipse cx="160" cy="72" rx="14" ry="8" fill={`${c[0]}08`} />
                {/* Data points */}
                <circle cx="45" cy="38" r="3" fill={c[0]} opacity="0.8" />
                <circle cx="65" cy="50" r="2.5" fill={c[1] || c[0]} opacity="0.7" />
                <circle cx="100" cy="35" r="3.5" fill={c[2] || c[0]} opacity="0.8" />
                <circle cx="115" cy="48" r="2" fill={c[3] || c[0]} opacity="0.7" />
                <circle cx="145" cy="40" r="3" fill={c[0]} opacity="0.6" />
                <circle cx="155" cy="55" r="2" fill={c[1] || c[0]} opacity="0.5" />
                <circle cx="35" cy="68" r="2" fill={c[2] || c[0]} opacity="0.6" />
              </svg>
              {/* Legend */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {[
                  { region: 'Americas', pct: '34%', ci: 0 },
                  { region: 'Europe', pct: '28%', ci: 1 },
                  { region: 'Asia', pct: '25%', ci: 2 },
                  { region: 'Other', pct: '13%', ci: 3 },
                ].map(r => (
                  <div key={r.region} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: c[r.ci % c.length] }} />
                    <span style={{ fontSize: 3.5, color: '#6B7280' }}>{r.region} {r.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Mobile App — Three phones side by side                            */
/* ------------------------------------------------------------------ */

function PhoneFrame({ children, offset = 0 }: { children: ReactNode; offset?: number }) {
  return (
    <div style={{
      width: 125, borderRadius: 20, overflow: 'hidden',
      background: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.10)',
      border: '2px solid #E5E7EB', flexShrink: 0,
      transform: `translateY(${offset}px)`,
    }}>
      {children}
    </div>
  )
}

function StatusBar({ bg }: { bg: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: bg, padding: '3px 8px' }}>
      <span style={{ fontSize: 5.5, color: '#fff', fontWeight: 600 }}>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <svg width="7" height="5" viewBox="0 0 16 12" fill="#fff" opacity="0.7" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="0.5" /><rect x="4.5" y="5" width="3" height="7" rx="0.5" /><rect x="9" y="2" width="3" height="10" rx="0.5" /><rect x="13.5" y="0" width="2.5" height="12" rx="0.5" /></svg>
        <svg width="10" height="5" viewBox="0 0 28 13" fill="none" opacity="0.7" aria-hidden="true"><rect x="0.5" y="0.5" width="23" height="12" rx="2" stroke="#fff" strokeWidth="1" /><rect x="2" y="2" width="18" height="9" rx="1" fill="#fff" /></svg>
      </div>
    </div>
  )
}

export function MobileAppMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <div style={{ ...FONT, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, padding: '6px 0' }}>
      {/* ---- Phone 1: Home ---- */}
      <PhoneFrame offset={-4}>
        <StatusBar bg={c[0]} />
        <div style={{ background: c[0], padding: '4px 9px 9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />
            <span style={{ fontSize: 6.5, color: '#fff', fontWeight: 600 }}>Cooper 1.7 <span style={{ fontSize: 4.5, opacity: 0.5 }}>▾</span></span>
          </div>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
        </div>

        <div style={{ padding: '7px 8px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#111827', marginBottom: 1 }}>Hello James</div>
          <div style={{ fontSize: 5.5, color: '#9CA3AF', marginBottom: 7 }}>Make your day easy with us</div>

          {/* Feature cards */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 7 }}>
            <div style={{ flex: 1, borderRadius: 9, padding: '7px 6px', background: `${c[0]}12`, textAlign: 'center' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: c[0], margin: '0 auto 3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <div style={{ fontSize: 5.5, fontWeight: 600, color: '#111827' }}>Talk with Cooper</div>
              <div style={{ fontSize: 4.5, color: '#9CA3AF', marginTop: 1 }}>Let&apos;s try it now</div>
            </div>
            <div style={{ flex: 1, borderRadius: 9, padding: '7px 6px', background: `${c[2] || c[0]}10`, textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 4, right: 4, fontSize: 4, fontWeight: 700, color: '#fff', background: '#EF4444', padding: '1px 5px', borderRadius: 99 }}>New</div>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: c[2] || c[0], margin: '0 auto 3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
              </div>
              <div style={{ fontSize: 5.5, fontWeight: 600, color: '#111827' }}>New Chat</div>
            </div>
          </div>

          {/* Search by Image */}
          <div style={{ borderRadius: 9, padding: '7px 8px', background: '#1a1a2e', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
            <span style={{ fontSize: 6, fontWeight: 600, color: '#fff' }}>Search by Image</span>
          </div>

          {/* Recent Search */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 6.5, fontWeight: 700, color: '#111827' }}>Recent Search</span>
            <span style={{ fontSize: 5, color: c[0], fontWeight: 500 }}>See All</span>
          </div>
          {['What is a wild animal?', 'Scanning images', 'Analysis my dribbble shot'].map((q, i) => (
            <div key={q} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3.5px 0', borderTop: i > 0 ? '1px solid #F3F4F6' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <span style={{ fontSize: 5, color: '#374151' }}>{q}</span>
              </div>
              <span style={{ fontSize: 7, color: '#D1D5DB', lineHeight: 1 }}>···</span>
            </div>
          ))}
        </div>
      </PhoneFrame>

      {/* ---- Phone 2: Chat ---- */}
      <PhoneFrame offset={0}>
        <StatusBar bg={c[0]} />
        <div style={{ background: c[0], padding: '4px 9px 9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            <span style={{ fontSize: 6.5, color: '#fff', fontWeight: 600 }}>Cooper 1.7 <span style={{ fontSize: 4.5, opacity: 0.5 }}>▾</span></span>
          </div>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
        </div>

        <div style={{ padding: '7px 8px', background: '#FAFAFA' }}>
          {/* Today badge */}
          <div style={{ textAlign: 'center', marginBottom: 7 }}>
            <span style={{ fontSize: 5, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 10px', borderRadius: 99 }}>Today</span>
          </div>

          {/* User message */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
            <div style={{ maxWidth: '82%', background: c[0], color: '#fff', padding: '6px 8px', borderRadius: '9px 9px 2px 9px', fontSize: 5.5, lineHeight: 1.45 }}>
              Provide statistics on the development of technology over the next 5 years
            </div>
          </div>
          <div style={{ textAlign: 'right', marginBottom: 7 }}>
            <span style={{ fontSize: 4, color: '#D1D5DB' }}>1 min ago</span>
          </div>

          {/* Bot response */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#1a1a2e', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 7, color: '#fff', fontWeight: 700 }}>C</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 5.5, fontWeight: 600, color: '#111827', marginBottom: 3 }}>Cooper</div>
              <div style={{ fontSize: 5, color: '#6B7280', lineHeight: 1.45, marginBottom: 5 }}>
                Based on current data, AI investment will reach:
              </div>
              <div style={{ textAlign: 'center', marginBottom: 5 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: c[0] }}>275.5M</div>
                <div style={{ fontSize: 5, color: '#9CA3AF' }}>Projected Spend ($)</div>
              </div>
              {/* Mini bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', height: 26, gap: 3, padding: '0 4px' }}>
                {[0.3, 0.5, 0.65, 0.85, 1.0].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: `${h * 100}%`, background: c[i % c.length], borderRadius: '2px 2px 0 0', opacity: 0.85 }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 3, padding: '0 4px', marginTop: 2 }}>
                {['21', '22', '23', '24', '25'].map(y => (
                  <div key={y} style={{ flex: 1, textAlign: 'center', fontSize: 4.5, color: '#9CA3AF' }}>{y}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 7, background: '#fff', borderRadius: 99, padding: '4px 5px 4px 9px', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: 5.5, color: '#D1D5DB', flex: 1 }}>Ask anything here..</span>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: c[0], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </div>
          </div>
        </div>
      </PhoneFrame>

      {/* ---- Phone 3: Pricing/Pro ---- */}
      <PhoneFrame offset={-4}>
        <StatusBar bg={c[0]} />
        {/* Header with decorative text */}
        <div style={{ background: c[0], padding: '4px 9px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.07)', lineHeight: 1 }}>Cooper+</div>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.2)', margin: '5px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          </div>
          <span style={{ fontSize: 5, color: '#fff', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Pro</span>
        </div>

        <div style={{ padding: '8px 8px', background: '#FAFAFA' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#111827', textAlign: 'center', marginBottom: 2 }}>Cooper+ plans</div>
          <div style={{ fontSize: 5.5, color: '#9CA3AF', textAlign: 'center', marginBottom: 7 }}>Try unlimited features with cooper+</div>

          {/* Plan cards */}
          {[
            { name: 'Monthly Plan', price: '$8.99', period: '/month' },
            { name: 'Yearly Plan', price: '$69.99', period: '/year' },
          ].map((p, pi) => (
            <div key={p.name} style={card({ padding: '7px 8px', marginBottom: 5, border: pi === 0 ? `2px solid ${c[0]}` : '1px solid rgba(0,0,0,0.05)' })}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 6.5, fontWeight: 700, color: '#111827' }}>{p.name}</span>
                {pi === 0 && <span style={{ fontSize: 4.5, color: c[0], background: `${c[0]}15`, padding: '1px 5px', borderRadius: 99, fontWeight: 600 }}>Free ads</span>}
              </div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#111827' }}>{p.price}</span>
                <span style={{ fontSize: 5, color: '#9CA3AF' }}>{p.period}</span>
              </div>
              {['Chat unlimited', 'Notify automatic'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke={c[0]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                  <span style={{ fontSize: 5.5, color: '#6B7280' }}>{f}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Subscribe button */}
          <div style={{ background: '#1a1a2e', color: '#fff', textAlign: 'center', padding: '6px 0', borderRadius: 8, fontSize: 6.5, fontWeight: 600, marginTop: 3 }}>
            Subscription
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}
