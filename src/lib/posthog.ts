const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com'

type PostHog = { capture: (e: string, p?: Record<string, unknown>) => void; identify: (id: string, t?: Record<string, unknown>) => void; reset: () => void; init: (k: string, o: Record<string, unknown>) => void }

let _ph: PostHog | null = null
let _loading: Promise<PostHog | null> | null = null

function load(): Promise<PostHog | null> {
  if (_ph) return Promise.resolve(_ph)
  if (!key) return Promise.resolve(null)
  if (_loading) return _loading
  _loading = import('posthog-js').then(mod => {
    const ph = mod.default
    ph.init(key, {
      api_host: host,
      capture_pageview: false,
      disable_session_recording: true,
      persistence: 'localStorage+cookie',
      disable_surveys: true,
      disable_external_dependency_loading: true,
    })
    _ph = ph as unknown as PostHog
    return _ph
  })
  return _loading
}

// Queue events that fire before PostHog loads
const _queue: Array<() => void> = []
function enqueue(fn: (ph: PostHog) => void) {
  if (_ph) { fn(_ph); return }
  _queue.push(() => { if (_ph) fn(_ph) })
  load().then(() => {
    while (_queue.length) _queue.shift()?.()
  })
}

// Debounced tracker for high-frequency events (e.g. palette_generated during spacebar hold)
const _debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
function debouncedCapture(event: string, properties?: Record<string, unknown>, ms = 1000) {
  const existing = _debounceTimers.get(event)
  if (existing) clearTimeout(existing)
  _debounceTimers.set(event, setTimeout(() => {
    _debounceTimers.delete(event)
    enqueue(ph => ph.capture(event, properties))
  }, ms))
}

/** Thin analytics wrapper — all calls are safe even if PostHog isn't loaded yet */
export const analytics = {
  track(event: string, properties?: Record<string, unknown>) {
    if (key) enqueue(ph => ph.capture(event, properties))
  },
  /** Debounced track — max 1 event per `ms` (default 1000). Last call wins. */
  trackDebounced(event: string, properties?: Record<string, unknown>, ms = 1000) {
    debouncedCapture(event, properties, ms)
  },
  identify(userId: string, traits?: Record<string, unknown>) {
    if (key) enqueue(ph => ph.identify(userId, traits))
  },
  reset() {
    if (key) enqueue(ph => ph.reset())
  },
}

// Kick off lazy load after first interaction / idle
if (key && typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (fn: () => void) => void }).requestIdleCallback(() => load())
  } else {
    setTimeout(() => load(), 2000)
  }
}

export default { load }
