import posthog from 'posthog-js'

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com'

if (key) {
  posthog.init(key, {
    api_host: host,
    capture_pageview: false,
    disable_session_recording: true,
    persistence: 'localStorage+cookie',
  })
}

/** Thin analytics wrapper — all calls are safe even if PostHog isn't initialized */
export const analytics = {
  track(event: string, properties?: Record<string, unknown>) {
    if (key) posthog.capture(event, properties)
  },
  identify(userId: string, traits?: Record<string, unknown>) {
    if (key) posthog.identify(userId, traits)
  },
  reset() {
    if (key) posthog.reset()
  },
}

export default posthog
