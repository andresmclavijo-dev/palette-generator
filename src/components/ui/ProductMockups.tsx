/**
 * Shared miniature product mockups used by PreviewPanel and ProUpgradeModal.
 * Each mockup takes a `colors` array (hex strings) and renders a tiny UI
 * that uses those colors as primary/secondary/accent.
 */

export const MOCKUP_TABS = ['Landing Page', 'Dashboard', 'Mobile App'] as const
export type MockupTab = (typeof MOCKUP_TABS)[number]

export const FALLBACK_COLORS = ['#6C47FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444']

export const TAB_CAPTIONS: Record<MockupTab, string> = {
  'Landing Page': 'Your colors in a real landing page →',
  'Dashboard': 'Your colors in a real dashboard →',
  'Mobile App': 'Your colors in a real mobile app →',
}

/* ------------------------------------------------------------------ */
/*  Browser chrome wrapper                                            */
/* ------------------------------------------------------------------ */

export function BrowserChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200/60" style={{ background: '#fff' }}>
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
        </div>
        <div className="flex-1 mx-2 h-5 rounded bg-gray-100 flex items-center justify-center">
          <span className="text-[9px] text-gray-400 font-medium">yourproduct.com</span>
        </div>
      </div>
      <div className="relative overflow-hidden" style={{ minHeight: 200 }}>
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Landing page                                                      */
/* ------------------------------------------------------------------ */

export function LandingMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <BrowserChrome>
      <div className="p-3">
        {/* Nav */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded" style={{ background: c[0] }} />
            <div className="w-12 h-2 rounded bg-gray-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded bg-gray-100" />
            <div className="w-8 h-2 rounded bg-gray-100" />
            <div className="px-2 py-1 rounded text-[7px] text-white font-medium" style={{ background: c[0] }}>Get Started</div>
          </div>
        </div>
        {/* Hero */}
        <div className="text-center mb-4 py-2">
          <div className="w-3/4 h-3 rounded bg-gray-800 mx-auto mb-2" />
          <div className="w-1/2 h-2 rounded bg-gray-200 mx-auto mb-3" />
          <div className="flex justify-center gap-2">
            <div className="px-3 py-1.5 rounded-md text-[7px] text-white font-medium" style={{ background: c[0] }}>Get Started</div>
            <div className="px-3 py-1.5 rounded-md text-[7px] font-medium border" style={{ borderColor: c[1], color: c[1] }}>Learn More</div>
          </div>
        </div>
        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-lg border border-gray-100 p-2">
              <div className="w-6 h-6 rounded-md mb-1.5" style={{ background: `linear-gradient(135deg, ${c[i % c.length]}, ${c[(i + 1) % c.length]})` }} />
              <div className="w-full h-1.5 rounded bg-gray-200 mb-1" />
              <div className="w-3/4 h-1 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </BrowserChrome>
  )
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                         */
/* ------------------------------------------------------------------ */

export function DashboardMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <BrowserChrome>
      <div className="flex" style={{ minHeight: 200 }}>
        {/* Sidebar */}
        <div className="w-12 shrink-0 py-2 px-1.5 flex flex-col gap-2" style={{ background: c[0] }}>
          <div className="w-full h-5 rounded bg-white/20" />
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="w-full h-3 rounded bg-white/10" />
          ))}
        </div>
        {/* Main */}
        <div className="flex-1 p-2.5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-16 h-2.5 rounded bg-gray-200" />
            <div className="px-2 py-1 rounded text-[7px] text-white font-medium" style={{ background: c[0] }}>Action</div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-lg border border-gray-100 p-2">
                <div className="w-5 h-5 rounded-md mb-1" style={{ background: c[i % c.length] + '22', border: `1px solid ${c[i % c.length]}33` }}>
                  <div className="w-2.5 h-2.5 rounded m-[3px]" style={{ background: c[i % c.length] }} />
                </div>
                <div className="w-8 h-2 rounded bg-gray-800 mb-0.5" />
                <div className="w-5 h-1 rounded bg-gray-200" />
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-gray-100 p-2">
            <div className="w-10 h-1.5 rounded bg-gray-200 mb-2" />
            <div className="flex items-end gap-1 h-12">
              {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.3, 0.75].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h * 100}%`,
                    background: `linear-gradient(180deg, ${c[i % c.length]}, ${c[(i + 1) % c.length]}88)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}

/* ------------------------------------------------------------------ */
/*  Mobile app                                                        */
/* ------------------------------------------------------------------ */

export function MobileAppMockup({ colors }: { colors: string[] }) {
  const c = colors
  return (
    <div className="mx-auto" style={{ width: 160 }}>
      <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200" style={{ background: '#fff' }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1" style={{ background: c[0] }}>
          <span className="text-[7px] text-white/80 font-medium">9:41</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-white/40" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
          </div>
        </div>
        {/* Header */}
        <div className="px-3 py-2.5" style={{ background: c[0] }}>
          <div className="w-16 h-2 rounded bg-white/90 mb-1" />
          <div className="w-10 h-1 rounded bg-white/40" />
        </div>
        {/* Card */}
        <div className="px-3 py-2">
          <div className="rounded-lg border border-gray-100 p-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full shrink-0" style={{ background: `linear-gradient(135deg, ${c[0]}, ${c[1]})` }} />
            <div className="flex-1">
              <div className="w-12 h-1.5 rounded bg-gray-300 mb-1" />
              <div className="w-8 h-1 rounded bg-gray-200" />
            </div>
          </div>
        </div>
        {/* List items */}
        <div className="px-3 pb-2 space-y-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-2 py-1">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c[i % c.length] }} />
              <div className="flex-1">
                <div className="w-full h-1.5 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
        {/* Bottom tab bar */}
        <div className="flex items-center justify-around py-2 border-t border-gray-100">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="w-3 h-3 rounded" style={{ background: i === 0 ? c[0] : '#D1D5DB' }} />
              <div className="w-4 h-0.5 rounded" style={{ background: i === 0 ? c[0] : '#E5E7EB' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
