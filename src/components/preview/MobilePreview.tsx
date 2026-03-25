import type { PreviewPalette } from '@/lib/previewColors'

export function MobilePreview({ p }: { p: PreviewPalette }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 16px' }}>
      {/* Phone frame */}
      <div style={{
        width: 280,
        height: 580,
        borderRadius: 36,
        border: '8px solid #1a1a2e',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans, system-ui)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        position: 'relative',
      }}>
        {/* Notch */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 100, height: 24, borderRadius: '0 0 16px 16px', backgroundColor: '#1a1a2e', zIndex: 10,
        }} />

        {/* Status bar */}
        <div style={{
          height: 44, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          padding: '0 20px 6px', backgroundColor: p.primary, position: 'relative',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: p.onPrimary }}>9:41</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ width: 14, height: 10, borderRadius: 2, border: `1.5px solid ${p.onPrimary}`, opacity: 0.6 }} />
            <div style={{ width: 20, height: 10, borderRadius: 3, border: `1.5px solid ${p.onPrimary}`, opacity: 0.6, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 2, top: 2, bottom: 2, right: 5, borderRadius: 1, backgroundColor: p.onPrimary, opacity: 0.6 }} />
            </div>
          </div>
        </div>

        {/* Nav header */}
        <div style={{
          padding: '12px 20px 16px', backgroundColor: p.primary,
          borderRadius: '0 0 20px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: p.onPrimary }}>Discover</span>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: `${p.onPrimary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: p.onPrimary, opacity: 0.7 }} />
            </div>
          </div>
          {/* Pill tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            {['Trending', 'For You', 'New'].map((tab, i) => (
              <span key={tab} style={{
                fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 20,
                backgroundColor: i === 0 ? p.onPrimary : `${p.onPrimary}20`,
                color: i === 0 ? p.primary : `${p.onPrimary}CC`,
              }}>
                {tab}
              </span>
            ))}
          </div>
        </div>

        {/* Content cards */}
        <div style={{ flex: 1, padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'hidden' }}>
          {/* Card 1 — featured */}
          <div style={{
            borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ height: 90, backgroundColor: p.secondary, opacity: 0.8, position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  backgroundColor: p.accent, color: p.onPrimary,
                }}>
                  Featured
                </span>
              </div>
            </div>
            <div style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: p.textDark, marginBottom: 3 }}>Getting started with design systems</div>
              <div style={{ fontSize: 11, color: p.textMuted }}>A practical guide for teams</div>
            </div>
          </div>

          {/* Card 2 — list item */}
          <div style={{
            display: 'flex', gap: 12, padding: 12, borderRadius: 14,
            border: '1px solid rgba(0,0,0,0.06)', alignItems: 'center',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: p.all[2 % p.all.length], opacity: 0.7, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: p.textDark }}>Color theory basics</div>
              <div style={{ fontSize: 11, color: p.textMuted, marginTop: 2 }}>12 min read · Saved</div>
            </div>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: p.primary }} />
          </div>

          {/* Card 3 — list item */}
          <div style={{
            display: 'flex', gap: 12, padding: 12, borderRadius: 14,
            border: '1px solid rgba(0,0,0,0.06)', alignItems: 'center',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: p.all[3 % p.all.length] || p.accent, opacity: 0.7, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: p.textDark }}>Accessible palettes</div>
              <div style={{ fontSize: 11, color: p.textMuted, marginTop: 2 }}>8 min read</div>
            </div>
          </div>
        </div>

        {/* FAB */}
        <div style={{
          position: 'absolute', bottom: 68, right: 20,
          width: 48, height: 48, borderRadius: '50%',
          backgroundColor: p.primary, boxShadow: `0 4px 16px ${p.primary}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={p.onPrimary} strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>

        {/* Tab bar */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          borderTop: '1px solid rgba(0,0,0,0.06)', padding: '0 8px', backgroundColor: '#ffffff',
        }}>
          {[
            { label: 'Home', active: true },
            { label: 'Search', active: false },
            { label: 'Library', active: false },
            { label: 'Settings', active: false },
          ].map(tab => (
            <div key={tab.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6,
                backgroundColor: tab.active ? p.primary : 'rgba(0,0,0,0.08)',
                opacity: tab.active ? 1 : 0.4,
              }} />
              <span style={{ fontSize: 9, fontWeight: tab.active ? 700 : 400, color: tab.active ? p.primary : p.textMuted }}>
                {tab.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
