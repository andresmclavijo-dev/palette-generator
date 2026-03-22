import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import './lib/posthog'

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
const NotFound = lazy(() => import('./pages/NotFound'))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: 'hsl(var(--surface-warm))' }} />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
)
