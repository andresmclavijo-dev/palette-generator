import posthog from 'posthog-js'

const key = import.meta.env.VITE_POSTHOG_KEY

if (key) {
  posthog.init(key, {
    api_host: 'https://us.i.posthog.com',
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
  })
}

export default posthog
