import type { PreviewPalette } from '@/lib/previewColors'

export function DashboardPreview({ p }: { p: PreviewPalette }) {
  const bars = [65, 40, 80, 55, 90, 45, 70, 50, 85, 60, 42, 75]

  const sidebarItems = [
    { label: 'Overview', active: true, icon: 'grid' },
    { label: 'Analytics', active: false, icon: 'chart' },
    { label: 'Customers', active: false, icon: 'users' },
    { label: 'Products', active: false, icon: 'box' },
    { label: 'Settings', active: false, icon: 'gear' },
  ]

  const stats = [
    { label: 'Revenue', value: '$12,450', change: '+12.5%', up: true, color: p.all[0] },
    { label: 'Customers', value: '2,847', change: '+8.2%', up: true, color: p.all[1 % p.all.length] },
    { label: 'Active', value: '1,203', change: '+3.1%', up: true, color: p.all[2 % p.all.length] },
    { label: 'Churn', value: '2.1%', change: '-0.4%', up: false, color: p.all[3 % p.all.length] || p.accent },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui)', display: 'flex', minHeight: 520, backgroundColor: p.surface }}>
      {/* Sidebar */}
      <aside style={{ width: 180, backgroundColor: p.darkest, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 20 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: p.primary }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: p.onDarkest }}>Acme</span>
        </div>
        {sidebarItems.map(item => (
          <div
            key={item.label}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: item.active ? 600 : 400,
              color: item.active ? p.onPrimary : `${p.onDarkest}99`,
              backgroundColor: item.active ? p.primary : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            {/* Sidebar icon */}
            {item.icon === 'grid' && (
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <rect x="0" y="0" width="6" height="6" rx="1.5" fill={item.active ? p.onPrimary : `${p.onDarkest}60`} />
                <rect x="8" y="0" width="6" height="6" rx="1.5" fill={item.active ? p.onPrimary : `${p.onDarkest}60`} />
                <rect x="0" y="8" width="6" height="6" rx="1.5" fill={item.active ? p.onPrimary : `${p.onDarkest}60`} />
                <rect x="8" y="8" width="6" height="6" rx="1.5" fill={item.active ? p.onPrimary : `${p.onDarkest}60`} />
              </svg>
            )}
            {item.icon === 'chart' && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={item.active ? p.onPrimary : `${p.onDarkest}60`} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <polyline points="1,10 4,6 7,8 13,2" />
              </svg>
            )}
            {item.icon === 'users' && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill={item.active ? p.onPrimary : `${p.onDarkest}60`} aria-hidden="true">
                <circle cx="5" cy="4" r="2.5" />
                <path d="M0.5 12.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
                <circle cx="10" cy="4.5" r="2" opacity="0.5" />
              </svg>
            )}
            {item.icon === 'box' && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={item.active ? p.onPrimary : `${p.onDarkest}60`} strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
                <rect x="1" y="3" width="12" height="10" rx="2" />
                <path d="M1 6h12" />
              </svg>
            )}
            {item.icon === 'gear' && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={item.active ? p.onPrimary : `${p.onDarkest}60`} strokeWidth="1.5" aria-hidden="true">
                <circle cx="7" cy="7" r="2.5" />
                <circle cx="7" cy="7" r="5.5" strokeDasharray="2 2.5" />
              </svg>
            )}
            {item.label}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, color: `${p.onDarkest}60` }}>
          Sign out
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <header style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#ffffff' }}>
          <div style={{ width: 200, height: 32, borderRadius: 8, backgroundColor: p.surface, border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke={p.textMuted} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="6" cy="6" r="5" />
              <line x1="10" y1="10" x2="13" y2="13" />
            </svg>
            <span style={{ fontSize: 12, color: p.textMuted }}>Search…</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Notification bell */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={p.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 1.5a4 4 0 0 1 4 4v3l1.5 2H2.5L4 8.5v-3a4 4 0 0 1 4-4z" />
              <path d="M6 13.5a2 2 0 0 0 4 0" />
            </svg>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: p.secondary, opacity: 0.7 }} />
          </div>
        </header>

        {/* Content area */}
        <div style={{ flex: 1, padding: 24, overflow: 'hidden' }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 10, backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: p.textMuted, marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: p.textDark }}>{stat.value}</div>
                {/* Trend indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    {stat.up ? (
                      <path d="M6 2L10 7H2L6 2Z" fill="#22c55e" />
                    ) : (
                      <path d="M6 10L2 5H10L6 10Z" fill="#22c55e" />
                    )}
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#22c55e' }}>{stat.change}</span>
                </div>
                <div style={{ width: '100%', height: 3, borderRadius: 2, backgroundColor: `${stat.color}20`, marginTop: 8 }}>
                  <div style={{ width: `${50 + i * 12}%`, height: '100%', borderRadius: 2, backgroundColor: stat.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)', padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: p.textDark }}>Revenue</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['Week', 'Month', 'Year'].map((tab, i) => (
                  <span key={tab} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, backgroundColor: i === 1 ? p.primaryTint : 'transparent', color: i === 1 ? p.primary : p.textMuted, fontWeight: i === 1 ? 600 : 400 }}>
                    {tab}
                  </span>
                ))}
              </div>
            </div>
            {/* Chart area with grid lines */}
            <div style={{ position: 'relative', height: 100 }}>
              {/* Horizontal grid lines */}
              {[0, 25, 50, 75, 100].map(y => (
                <div
                  key={y}
                  style={{
                    position: 'absolute',
                    left: 0, right: 0,
                    bottom: `${y}%`,
                    height: 1,
                    backgroundColor: 'rgba(0,0,0,0.04)',
                  }}
                />
              ))}
              {/* Bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: '100%', position: 'relative' }}>
                {bars.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      borderRadius: '4px 4px 0 0',
                      backgroundColor: p.all[i % p.all.length],
                      opacity: 0.75,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: 11, fontWeight: 600, color: p.textMuted }}>
              <span style={{ flex: 2 }}>Customer</span>
              <span style={{ flex: 1 }}>Plan</span>
              <span style={{ flex: 1 }}>MRR</span>
              <span style={{ flex: 1 }}>Status</span>
            </div>
            {[
              { name: 'Linear', plan: 'Enterprise', mrr: '$2,400', status: 'Active', color: p.all[0] },
              { name: 'Vercel', plan: 'Growth', mrr: '$1,200', status: 'Active', color: p.all[1 % p.all.length] },
              { name: 'Stripe', plan: 'Pro', mrr: '$800', status: 'Churned', color: p.all[2 % p.all.length] },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', padding: '10px 16px', borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.04)' : 'none', fontSize: 12, alignItems: 'center' }}>
                <span style={{ flex: 2, fontWeight: 500, color: p.textDark }}>{row.name}</span>
                <span style={{ flex: 1, color: p.textMuted }}>{row.plan}</span>
                <span style={{ flex: 1, fontWeight: 600, color: p.textDark }}>{row.mrr}</span>
                <span style={{ flex: 1 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                    backgroundColor: `${row.color}15`, color: row.color,
                  }}>
                    {row.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
