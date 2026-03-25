import type { PreviewPalette } from '@/lib/previewColors'

export function LandingPreview({ p }: { p: PreviewPalette }) {
  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui)', backgroundColor: '#ffffff', minHeight: 600 }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 56, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: p.primary }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: p.textDark }}>Paletta</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: p.textMuted, cursor: 'pointer' }}>Features</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: p.textMuted, cursor: 'pointer' }}>Pricing</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: p.textMuted, cursor: 'pointer' }}>Blog</span>
          <button style={{ height: 34, padding: '0 18px', borderRadius: 8, backgroundColor: p.primary, color: p.onPrimary, fontSize: 13, fontWeight: 600, border: 'none' }}>
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        padding: '56px 32px 48px', textAlign: 'center',
        background: `linear-gradient(180deg, ${p.primaryTint} 0%, #ffffff 100%)`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.035,
          backgroundImage: `radial-gradient(${p.primary} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, backgroundColor: `${p.primary}10`, fontSize: 12, fontWeight: 600, color: p.primary, marginBottom: 20, border: `1px solid ${p.primary}20` }}>
            Trusted by 10,000+ teams
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: p.textDark, lineHeight: 1.15, margin: '0 0 14px', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            Ship faster with tools built for modern teams
          </h1>
          <p style={{ fontSize: 15, color: p.textMuted, lineHeight: 1.6, margin: '0 0 28px', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
            Everything you need to go from idea to production. Simple, fast, and reliable.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button style={{ height: 42, padding: '0 28px', borderRadius: 8, backgroundColor: p.primary, color: p.onPrimary, fontSize: 14, fontWeight: 600, border: 'none', boxShadow: `0 4px 14px ${p.primary}30` }}>
              Get started free
            </button>
            <button style={{ height: 42, padding: '0 24px', borderRadius: 8, backgroundColor: 'transparent', color: p.textDark, fontSize: 14, fontWeight: 500, border: `1.5px solid ${p.darkest}18` }}>
              See demo →
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '8px 32px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 720, margin: '0 auto' }}>
          {[
            { title: 'Built for scale', desc: 'Handle millions of requests with zero config or maintenance.', color: p.all[0], icon: 'grid' },
            { title: 'Real-time sync', desc: 'Instant updates across every device and user, everywhere.', color: p.all[1 % p.all.length], icon: 'bolt' },
            { title: 'Enterprise ready', desc: 'SOC 2, SSO, and audit logs out of the box.', color: p.all[2 % p.all.length], icon: 'shield' },
          ].map((f, i) => (
            <div key={i} style={{ padding: 20, borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#ffffff' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: `${f.color}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                {f.icon === 'grid' && (
                  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <rect x="1" y="1" width="6" height="6" rx="1.5" fill={f.color} opacity="0.8" />
                    <rect x="11" y="1" width="6" height="6" rx="1.5" fill={f.color} opacity="0.5" />
                    <rect x="1" y="11" width="6" height="6" rx="1.5" fill={f.color} opacity="0.5" />
                    <rect x="11" y="11" width="6" height="6" rx="1.5" fill={f.color} opacity="0.8" />
                  </svg>
                )}
                {f.icon === 'bolt' && (
                  <svg width="16" height="18" viewBox="0 0 16 18" fill={f.color} opacity="0.8" aria-hidden="true">
                    <path d="M9 0L0 10h6.5L5 18l11-10H9.5z" />
                  </svg>
                )}
                {f.icon === 'shield' && (
                  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" stroke={f.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" aria-hidden="true">
                    <path d="M8 1L1 4v5c0 4.5 3.5 7.5 7 8.5 3.5-1 7-4 7-8.5V4z" />
                    <path d="M5.5 9l2 2 3.5-4" />
                  </svg>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: p.textDark, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: p.textMuted, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '28px 32px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          {[
            { num: '10,000+', label: 'Teams' },
            { num: '50M+', label: 'Colors generated' },
            { num: '4.9/5', label: 'Rating' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 26, fontWeight: 800, color: p.primary }}>{s.num}</div>
              <div style={{ fontSize: 12, color: p.textMuted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section style={{ padding: '0 32px 32px' }}>
        <div style={{
          maxWidth: 520, margin: '0 auto', padding: '28px 32px',
          borderRadius: 14, backgroundColor: `${p.all[0]}0D`,
        }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: p.primary, lineHeight: 0.8, marginBottom: 10 }}>&ldquo;</div>
          <p style={{ fontSize: 14, color: p.textDark, lineHeight: 1.7, margin: '0 0 18px' }}>
            Paletta changed how our team handles color systems. We ship twice as fast.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: p.accent }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: p.textDark }}>Sarah Chen</div>
              <div style={{ fontSize: 11, color: p.textMuted }}>Design Lead at Linear</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <span style={{ fontSize: 12, color: p.textMuted }}>© 2026 Paletta Inc.</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <span style={{ fontSize: 12, color: p.textMuted }}>Privacy</span>
          <span style={{ fontSize: 12, color: p.textMuted }}>Terms</span>
          <span style={{ fontSize: 12, color: p.textMuted }}>Contact</span>
        </div>
      </footer>
    </div>
  )
}
