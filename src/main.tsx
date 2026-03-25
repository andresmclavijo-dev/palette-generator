import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'
import { analytics } from './lib/posthog'

// ─── Global error tracking ───────────────────────────────────────
window.onerror = (message, source, line, col, error) => {
  analytics.track('error_caught', {
    message: String(message),
    source: source || 'unknown',
    line,
    col,
    stack: error?.stack?.slice(0, 500),
    url: window.location.href,
  })
}

window.addEventListener('unhandledrejection', (event) => {
  analytics.track('error_promise_rejected', {
    reason: String(event.reason),
    stack: event.reason?.stack?.slice(0, 500),
    url: window.location.href,
  })
})

// Synchronous theme init — prevents flash of wrong theme on reload
;(() => {
  const stored = localStorage.getItem('paletta-theme') || 'system'
  const resolved = stored === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : stored
  document.documentElement.classList.toggle('dark', resolved === 'dark')
})()

const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const PluginAuth = lazy(() => import('./pages/PluginAuth'))
const NotFound = lazy(() => import('./pages/NotFound'))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: 'hsl(var(--surface-warm))' }} />}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/auth/plugin" element={<PluginAuth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
