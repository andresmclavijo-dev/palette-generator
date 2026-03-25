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
            {/* Signal bars */}
            <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
              <rect x="0" y="7" width="2.5" height="3" rx="0.5" fill={p.onPrimary} opacity="0.9" />
              <rect x="3.5" y="5" width="2.5" height="5" rx="0.5" fill={p.onPrimary} opacity="0.9" />
              <rect x="7" y="3" width="2.5" height="7" rx="0.5" fill={p.onPrimary} opacity="0.9" />
              <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" fill={p.onPrimary} opacity="0.4" />
            </svg>
            {/* Wifi */}
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke={p.onPrimary} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <path d="M1 3.5C3.5 1 10.5 1 13 3.5" opacity="0.5" />
              <path d="M3 5.5C4.8 4 9.2 4 11 5.5" opacity="0.7" />
              <path d="M5 7.5C6 7 8 7 9 7.5" opacity="0.9" />
              <circle cx="7" cy="9" r="1" fill={p.onPrimary} stroke="none" />
            </svg>
            {/* Battery */}
            <svg width="22" height="10" viewBox="0 0 22 10" aria-hidden="true">
              <rect x="0" y="0" width="18" height="10" rx="2.5" fill="none" stroke={p.onPrimary} strokeWidth="1.2" opacity="0.6" />
              <rect x="2" y="2" width="11" height="6" rx="1" fill={p.onPrimary} opacity="0.6" />
              <rect x="19" y="3" width="2" height="4" rx="1" fill={p.onPrimary} opacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Nav header */}
        <div style={{
          padding: '12px 20px 16px', backgroundColor: p.primary,
          borderRadius: '0 0 20px 20px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
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
            <div style={{ height: 90, backgroundColor: p.secondary, opacity: 0.8, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Image placeholder icon */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={p.onPrimary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="3" />
                <circle cx="8.5" cy="8.5" r="2" />
                <path d="M22 15l-5-5L2 22" />
              </svg>
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
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: p.all[2 % p.all.length], opacity: 0.7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={p.onPrimary} strokeWidth="1.5" opacity="0.5" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="3" />
                <circle cx="8.5" cy="8.5" r="2" />
                <path d="M22 15l-5-5L2 22" />
              </svg>
            </div>
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
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: p.all[3 % p.all.length] || p.accent, opacity: 0.7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={p.onPrimary} strokeWidth="1.5" opacity="0.5" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="3" />
                <circle cx="8.5" cy="8.5" r="2" />
                <path d="M22 15l-5-5L2 22" />
              </svg>
            </div>
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
            { label: 'Home', active: true, icon: 'home' },
            { label: 'Search', active: false, icon: 'search' },
            { label: 'Library', active: false, icon: 'library' },
            { label: 'Profile', active: false, icon: 'profile' },
          ].map(tab => (
            <div key={tab.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {tab.icon === 'home' && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={tab.active ? p.primary : p.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={tab.active ? 1 : 0.5} aria-hidden="true">
                  <path d="M3 8l7-5 7 5v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8z" />
                  <path d="M8 17V11h4v6" />
                </svg>
              )}
              {tab.icon === 'search' && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={tab.active ? p.primary : p.textMuted} strokeWidth="1.5" strokeLinecap="round" opacity={tab.active ? 1 : 0.5} aria-hidden="true">
                  <circle cx="8.5" cy="8.5" r="5.5" />
                  <line x1="13" y1="13" x2="17" y2="17" />
                </svg>
              )}
              {tab.icon === 'library' && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={tab.active ? p.primary : p.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={tab.active ? 1 : 0.5} aria-hidden="true">
                  <rect x="3" y="3" width="6" height="6" rx="1" />
                  <rect x="11" y="3" width="6" height="6" rx="1" />
                  <rect x="3" y="11" width="6" height="6" rx="1" />
                  <rect x="11" y="11" width="6" height="6" rx="1" />
                </svg>
              )}
              {tab.icon === 'profile' && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={tab.active ? p.primary : p.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={tab.active ? 1 : 0.5} aria-hidden="true">
                  <circle cx="10" cy="7" r="3.5" />
                  <path d="M3 17.5c0-3 3.5-5.5 7-5.5s7 2.5 7 5.5" />
                </svg>
              )}
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
