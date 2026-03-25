import type { PreviewPalette } from '@/lib/previewColors'

export function DashboardPreview({ p }: { p: PreviewPalette }) {
  const bars = [65, 40, 80, 55, 90, 45, 70, 50, 85, 60, 42, 75]

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui)', display: 'flex', minHeight: 520, backgroundColor: p.surface }}>
      {/* Sidebar */}
      <aside style={{ width: 180, backgroundColor: p.darkest, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 20 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: p.primary }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: p.onDarkest }}>Acme</span>
        </div>
        {[
          { label: 'Overview', active: true },
          { label: 'Analytics', active: false },
          { label: 'Customers', active: false },
          { label: 'Products', active: false },
          { label: 'Settings', active: false },
        ].map(item => (
          <div
            key={item.label}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: item.active ? 600 : 400,
              color: item.active ? p.onPrimary : `${p.onDarkest}99`,
              backgroundColor: item.active ? p.primary : 'transparent',
            }}
          >
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
          <div style={{ width: 200, height: 32, borderRadius: 8, backgroundColor: p.surface, border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', padding: '0 10px' }}>
            <span style={{ fontSize: 12, color: p.textMuted }}>Search…</span>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: p.secondary, opacity: 0.7 }} />
        </header>

        {/* Content area */}
        <div style={{ flex: 1, padding: 24, overflow: 'hidden' }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Revenue', value: '$12,450', color: p.all[0] },
              { label: 'Customers', value: '2,847', color: p.all[1 % p.all.length] },
              { label: 'Active', value: '1,203', color: p.all[2 % p.all.length] },
              { label: 'Churn', value: '2.1%', color: p.all[3 % p.all.length] || p.accent },
            ].map((stat, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 10, backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: p.textMuted, marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: p.textDark }}>{stat.value}</div>
                <div style={{ width: '100%', height: 3, borderRadius: 2, backgroundColor: `${stat.color}20`, marginTop: 10 }}>
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
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
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
