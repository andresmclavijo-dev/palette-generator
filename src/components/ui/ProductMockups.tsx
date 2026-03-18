/**
 * Shared high-fidelity product mockups used by PreviewPanel and ProUpgradeModal.
 * Each mockup takes a `colors` array (hex strings) and renders a miniature UI
 * with real text and typography using palette colors.
 */

export const MOCKUP_TABS = ['Landing Page', 'Dashboard', 'Mobile App'] as const
export type MockupTab = (typeof MOCKUP_TABS)[number]

export const FALLBACK_COLORS = ['#6C47FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

export const TAB_CAPTIONS: Record<MockupTab, string> = {
  'Landing Page': 'Your colors in a real landing page →',
  'Dashboard': 'Your colors in a real dashboard →',
  'Mobile App': 'Your colors in a real mobile app →',
}

const card = { border: '1px solid #E5E7EB', borderRadius: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } as const
const fs = { fontFamily: 'system-ui, -apple-system, sans-serif' } as const

/* ------------------------------------------------------------------ */
/*  Browser chrome wrapper                                            */
/* ------------------------------------------------------------------ */

export function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200/60" style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100" style={{ background: '#FAFAFA' }}>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: '#FF5F57' }} />
          <div className="w-2 h-2 rounded-full" style={{ background: '#FFBD2E' }} />
          <div className="w-2 h-2 rounded-full" style={{ background: '#28C840' }} />
        </div>
        <div className="flex-1 mx-2 h-4 rounded" style={{ background: '#F3F4F6' }}>
          <div className="flex items-center justify-center h-full">
            <span style={{ fontSize: 7, color: '#9CA3AF', ...fs }}>yourproduct.com</span>
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden">
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Landing page                                                      */
/* ------------------------------------------------------------------ */

const FEATURES = [
  { title: 'Lightning Fast', desc: 'Deploy in seconds with our optimized pipeline and CDN.', icon: 'star' },
  { title: 'Secure by Default', desc: 'Enterprise-grade encryption and compliance built in.', icon: 'shield' },
  { title: 'Easy Integration', desc: 'Connect with your tools via REST API or webhooks.', icon: 'zap' },
] as const

function FeatureIcon({ type, color }: { type: string; color: string }) {
  const s = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  return (
    <div className="shrink-0 flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: 6, background: color }}>
      <svg {...s}>
        {type === 'star' && <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></>}
        {type === 'shield' && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>}
        {type === 'zap' && <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>}
      </svg>
    </div>
  )
}

export function LandingMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <BrowserChrome>
      <div style={{ ...fs, padding: 10 }}>
        {/* Nav */}
        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 9, fontWeight: 800, color: c[0] }}>YourBrand</span>
          </div>
          <div className="flex items-center" style={{ gap: 8 }}>
            {['Home', 'Features', 'Pricing'].map(t => (
              <span key={t} style={{ fontSize: 6.5, color: '#6B7280' }}>{t}</span>
            ))}
            <span style={{ fontSize: 6.5, color: '#fff', background: c[0], padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Get Started</span>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center" style={{ padding: '12px 0 10px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.2, marginBottom: 4 }}>
            Build something amazing
          </div>
          <div style={{ fontSize: 7, color: '#6B7280', marginBottom: 8 }}>
            The modern platform for teams who move fast.
          </div>
          <div className="flex justify-center" style={{ gap: 5 }}>
            <span style={{ fontSize: 6.5, color: '#fff', background: c[0], padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>Start Free Trial</span>
            <span style={{ fontSize: 6.5, color: c[1], border: `1px solid ${c[1]}`, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Watch Demo</span>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3" style={{ gap: 5, marginBottom: 8 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} style={{ ...card, padding: 6 }}>
              <FeatureIcon type={f.icon} color={c[i % c.length]} />
              <div style={{ fontSize: 7, fontWeight: 700, color: '#111827', marginTop: 4, marginBottom: 2 }}>{f.title}</div>
              <div style={{ fontSize: 5.5, color: '#9CA3AF', lineHeight: 1.3 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="flex justify-around" style={{ background: '#F9FAFB', borderRadius: 6, padding: '5px 0', marginBottom: 6 }}>
          {[{ n: '10K+', l: 'Users' }, { n: '99.9%', l: 'Uptime' }, { n: '24/7', l: 'Support' }].map(s => (
            <div key={s.l} className="text-center">
              <div style={{ fontSize: 8, fontWeight: 800, color: c[0] }}>{s.n}</div>
              <div style={{ fontSize: 5, color: '#9CA3AF' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between" style={{ borderTop: '1px solid #F3F4F6', paddingTop: 4 }}>
          <span style={{ fontSize: 5, color: '#D1D5DB' }}>© 2026 YourBrand</span>
          <div className="flex" style={{ gap: 6 }}>
            {['Privacy', 'Terms', 'Contact'].map(t => (
              <span key={t} style={{ fontSize: 5, color: '#D1D5DB' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                         */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { label: 'Dashboard', active: true },
  { label: 'Analytics', active: false },
  { label: 'Projects', active: false },
  { label: 'Settings', active: false },
  { label: 'Users', active: false },
]

const STATS = [
  { label: 'Revenue', value: '$12,450', change: '+12%', changeColor: '#16A34A' },
  { label: 'Users', value: '1,284', change: '+8%', changeColor: '#2563EB' },
  { label: 'Tasks', value: '43', change: '+5%', changeColor: '#F59E0B' },
]

const CHART_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CHART_VALS = [0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.35]

const ACTIVITY = [
  { text: 'Task completed', time: '2m ago' },
  { text: 'New user signup', time: '8m ago' },
  { text: 'Payment received', time: '14m ago' },
  { text: 'Report generated', time: '22m ago' },
]

export function DashboardMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <BrowserChrome>
      <div className="flex" style={{ ...fs, minHeight: 260 }}>
        {/* Sidebar */}
        <div className="shrink-0 flex flex-col" style={{ width: 64, background: c[0], padding: '8px 5px' }}>
          <div style={{ fontSize: 8, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 10, opacity: 0.9 }}>App</div>
          {NAV_ITEMS.map(item => (
            <div
              key={item.label}
              className="flex items-center"
              style={{
                padding: '4px 5px',
                borderRadius: 4,
                marginBottom: 2,
                background: item.active ? 'rgba(255,255,255,0.2)' : 'transparent',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.4)', marginRight: 4, flexShrink: 0 }} />
              <span style={{ fontSize: 5.5, color: '#fff', opacity: item.active ? 1 : 0.6, fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1" style={{ padding: 8 }}>
          {/* Top bar */}
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#111827' }}>Good morning</span>
            <div className="flex items-center" style={{ gap: 5 }}>
              <div style={{ width: 50, height: 12, borderRadius: 4, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', paddingLeft: 3 }}>
                <span style={{ fontSize: 5, color: '#D1D5DB' }}>Search...</span>
              </div>
              <div className="relative">
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: c[1] || '#6B7280' }} />
                <div style={{ position: 'absolute', top: -1, right: -1, width: 5, height: 5, borderRadius: '50%', background: '#EF4444', border: '1px solid #fff' }} />
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3" style={{ gap: 4, marginBottom: 6 }}>
            {STATS.map((s) => (
              <div key={s.label} style={{ ...card, padding: 5 }}>
                <div style={{ fontSize: 5, color: '#9CA3AF', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#111827' }}>{s.value}</div>
                <div className="flex items-center" style={{ marginTop: 1 }}>
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke={s.changeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                  <span style={{ fontSize: 5, color: s.changeColor, fontWeight: 600, marginLeft: 1 }}>{s.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ ...card, padding: 5, marginBottom: 6 }}>
            <div style={{ fontSize: 6, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Weekly Overview</div>
            <div className="flex items-end" style={{ height: 36, gap: 3 }}>
              {CHART_VALS.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${h * 100}%`,
                      background: `linear-gradient(180deg, ${c[i % c.length]}, ${c[(i + 1) % c.length]}88)`,
                      borderRadius: '2px 2px 0 0',
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex" style={{ gap: 3, marginTop: 2 }}>
              {CHART_DAYS.map(d => (
                <div key={d} className="flex-1 text-center" style={{ fontSize: 4.5, color: '#9CA3AF' }}>{d}</div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div style={{ ...card, padding: 5 }}>
            <div style={{ fontSize: 6, fontWeight: 600, color: '#374151', marginBottom: 3 }}>Recent Activity</div>
            {ACTIVITY.map((a, i) => (
              <div
                key={a.text}
                className="flex items-center justify-between"
                style={{ padding: '2.5px 0', borderTop: i > 0 ? '1px solid #F3F4F6' : undefined }}
              >
                <div className="flex items-center" style={{ gap: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: c[i % c.length] }} />
                  <span style={{ fontSize: 5.5, color: '#374151' }}>{a.text}</span>
                </div>
                <span style={{ fontSize: 4.5, color: '#D1D5DB' }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}

/* ------------------------------------------------------------------ */
/*  Mobile app                                                        */
/* ------------------------------------------------------------------ */

const TRANSACTIONS = [
  { name: 'Netflix Subscription', amount: '-$14.99' },
  { name: 'Coffee Shop', amount: '-$4.50' },
  { name: 'Transfer to Alex', amount: '-$50.00' },
]

const QUICK_ACTIONS = ['Send', 'Receive', 'Pay', 'More']

export function MobileAppMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <div className="mx-auto" style={{ width: 170, ...fs }}>
      <div className="overflow-hidden" style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.12)', border: '2px solid #E5E7EB' }}>
        {/* Status bar */}
        <div className="flex items-center justify-between" style={{ background: c[0], padding: '3px 10px' }}>
          <span style={{ fontSize: 6, color: '#fff', fontWeight: 600, opacity: 0.9 }}>9:41</span>
          <div className="flex items-center" style={{ gap: 3 }}>
            {/* signal */}
            <svg width="8" height="6" viewBox="0 0 16 12" fill="#fff" opacity="0.7"><rect x="0" y="8" width="3" height="4" rx="0.5" /><rect x="4.5" y="5" width="3" height="7" rx="0.5" /><rect x="9" y="2" width="3" height="10" rx="0.5" /><rect x="13.5" y="0" width="2.5" height="12" rx="0.5" /></svg>
            {/* wifi */}
            <svg width="8" height="6" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="0.5" fill="#fff" /></svg>
            {/* battery */}
            <svg width="12" height="6" viewBox="0 0 28 13" fill="none" opacity="0.7"><rect x="0.5" y="0.5" width="23" height="12" rx="2" stroke="#fff" strokeWidth="1" /><rect x="24.5" y="3.5" width="3" height="6" rx="1" fill="#fff" /><rect x="2" y="2" width="18" height="9" rx="1" fill="#fff" /></svg>
          </div>
        </div>

        {/* Notch */}
        <div style={{ background: c[0], display: 'flex', justifyContent: 'center', paddingBottom: 2 }}>
          <div style={{ width: 40, height: 4, borderRadius: 4, background: 'rgba(0,0,0,0.15)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between" style={{ background: c[0], padding: '4px 10px 8px' }}>
          <div className="flex items-center" style={{ gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>Home</span>
          </div>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
        </div>

        {/* Featured card */}
        <div style={{ margin: '6px 8px', borderRadius: 8, padding: '8px 10px', background: `linear-gradient(135deg, ${c[0]}, ${c[1] || c[0]})` }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#fff', marginBottom: 2 }}>Weekly Report</div>
          <div style={{ fontSize: 5.5, color: 'rgba(255,255,255,0.8)' }}>View your progress</div>
        </div>

        {/* Quick actions */}
        <div className="flex justify-around" style={{ padding: '6px 10px' }}>
          {QUICK_ACTIONS.map((a, i) => (
            <div key={a} className="flex flex-col items-center" style={{ gap: 2 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${c[i % c.length]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c[i % c.length] }} />
              </div>
              <span style={{ fontSize: 5, color: '#6B7280' }}>{a}</span>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div style={{ padding: '2px 8px 4px' }}>
          <div style={{ fontSize: 6.5, fontWeight: 700, color: '#111827', marginBottom: 3 }}>Transactions</div>
          {TRANSACTIONS.map((t, i) => (
            <div
              key={t.name}
              className="flex items-center justify-between"
              style={{ padding: '3.5px 0', borderTop: i > 0 ? '1px solid #F3F4F6' : undefined }}
            >
              <div className="flex items-center" style={{ gap: 4 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: `${c[i % c.length]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: c[i % c.length] }} />
                </div>
                <span style={{ fontSize: 5.5, color: '#374151' }}>{t.name}</span>
              </div>
              <span style={{ fontSize: 5.5, fontWeight: 600, color: '#111827' }}>{t.amount}</span>
            </div>
          ))}
        </div>

        {/* Bottom tab bar */}
        <div className="flex items-center justify-around" style={{ borderTop: '1px solid #F3F4F6', padding: '4px 0 5px' }}>
          {['Home', 'Search', 'Wallet', 'Profile'].map((tab, i) => (
            <div key={tab} className="flex flex-col items-center" style={{ gap: 1 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: i === 0 ? c[0] : '#D1D5DB' }} />
              <span style={{ fontSize: 4.5, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? c[0] : '#9CA3AF' }}>{tab}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
