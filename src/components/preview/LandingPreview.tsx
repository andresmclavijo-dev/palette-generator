import type { PreviewPalette } from '@/lib/previewColors'

export function LandingPreview({ p }: { p: PreviewPalette }) {
  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui)', backgroundColor: '#ffffff', minHeight: 520 }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 56, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: p.primary }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: p.textDark }}>Acme</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontSize: 13, color: p.textMuted }}>Features</span>
          <span style={{ fontSize: 13, color: p.textMuted }}>Pricing</span>
          <span style={{ fontSize: 13, color: p.textMuted }}>Blog</span>
          <button style={{ height: 32, padding: '0 16px', borderRadius: 8, backgroundColor: p.primary, color: p.onPrimary, fontSize: 13, fontWeight: 600, border: 'none' }}>
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '56px 32px 48px', textAlign: 'center', background: `linear-gradient(180deg, ${p.primaryTint} 0%, #ffffff 100%)` }}>
        <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, backgroundColor: p.primaryTint, fontSize: 12, fontWeight: 600, color: p.primary, marginBottom: 16, border: `1px solid ${p.primary}22` }}>
          Trusted by 10,000+ teams
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: p.textDark, lineHeight: 1.2, margin: '0 0 12px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          Ship faster with tools built for modern teams
        </h1>
        <p style={{ fontSize: 15, color: p.textMuted, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
          Everything you need to go from idea to production. Simple, fast, and reliable.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button style={{ height: 40, padding: '0 24px', borderRadius: 8, backgroundColor: p.primary, color: p.onPrimary, fontSize: 14, fontWeight: 600, border: 'none' }}>
            Get started free
          </button>
          <button style={{ height: 40, padding: '0 24px', borderRadius: 8, backgroundColor: 'transparent', color: p.textDark, fontSize: 14, fontWeight: 500, border: `1.5px solid ${p.darkest}20` }}>
            See demo
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '0 32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 720, margin: '0 auto' }}>
          {[
            { title: 'Built for scale', desc: 'Handle millions of requests with zero config.', color: p.all[0] },
            { title: 'Real-time sync', desc: 'Instant updates across every device and user.', color: p.all[1 % p.all.length] },
            { title: 'Enterprise ready', desc: 'SOC 2, SSO, and audit logs out of the box.', color: p.all[2 % p.all.length] },
          ].map((f, i) => (
            <div key={i} style={{ padding: 20, borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#ffffff' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, backgroundColor: f.color, opacity: 0.8 }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: p.textDark, marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: p.textMuted, lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '32px 32px', backgroundColor: p.darkest }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          {[
            { num: '300+', label: 'Integrations' },
            { num: '50M+', label: 'API calls / day' },
            { num: '99.9%', label: 'Uptime SLA' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 24, fontWeight: 800, color: p.primary }}>{s.num}</div>
              <div style={{ fontSize: 12, color: p.onDarkest, opacity: 0.6, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <span style={{ fontSize: 12, color: p.textMuted }}>© 2026 Acme Inc.</span>
        <div style={{ display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 12, color: p.textMuted }}>Privacy</span>
          <span style={{ fontSize: 12, color: p.textMuted }}>Terms</span>
          <span style={{ fontSize: 12, color: p.textMuted }}>Contact</span>
        </div>
      </footer>
    </div>
  )
}
