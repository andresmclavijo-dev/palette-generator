// TODO: lazy-load posthog-js (~40KB) — import('posthog-js') on first analytics call
import posthog from 'posthog-js'

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com'

if (key) {
  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    disable_session_recording: true,
    persistence: 'localStorage+cookie',
    disable_surveys: true,
  })
}

// Debounced tracker for high-frequency events (e.g. palette_generated during spacebar hold)
const _debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
function debouncedCapture(event: string, properties?: Record<string, unknown>, ms = 1000) {
  const existing = _debounceTimers.get(event)
  if (existing) clearTimeout(existing)
  _debounceTimers.set(event, setTimeout(() => {
    _debounceTimers.delete(event)
    if (key) posthog.capture(event, properties)
  }, ms))
}

/** Thin analytics wrapper — all calls are safe even if PostHog isn't initialized */
export const analytics = {
  track(event: string, properties?: Record<string, unknown>) {
    if (key) posthog.capture(event, properties)
  },
  /** Debounced track — max 1 event per `ms` (default 1000). Last call wins. */
  trackDebounced(event: string, properties?: Record<string, unknown>, ms = 1000) {
    debouncedCapture(event, properties, ms)
  },
  identify(userId: string, traits?: Record<string, unknown>) {
    if (key) posthog.identify(userId, traits)
  },
  reset() {
    if (key) posthog.reset()
  },
}

export default posthog
