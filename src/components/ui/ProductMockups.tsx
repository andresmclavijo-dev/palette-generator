/**
 * Premium Dribbble-quality product mockups used by PreviewPanel and ProUpgradeModal.
 * Each mockup takes a `colors` array (hex strings) and renders a detailed miniature UI
 * with real text, typography, charts, avatars, and decorative elements.
 */

export const MOCKUP_TABS = ['Landing Page', 'Dashboard', 'Mobile App'] as const
export type MockupTab = (typeof MOCKUP_TABS)[number]

export const FALLBACK_COLORS = ['#6C47FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

export const TAB_CAPTIONS: Record<MockupTab, string> = {
  'Landing Page': 'Your colors in a real landing page →',
  'Dashboard': 'Your colors in a real dashboard →',
  'Mobile App': 'Your colors in a real mobile app →',
}

const fs = { fontFamily: 'system-ui, -apple-system, sans-serif' } as const
const cardBase = (shadow = true) => ({
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius: 10,
  background: '#fff',
  ...(shadow ? { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } : {}),
}) as const

/* ------------------------------------------------------------------ */
/*  Browser chrome wrapper                                            */
/* ------------------------------------------------------------------ */

export function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: '#FAFAFA', borderBottom: '1px solid #F3F4F6' }}>
        <div className="flex gap-1.5">
          <div className="w-[7px] h-[7px] rounded-full" style={{ background: '#FF5F57' }} />
          <div className="w-[7px] h-[7px] rounded-full" style={{ background: '#FFBD2E' }} />
          <div className="w-[7px] h-[7px] rounded-full" style={{ background: '#28C840' }} />
        </div>
        <div className="flex-1 mx-4 h-5 rounded-md flex items-center justify-center" style={{ background: '#F3F4F6' }}>
          <span style={{ fontSize: 8, color: '#9CA3AF', ...fs }}>prodmast.com</span>
        </div>
      </div>
      <div className="relative overflow-hidden">
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Landing Page — Premium SaaS                                       */
/* ------------------------------------------------------------------ */

function FloatingIcon({ x, y, rotate, color, children }: { x: string; y: string; rotate: number; color: string; children: React.ReactNode }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x, top: y, transform: `rotate(${rotate}deg)`,
        width: 24, height: 24, borderRadius: 8,
        background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </div>
  )
}

export function LandingMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <BrowserChrome>
      <div style={{ ...fs, padding: '12px 14px 10px', background: '#fff' }}>
        {/* Nav */}
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: c[0] }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>Prodmast</span>
          </div>
          <div className="flex items-center" style={{ gap: 10 }}>
            {['Home', 'About', 'Services', 'Contact'].map(t => (
              <span key={t} style={{ fontSize: 6.5, color: '#6B7280', fontWeight: 500 }}>{t}</span>
            ))}
            <span style={{ fontSize: 6.5, color: '#fff', background: c[0], padding: '3px 10px', borderRadius: 99, fontWeight: 600 }}>Sign Up</span>
          </div>
        </div>

        {/* Hero */}
        <div className="text-center relative" style={{ padding: '18px 10px 14px' }}>
          {/* Floating decorative icons */}
          <FloatingIcon x="4%" y="8%" rotate={-12} color={c[0]}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </FloatingIcon>
          <FloatingIcon x="88%" y="5%" rotate={15} color={c[1] || c[0]}>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </FloatingIcon>
          <FloatingIcon x="2%" y="65%" rotate={8} color={c[2] || c[0]}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
          </FloatingIcon>
          <FloatingIcon x="90%" y="60%" rotate={-8} color={c[3] || c[0]}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </FloatingIcon>
          <FloatingIcon x="15%" y="80%" rotate={20} color={c[4] || c[0]}>
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4" />
          </FloatingIcon>

          <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', lineHeight: 1.2, marginBottom: 2 }}>
            The Future of Design
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2, marginBottom: 6 }}>
            <span style={{ color: '#111827' }}>with </span>
            <span style={{ color: c[0] }}>Latest Technology</span>
          </div>
          <div style={{ fontSize: 7.5, color: '#6B7280', marginBottom: 12, lineHeight: 1.4 }}>
            Expert tech to elevate your business. Let&apos;s take your product further.
          </div>
          <div className="flex justify-center" style={{ gap: 6 }}>
            <span style={{ fontSize: 7, color: '#fff', background: c[0], padding: '4px 14px', borderRadius: 6, fontWeight: 600 }}>Get Started</span>
            <span style={{ fontSize: 7, color: c[0], border: `1.5px solid ${c[0]}`, padding: '3px 14px', borderRadius: 6, fontWeight: 600 }}>Try Demo</span>
          </div>
        </div>

        {/* Reviews */}
        <div className="flex items-center justify-center" style={{ gap: 4, marginBottom: 12, marginTop: 4 }}>
          <div className="flex" style={{ gap: 1 }}>
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="8" height="8" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span style={{ fontSize: 7, fontWeight: 700, color: '#111827' }}>5.0</span>
          <span style={{ fontSize: 6, color: '#9CA3AF' }}>from 80+ reviews</span>
        </div>

        {/* Stats */}
        <div className="flex justify-center" style={{ gap: 8, marginBottom: 10 }}>
          {[
            { num: '100+', label: 'Projects Delivered' },
            { num: '6+', label: 'Years of Experience' },
          ].map(s => (
            <div key={s.label} style={{ ...cardBase(), padding: '8px 16px', textAlign: 'center' as const }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: c[0] }}>{s.num}</div>
              <div style={{ fontSize: 5.5, color: '#9CA3AF', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between" style={{ borderTop: '1px solid #F3F4F6', paddingTop: 6 }}>
          <span style={{ fontSize: 5.5, color: '#D1D5DB' }}>© 2026 Prodmast</span>
          <div className="flex" style={{ gap: 8 }}>
            {['Privacy', 'Terms', 'Contact'].map(t => (
              <span key={t} style={{ fontSize: 5.5, color: '#D1D5DB' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}

/* ------------------------------------------------------------------ */
/*  Dashboard — Booking/Admin Panel                                   */
/* ------------------------------------------------------------------ */

const CALENDAR_DAYS = [
  [null, null, null, null, 1, 2, 3],
  [4, 5, 6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15, 16, 17],
  [18, 19, 20, 21, 22, 23, 24],
  [25, 26, 27, 28, 29, 30, 31],
]

export function DashboardMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <BrowserChrome>
      <div style={{ ...fs, background: '#F8F9FB' }}>
        {/* Top nav */}
        <div className="flex items-center justify-between" style={{ padding: '6px 10px', background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
          <div className="flex items-center" style={{ gap: 10 }}>
            <div className="flex items-center" style={{ gap: 3 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: c[0], clipPath: 'inset(0 50% 0 0)' }} />
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: c[0], marginLeft: -9 }} />
            </div>
            <span style={{ fontSize: 7, fontWeight: 600, color: c[0], borderBottom: `1.5px solid ${c[0]}`, paddingBottom: 1 }}>Overview</span>
            <span style={{ fontSize: 6.5, color: '#9CA3AF' }}>Reports</span>
          </div>
          <div className="flex items-center" style={{ gap: 6 }}>
            <div style={{ width: 60, height: 14, borderRadius: 6, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', paddingLeft: 4 }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <span style={{ fontSize: 5.5, color: '#D1D5DB', marginLeft: 3 }}>Search</span>
            </div>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
            <div className="relative">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              <div style={{ position: 'absolute', top: -1, right: -1, width: 4, height: 4, borderRadius: '50%', background: '#EF4444' }} />
            </div>
            <div className="flex items-center" style={{ gap: 3 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: c[1] || c[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 6, fontWeight: 700, color: '#fff' }}>T</span>
              </div>
              <div>
                <div style={{ fontSize: 5.5, fontWeight: 600, color: '#111827', lineHeight: 1 }}>Thomas Gepsan</div>
                <div style={{ fontSize: 4.5, color: '#9CA3AF', lineHeight: 1, marginTop: 1 }}>Super Admin</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex" style={{ minHeight: 280 }}>
          {/* Left main */}
          <div className="flex-1" style={{ padding: 10 }}>
            {/* Title + Manage */}
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#111827' }}>Main Dashboard</span>
              <span style={{ fontSize: 6, color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: 4 }}>Manage ▾</span>
            </div>

            {/* Tabs */}
            <div className="flex" style={{ gap: 10, marginBottom: 8, borderBottom: '1px solid #F3F4F6', paddingBottom: 4 }}>
              {['Booking', 'Amenities', 'Customization', 'Locality'].map((t, i) => (
                <span key={t} style={{ fontSize: 6, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? c[0] : '#9CA3AF', borderBottom: i === 0 ? `1.5px solid ${c[0]}` : 'none', paddingBottom: 2 }}>{t}</span>
              ))}
            </div>

            {/* Stats row */}
            <div className="flex" style={{ gap: 5, marginBottom: 6 }}>
              {/* Earnings card */}
              <div style={{ ...cardBase(), flex: 1, padding: 7 }}>
                <div style={{ fontSize: 5, color: '#9CA3AF', marginBottom: 2 }}>Today&apos;s Earning</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>$2890</div>
                <svg width="100%" height="16" viewBox="0 0 100 20" preserveAspectRatio="none" style={{ marginTop: 3 }} aria-hidden="true">
                  <path d={`M0,18 Q10,14 20,12 T40,8 T60,10 T80,4 T100,6`} fill="none" stroke={c[0]} strokeWidth="1.5" />
                  <path d={`M0,18 Q10,14 20,12 T40,8 T60,10 T80,4 T100,6 V20 H0Z`} fill={`${c[0]}15`} />
                </svg>
              </div>
              {/* Demographics */}
              <div style={{ ...cardBase(), width: 50, padding: 7, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', background: `${c[2] || c[0]}12` }}>
                <div style={{ fontSize: 5, color: '#9CA3AF', marginBottom: 1 }}>Demographics</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: c[2] || c[0] }}>20</div>
              </div>
              {/* Bookings + Balance */}
              <div style={{ ...cardBase(), flex: 1, padding: 7 }}>
                <div className="flex justify-between" style={{ marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 5, color: '#9CA3AF' }}>Today&apos;s Bookings</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#111827' }}>24</div>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontSize: 5, color: '#9CA3AF' }}>Total Balance</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#111827' }}>$2M</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Promo + Design meeting row */}
            <div className="flex" style={{ gap: 5, marginBottom: 6 }}>
              {/* Promo card */}
              <div style={{ flex: 1, borderRadius: 10, padding: '8px 10px', background: `linear-gradient(135deg, ${c[0]}, ${c[1] || c[0]})`, color: '#fff' }}>
                <div style={{ fontSize: 6, fontWeight: 700, marginBottom: 2 }}>20% OFF</div>
                <div style={{ fontSize: 5, opacity: 0.85, marginBottom: 4 }}>on your first booking</div>
                <div style={{ fontSize: 5, background: 'rgba(255,255,255,0.25)', display: 'inline-block', padding: '2px 6px', borderRadius: 4, fontWeight: 600, letterSpacing: '0.05em' }}>NEWBIE20</div>
              </div>
              {/* Design Meetings */}
              <div style={{ ...cardBase(), flex: 1, padding: 7 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
                  <span style={{ fontSize: 6, fontWeight: 700, color: '#111827' }}>Design Meetings</span>
                  <span style={{ fontSize: 5, color: '#fff', background: c[0], padding: '1px 5px', borderRadius: 99 }}>11 Min Left</span>
                </div>
                <div className="flex items-center" style={{ gap: -3, marginBottom: 3 }}>
                  {['A', 'B', 'C'].map((l, i) => (
                    <div key={l} style={{ width: 14, height: 14, borderRadius: '50%', background: c[i % c.length], border: '1.5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -4 : 0, position: 'relative' as const, zIndex: 3 - i }}>
                      <span style={{ fontSize: 5, fontWeight: 700, color: '#fff' }}>{l}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 5, color: '#fff', background: c[0], padding: '2px 8px', borderRadius: 4, display: 'inline-block', fontWeight: 600 }}>Join</div>
              </div>
            </div>

            {/* Active Bookings */}
            <div style={{ marginBottom: 4 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 7, fontWeight: 700, color: '#111827' }}>Active Bookings</span>
                <span style={{ fontSize: 5, color: c[0], fontWeight: 600 }}>Check All &gt;</span>
              </div>
              {[
                { title: 'Award Ceremony', time: '12:30 — 15:45', tags: ['Team', 'Meeting'] },
                { title: 'Design Discussion', time: '16:30 — 20:00', tags: ['Design', 'Review'] },
              ].map((b, bi) => (
                <div key={b.title} className="flex items-center justify-between" style={{ ...cardBase(), padding: '5px 7px', marginBottom: 3 }}>
                  <div>
                    <div style={{ fontSize: 6, fontWeight: 600, color: '#111827' }}>{b.title}</div>
                    <div style={{ fontSize: 5, color: '#9CA3AF' }}>{b.time}</div>
                    <div className="flex" style={{ gap: 3, marginTop: 2 }}>
                      {b.tags.map((tag, ti) => (
                        <span key={tag} style={{ fontSize: 4.5, padding: '1px 5px', borderRadius: 99, background: `${c[(bi + ti) % c.length]}15`, color: c[(bi + ti) % c.length], fontWeight: 500 }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex" style={{ gap: -3 }}>
                    {['D', 'E'].map((l, i) => (
                      <div key={l} style={{ width: 12, height: 12, borderRadius: '50%', background: c[(bi + i + 2) % c.length], border: '1px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -3 : 0, position: 'relative' as const, zIndex: 2 - i }}>
                        <span style={{ fontSize: 4.5, fontWeight: 700, color: '#fff' }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="shrink-0" style={{ width: 110, padding: '10px 8px 10px 0' }}>
            {/* Calendar */}
            <div style={{ ...cardBase(), padding: 6, marginBottom: 6 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 7, fontWeight: 700, color: '#111827' }}>Jan, 21</div>
                  <div style={{ fontSize: 5, color: '#9CA3AF' }}>Tuesday</div>
                </div>
                <div className="flex" style={{ gap: 2 }}>
                  <span style={{ fontSize: 6, color: '#9CA3AF' }}>‹</span>
                  <span style={{ fontSize: 6, color: '#9CA3AF' }}>›</span>
                </div>
              </div>
              <div className="grid grid-cols-7" style={{ gap: 1, marginBottom: 2 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={`h-${i}`} style={{ fontSize: 4, color: '#9CA3AF', textAlign: 'center' as const, fontWeight: 600 }}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7" style={{ gap: 1 }}>
                {CALENDAR_DAYS.flat().map((d, i) => {
                  const isToday = d === 21
                  const hasDot = d === 15 || d === 22 || d === 28
                  return (
                    <div key={`d-${i}`} className="flex flex-col items-center" style={{ height: 10 }}>
                      {d != null ? (
                        <>
                          <div style={{
                            fontSize: 4.5, fontWeight: isToday ? 700 : 400,
                            color: isToday ? '#fff' : '#374151',
                            background: isToday ? c[0] : 'transparent',
                            width: 10, height: 10, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {d}
                          </div>
                          {hasDot && <div style={{ width: 2, height: 2, borderRadius: '50%', background: c[2] || c[0], marginTop: -1 }} />}
                        </>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Schedule */}
            <div style={{ ...cardBase(), padding: 6 }}>
              <div style={{ fontSize: 6, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Schedule</div>
              {[
                { time: '09:00 — 10:00 AM', title: 'Award Show Discussion', ci: 0 },
                { time: '11:00 — 12:30 PM', title: 'New Branding work Ave', ci: 2 },
                { time: '12:00 — 03:30 PM', title: 'Development Discussion', ci: 1 },
              ].map((ev) => (
                <div key={ev.title} style={{ marginBottom: 4, paddingLeft: 6, borderLeft: `2px solid ${c[ev.ci % c.length]}` }}>
                  <div style={{ fontSize: 4.5, color: '#9CA3AF' }}>{ev.time}</div>
                  <div style={{ fontSize: 5, fontWeight: 600, color: '#111827' }}>{ev.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}

/* ------------------------------------------------------------------ */
/*  Mobile App — Three phones side by side                            */
/* ------------------------------------------------------------------ */

function PhoneFrame({ children, style: extraStyle }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: 120, borderRadius: 16, overflow: 'hidden',
      background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      border: '2px solid #E5E7EB', flexShrink: 0,
      ...extraStyle,
    }}>
      {children}
    </div>
  )
}

function PhoneStatusBar({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-between" style={{ background: color, padding: '3px 8px' }}>
      <span style={{ fontSize: 5.5, color: '#fff', fontWeight: 600 }}>9:41</span>
      <div className="flex items-center" style={{ gap: 2 }}>
        <svg width="7" height="5" viewBox="0 0 16 12" fill="#fff" opacity="0.7" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="0.5" /><rect x="4.5" y="5" width="3" height="7" rx="0.5" /><rect x="9" y="2" width="3" height="10" rx="0.5" /><rect x="13.5" y="0" width="2.5" height="12" rx="0.5" /></svg>
        <svg width="10" height="5" viewBox="0 0 28 13" fill="none" opacity="0.7" aria-hidden="true"><rect x="0.5" y="0.5" width="23" height="12" rx="2" stroke="#fff" strokeWidth="1" /><rect x="2" y="2" width="18" height="9" rx="1" fill="#fff" /></svg>
      </div>
    </div>
  )
}

export function MobileAppMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <div className="flex items-end justify-center" style={{ ...fs, gap: 8, padding: '4px 0' }}>
      {/* Phone 1 — Home */}
      <PhoneFrame style={{ transform: 'translateY(-4px)' }}>
        <PhoneStatusBar color={c[0]} />
        {/* Header */}
        <div className="flex items-center justify-between" style={{ background: c[0], padding: '4px 8px 8px' }}>
          <div className="flex items-center" style={{ gap: 3 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.25)' }} />
            <span style={{ fontSize: 6, color: '#fff', fontWeight: 600 }}>Cooper <span style={{ fontSize: 4, opacity: 0.6 }}>▾</span></span>
          </div>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
        </div>

        <div style={{ padding: '6px 7px' }}>
          {/* Greeting */}
          <div style={{ fontSize: 9, fontWeight: 800, color: '#111827', marginBottom: 1 }}>Hello James</div>
          <div style={{ fontSize: 5.5, color: '#9CA3AF', marginBottom: 6 }}>Make your day easy with us</div>

          {/* Feature cards */}
          <div className="flex" style={{ gap: 4, marginBottom: 6 }}>
            <div style={{ flex: 1, borderRadius: 8, padding: '6px 5px', background: `${c[0]}12`, textAlign: 'center' as const }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: c[0], margin: '0 auto 3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <div style={{ fontSize: 5, fontWeight: 600, color: '#111827' }}>Talk with Cooper</div>
            </div>
            <div style={{ flex: 1, borderRadius: 8, padding: '6px 5px', background: `${c[2] || c[0]}12`, textAlign: 'center' as const, position: 'relative' as const }}>
              <div style={{ position: 'absolute', top: 3, right: 3, fontSize: 4, fontWeight: 700, color: '#fff', background: c[2] || c[0], padding: '1px 4px', borderRadius: 99 }}>New</div>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: c[2] || c[0], margin: '0 auto 3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </div>
              <div style={{ fontSize: 5, fontWeight: 600, color: '#111827' }}>New Chat</div>
            </div>
          </div>

          {/* Search by image */}
          <div style={{ borderRadius: 8, padding: '6px 7px', background: '#1a1a2e', marginBottom: 6 }}>
            <div className="flex items-center" style={{ gap: 4 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              <span style={{ fontSize: 5.5, fontWeight: 600, color: '#fff' }}>Search by Image</span>
            </div>
          </div>

          {/* Recent Search */}
          <div style={{ fontSize: 6, fontWeight: 700, color: '#111827', marginBottom: 3 }}>Recent Search</div>
          {[
            'What is a wild animal?',
            'Scanning images',
            'Analysis my dribbble shot',
          ].map((q, i) => (
            <div key={q} className="flex items-center justify-between" style={{ padding: '3px 0', borderTop: i > 0 ? '1px solid #F3F4F6' : undefined }}>
              <div className="flex items-center" style={{ gap: 3 }}>
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <span style={{ fontSize: 5, color: '#374151' }}>{q}</span>
              </div>
              <span style={{ fontSize: 7, color: '#D1D5DB' }}>···</span>
            </div>
          ))}
        </div>
      </PhoneFrame>

      {/* Phone 2 — Chat */}
      <PhoneFrame style={{ transform: 'translateY(0px)' }}>
        <PhoneStatusBar color={c[0]} />
        {/* Chat header */}
        <div className="flex items-center justify-between" style={{ background: c[0], padding: '4px 8px 8px' }}>
          <div className="flex items-center" style={{ gap: 4 }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            <span style={{ fontSize: 6, color: '#fff', fontWeight: 600 }}>Cooper <span style={{ fontSize: 4, opacity: 0.6 }}>▾</span></span>
          </div>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
        </div>

        <div style={{ padding: '6px 7px', background: '#FAFAFA' }}>
          {/* Today badge */}
          <div style={{ textAlign: 'center' as const, marginBottom: 6 }}>
            <span style={{ fontSize: 4.5, color: '#9CA3AF', background: '#F3F4F6', padding: '1px 8px', borderRadius: 99 }}>Today</span>
          </div>

          {/* User message */}
          <div className="flex justify-end" style={{ marginBottom: 2 }}>
            <div style={{ maxWidth: '80%', background: c[0], color: '#fff', padding: '5px 7px', borderRadius: '8px 8px 2px 8px', fontSize: 5.5, lineHeight: 1.4 }}>
              Provide statistics on the development of technology over the next 5 years
            </div>
          </div>
          <div style={{ textAlign: 'right' as const, marginBottom: 6 }}>
            <span style={{ fontSize: 4, color: '#D1D5DB' }}>1 min ago</span>
          </div>

          {/* Bot response */}
          <div className="flex" style={{ gap: 4, marginBottom: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#1a1a2e', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 6, color: '#fff', fontWeight: 700 }}>C</span>
            </div>
            <div>
              <div style={{ fontSize: 5, fontWeight: 600, color: '#111827', marginBottom: 2 }}>Cooper</div>
              <div style={{ fontSize: 5, color: '#6B7280', lineHeight: 1.4, marginBottom: 4 }}>
                Based on current data, AI investment will reach:
              </div>
              <div style={{ textAlign: 'center' as const, marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: c[0] }}>275.5M</div>
                <div style={{ fontSize: 4.5, color: '#9CA3AF' }}>Projected Spend ($)</div>
              </div>
              {/* Mini bar chart */}
              <div className="flex items-end" style={{ height: 24, gap: 3, padding: '0 4px' }}>
                {[0.3, 0.5, 0.65, 0.85, 1.0].map((h, i) => (
                  <div key={i} className="flex-1" style={{ height: `${h * 100}%`, background: c[i % c.length], borderRadius: '2px 2px 0 0', opacity: 0.85 }} />
                ))}
              </div>
              <div className="flex" style={{ gap: 3, padding: '0 4px', marginTop: 1 }}>
                {['21', '22', '23', '24', '25'].map(y => (
                  <div key={y} className="flex-1 text-center" style={{ fontSize: 4, color: '#9CA3AF' }}>{y}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="flex items-center" style={{ gap: 4, marginTop: 6, background: '#fff', borderRadius: 99, padding: '3px 4px 3px 8px', border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: 5, color: '#D1D5DB', flex: 1 }}>Ask anything here..</span>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: c[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </div>
          </div>
        </div>
      </PhoneFrame>

      {/* Phone 3 — Pricing/Pro */}
      <PhoneFrame style={{ transform: 'translateY(-4px)' }}>
        <PhoneStatusBar color={c[0]} />
        <div style={{ background: c[0], padding: '4px 8px 12px', textAlign: 'center' as const }}>
          {/* Decorative arc text */}
          <div style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.08)', lineHeight: 1 }}>Cooper+</div>
          {/* App icon */}
          <div style={{ width: 22, height: 22, borderRadius: 8, background: 'rgba(255,255,255,0.2)', margin: '4px auto 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          </div>
          <div style={{ fontSize: 4.5, color: '#fff', background: 'rgba(255,255,255,0.2)', display: 'inline-block', padding: '1px 6px', borderRadius: 99, fontWeight: 600, marginBottom: 3 }}>Pro</div>
        </div>

        <div style={{ padding: '6px 7px', background: '#FAFAFA' }}>
          <div style={{ fontSize: 8, fontWeight: 800, color: '#111827', textAlign: 'center' as const, marginBottom: 1 }}>Cooper+ plans</div>
          <div style={{ fontSize: 5, color: '#9CA3AF', textAlign: 'center' as const, marginBottom: 6 }}>Try unlimited features with cooper+</div>

          {/* Plan cards */}
          {[
            { name: 'Monthly Plan', price: '$8.99', period: '/month' },
            { name: 'Yearly Plan', price: '$69.99', period: '/year' },
          ].map((p, pi) => (
            <div key={p.name} style={{ ...cardBase(), padding: '6px 7px', marginBottom: 4, border: pi === 0 ? `1.5px solid ${c[0]}` : '1px solid rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
                <span style={{ fontSize: 6, fontWeight: 700, color: '#111827' }}>{p.name}</span>
                {pi === 0 && <span style={{ fontSize: 4, color: c[0], background: `${c[0]}15`, padding: '1px 4px', borderRadius: 99, fontWeight: 600 }}>Free ads</span>}
              </div>
              <div style={{ marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#111827' }}>{p.price}</span>
                <span style={{ fontSize: 5, color: '#9CA3AF' }}>{p.period}</span>
              </div>
              {['Chat unlimited', 'Notify automatic'].map(f => (
                <div key={f} className="flex items-center" style={{ gap: 3, marginBottom: 1 }}>
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke={c[0]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                  <span style={{ fontSize: 5, color: '#6B7280' }}>{f}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Subscribe button */}
          <div style={{ background: '#1a1a2e', color: '#fff', textAlign: 'center' as const, padding: '5px 0', borderRadius: 8, fontSize: 6, fontWeight: 600, marginTop: 2 }}>
            Subscription
          </div>
        </div>
      </PhoneFrame>
    </div>
  )
}
