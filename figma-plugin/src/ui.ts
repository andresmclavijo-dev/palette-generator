/**
 * Paletta Figma Plugin — UI code (multi-screen architecture)
 */
import type { UIMessage, PluginMessage, PaletteColor, SavedPalette, HarmonyMode } from './types'

// ── SVG Icons (Lucide-style, 20px, 1.5px stroke) ─────────────────
function svg(inner: string, size = 20): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
}

const ICONS = {
  sparkles: svg('<path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/><path d="M20 4l.5 1.5L22 6l-1.5.5L20 8l-.5-1.5L18 6l1.5-.5z"/>'),
  folder: svg('<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>'),
  box: svg('<path d="M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/>'),
  code: svg('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
  checkCircle: svg('<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'),
  image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'),
  chevronLeft: svg('<polyline points="15 18 9 12 15 6"/>'),
  chevronRight: svg('<polyline points="9 18 15 12 9 6"/>', 14),
  chevronDown: svg('<polyline points="6 9 12 15 18 9"/>'),
  lock: svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>', 11),
  heart: svg('<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>'),
  eye: svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
  share: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>'),
  x: svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  minus: svg('<line x1="5" y1="12" x2="19" y2="12"/>'),
  plus: svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
  sun: svg('<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>', 16),
  monitor: svg('<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>', 16),
  moon: svg('<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>', 16),
  shuffle: svg('<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>'),
  circle: svg('<circle cx="12" cy="12" r="10"/>'),
  contrast: svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/>'),
  triangle: svg('<path d="M12 3l10 18H2z"/>'),
  arc: svg('<path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2"/><path d="M12 2C6.48 2 2 6.48 2 12"/>'),
  check: svg('<polyline points="20 6 9 17 4 12"/>', 16),
  info: svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>', 16),
}

// ── Constants ─────────────────────────────────────────────────────
const ROLES = ['primary', 'secondary', 'accent', 'surface', 'muted', 'highlight', 'border', 'overlay']
const HARMONY_OPTIONS: { mode: HarmonyMode; icon: string; title: string; desc: string }[] = [
  { mode: 'random', icon: 'shuffle', title: 'Random', desc: 'No constraints — pure variety' },
  { mode: 'analogous', icon: 'arc', title: 'Analogous', desc: 'Adjacent on the color wheel' },
  { mode: 'monochromatic', icon: 'circle', title: 'Monochromatic', desc: 'One hue, varied lightness' },
  { mode: 'complementary', icon: 'contrast', title: 'Complementary', desc: 'Opposite colors for contrast' },
  { mode: 'triadic', icon: 'triangle', title: 'Triadic', desc: 'Three evenly spaced hues' },
]
const LENS_OPTIONS = [
  { id: 'normal', title: 'Normal Vision', desc: 'Full color spectrum', free: true },
  { id: 'protanopia', title: 'Protanopia', desc: 'Red-green \u00b7 reds appear dark or missing', free: true },
  { id: 'deuteranopia', title: 'Deuteranopia', desc: 'Red-green \u00b7 most common (~5% of men)', free: true },
  { id: 'tritanopia', title: 'Tritanopia', desc: 'Blue-yellow confusion', free: false },
  { id: 'achromatopsia', title: 'Achromatopsia', desc: 'Grayscale only \u00b7 no color perception', free: false },
]

// ── State ─────────────────────────────────────────────────────────
const state = {
  screen: 'home',
  palette: [] as PaletteColor[],
  prefix: 'Paletta',
  harmony: 'random' as HarmonyMode,
  colorCount: 5,
  lens: 'normal',
  savedPalettes: [] as SavedPalette[],
  hasSelection: false,
  selectionCount: 0,
  codeTab: 'css' as 'css' | 'tailwind',
  proPlan: 'monthly' as 'monthly' | 'yearly',
  themeMode: 'system' as 'light' | 'system' | 'dark',
  isPro: false,
  isSignedIn: false,
  user: null as { id: string; email: string; isPro: boolean } | null,
  authToken: null as string | null,
}

// ── Send to plugin sandbox ────────────────────────────────────────
function send(msg: UIMessage) {
  parent.postMessage({ pluginMessage: msg }, '*')
}

// ── Cloud API helpers (Supabase via Vercel) ──────────────────────
const API_BASE = 'https://www.usepaletta.io/api'

function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${state.authToken}`,
  }
}

/** DB row → plugin SavedPalette */
function dbToPlugin(row: { id: string; name: string; colors: string[]; created_at: string }): SavedPalette {
  return {
    id: row.id,
    name: row.name,
    colors: row.colors.map(hex => ({ hex, name: hex, locked: false })),
    date: new Date(row.created_at).toLocaleDateString('en-US'),
  }
}

async function apiListPalettes(): Promise<SavedPalette[]> {
  const res = await fetch(`${API_BASE}/palettes`, { headers: apiHeaders() })
  if (!res.ok) return []
  const data = await res.json() as { palettes: { id: string; name: string; colors: string[]; created_at: string }[] }
  return (data.palettes || []).map(dbToPlugin)
}

async function apiSavePalette(name: string, colors: PaletteColor[]): Promise<SavedPalette | null> {
  const hexColors = colors.map(c => c.hex)
  const res = await fetch(`${API_BASE}/palettes`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ name, colors: hexColors }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string }
    if (data.error === 'FREE_LIMIT') {
      showProModal()
      return null
    }
    showToast('Failed to save')
    return null
  }
  const data = await res.json() as { palette: { id: string; name: string; colors: string[]; created_at: string } }
  return dbToPlugin(data.palette)
}

async function apiDeletePalette(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/palettes-delete`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ id }),
  })
  return res.ok
}

async function syncCloudPalettes() {
  if (!state.isSignedIn || !state.authToken) return
  try {
    const palettes = await apiListPalettes()
    state.savedPalettes = palettes
    if (state.screen === 'library') renderLibraryScreen()
  } catch { /* network error — use local cache */ }
}

// ── WCAG utilities ────────────────────────────────────────────────
function linearize(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}
function luminance(hex: string): number {
  const rgb = [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ].map(linearize)
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1)
  const l2 = luminance(hex2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
function getWcagBadge(hex: string): { label: string; ratio: string; pass: boolean } {
  const onWhite = contrastRatio(hex, '#FFFFFF')
  const onBlack = contrastRatio(hex, '#000000')
  const best = Math.max(onWhite, onBlack)
  const ratio = best.toFixed(1)
  if (best >= 7) return { label: 'AAA', ratio, pass: true }
  if (best >= 4.5) return { label: 'AA', ratio, pass: true }
  return { label: 'Fail', ratio, pass: false }
}
function isLightColor(hex: string): boolean {
  return luminance(hex) > 0.4
}

// ── Color blindness simulation ────────────────────────────────────
const SIM_MATRICES: Record<string, number[]> = {
  protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
  deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
  tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
  achromatopsia: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
}
function simulateColor(hex: string, lens: string): string {
  if (lens === 'normal') return hex
  const m = SIM_MATRICES[lens]
  if (!m) return hex
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const nr = Math.min(1, Math.max(0, m[0] * r + m[1] * g + m[2] * b))
  const ng = Math.min(1, Math.max(0, m[3] * r + m[4] * g + m[5] * b))
  const nb = Math.min(1, Math.max(0, m[6] * r + m[7] * g + m[8] * b))
  return '#' + [nr, ng, nb].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('')
}

// ── Clipboard ─────────────────────────────────────────────────────
function copyToClipboard(text: string): boolean {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;opacity:0'
  document.body.appendChild(ta)
  ta.select()
  let ok = false
  try { ok = document.execCommand('copy') } catch { ok = false }
  document.body.removeChild(ta)
  return ok
}

// ── Code generators ───────────────────────────────────────────────
function generateCSS(): string {
  const vars = state.palette.map((c, i) => {
    const role = ROLES[i] || `color-${i + 1}`
    return `  --color-${role}: ${c.hex};`
  }).join('\n')
  return `:root {\n${vars}\n}`
}
function generateTailwind(): string {
  const entries = state.palette.map((c, i) => {
    const role = ROLES[i] || `color-${i + 1}`
    return `        ${role}: '${c.hex}',`
  }).join('\n')
  return `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n${entries}\n      }\n    }\n  }\n}`
}

// ── Status toast ──────────────────────────────────────────────────
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string) {
  const el = document.getElementById('status-toast')!
  el.textContent = msg
  el.classList.add('show')
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500)
}

// ── Auth flow (server-side polling pattern) ──────────────────────
// postMessage can't reach Figma plugin iframes, so we use:
// 1. Plugin generates session ID, opens popup with it
// 2. Popup completes OAuth, POSTs token to /api/plugin-auth-status
// 3. Plugin polls GET /api/plugin-auth-status every 2s until token appears
let authPollTimer: ReturnType<typeof setInterval> | null = null

function handleLogin() {
  const sessionId = 'ps_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11)
  const width = 500
  const height = 600
  const left = Math.round((screen.width - width) / 2)
  const top = Math.round((screen.height - height) / 2)

  window.open(
    `https://www.usepaletta.io/auth/plugin?session=${sessionId}`,
    'paletta-auth',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`,
  )

  showToast('Sign in via the popup...')

  // Poll for the token
  let attempts = 0
  const maxAttempts = 60 // 2 minutes at 2s intervals
  if (authPollTimer) clearInterval(authPollTimer)

  authPollTimer = setInterval(async () => {
    attempts++
    if (attempts > maxAttempts) {
      clearInterval(authPollTimer!)
      authPollTimer = null
      showToast('Sign in timed out')
      return
    }
    try {
      const res = await fetch(`https://www.usepaletta.io/api/plugin-auth-status?session=${sessionId}`)
      const data = await res.json() as { status: string; token?: string; user?: { id: string; email: string; isPro: boolean } }
      if (data.status === 'complete' && data.token && data.user) {
        clearInterval(authPollTimer!)
        authPollTimer = null
        completeAuth(data.token, data.user)
      }
    } catch { /* network error — keep polling */ }
  }, 2000)
}

function completeAuth(token: string, user: { id: string; email: string; isPro: boolean }) {
  send({ type: 'set-auth', token, user })
  state.authToken = token
  state.isPro = user.isPro
  state.user = user
  state.isSignedIn = true
  updateHomeAuthUI()
  updateProUI()
  showToast(`Signed in as ${user.email}`)
  syncCloudPalettes()
}

function handleSignOut() {
  send({ type: 'clear-auth' })
  state.authToken = null
  state.isPro = false
  state.user = null
  state.isSignedIn = false
  // Reload local palettes from sandbox
  send({ type: 'load-palettes' })
  updateHomeAuthUI()
  updateProUI()
  showToast('Signed out')
}

function initAuth(auth: { token: string; user: { id: string; email: string; isPro: boolean } } | null) {
  if (!auth) return
  try {
    const payload = JSON.parse(atob(auth.token)) as { exp?: number }
    if (payload.exp && payload.exp > Date.now()) {
      state.authToken = auth.token
      state.isPro = auth.user.isPro
      state.user = auth.user
      state.isSignedIn = true
      syncCloudPalettes()
      return
    }
  } catch { /* invalid token */ }
  send({ type: 'clear-auth' })
}

function updateHomeAuthUI() {
  const section = document.getElementById('home-auth')
  if (!section) return

  if (state.isSignedIn && state.user) {
    const initial = (state.user.email || '?')[0].toUpperCase()
    const planLabel = state.isPro
      ? '<span class="pro-badge-sm">PRO</span>'
      : '<span style="font-size:11px;color:var(--text-tertiary)">Free plan</span>'

    section.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--bg-secondary);border-radius:12px;width:100%;">
        <div style="width:36px;height:36px;border-radius:10px;background:var(--violet);color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;flex-shrink:0;">${initial}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${state.user.email}</div>
          <div style="margin-top:2px;">${planLabel}</div>
        </div>
        <button id="home-sign-out" style="font-size:11px;color:var(--text-tertiary);background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;" aria-label="Sign out" title="Sign out">Sign out</button>
      </div>
    `
    document.getElementById('home-sign-out')?.addEventListener('click', handleSignOut)
  } else {
    section.innerHTML = `
      <button class="home-auth-btn" id="home-auth-btn" aria-label="Continue with Google" title="Sign in with your Google account">Continue with Google</button>
      <button class="home-pro-link" id="home-pro-link" aria-label="See Pro features" title="View Pro features and pricing">See what's in Pro &rarr;</button>
    `
    document.getElementById('home-auth-btn')?.addEventListener('click', handleLogin)
    document.getElementById('home-pro-link')?.addEventListener('click', showProModal)
  }
}

// ── Navigation ────────────────────────────────────────────────────
function navigate(screen: string) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  const el = document.getElementById('screen-' + screen)
  if (el) {
    el.classList.add('active')
    state.screen = screen
  }
  if (screen === 'studio') renderStudioScreen()
  if (screen === 'library') renderLibraryScreen()
  if (screen === 'vars') renderVarsScreen()
  if (screen === 'code') renderCodeScreen()
  if (screen === 'contrast') renderContrastScreen()
}

function showProModal() {
  renderProModal()
  document.getElementById('pro-modal')!.classList.add('active')
}
function hideProModal() {
  document.getElementById('pro-modal')!.classList.remove('active')
}

// ── Home menu rendering (extracted so it can be re-rendered on auth change) ──

function renderHomeMenu() {
  const menu = document.getElementById('home-menu')
  if (!menu) return
  menu.innerHTML = ''
  const menuData = [
    { screen: 'studio', icon: 'sparkles', title: 'Studio', desc: 'Generate color palettes', pro: false },
    { screen: 'library', icon: 'folder', title: 'Library', desc: 'Your saved color systems', pro: false },
    { screen: 'vars', icon: 'box', title: 'Create Variables', desc: 'Push to Figma tokens', pro: false },
    { screen: 'code', icon: 'code', title: 'Copy Code', desc: 'CSS or Tailwind config', pro: false },
    { screen: 'contrast', icon: 'checkCircle', title: 'Contrast Checker', desc: 'WCAG AA/AAA validation', pro: false },
    { screen: 'extract', icon: 'image', title: 'Extract from Image', desc: 'Pull colors from images', pro: !state.isPro },
  ]
  menuData.forEach(item => {
    const btn = document.createElement('button')
    btn.className = 'menu-item'
    btn.setAttribute('aria-label', item.title)
    btn.setAttribute('title', item.desc)
    btn.innerHTML = `
      <span class="menu-icon">${(ICONS as Record<string, string>)[item.icon]}</span>
      <span class="menu-text">
        <span class="menu-title">${item.title}</span>
        <span class="menu-desc">${item.desc}</span>
      </span>
      ${item.pro ? '<span class="pro-badge">PRO</span>' : ''}
      <span class="menu-chevron">${ICONS.chevronRight}</span>
    `
    btn.addEventListener('click', () => navigate(item.screen))
    menu.appendChild(btn)
  })
}

// ── Update all Pro badges/gates across the UI ──

function updateProUI() {
  // Re-render home menu (Extract from Image PRO badge)
  renderHomeMenu()
  // Re-render extract screen (Pro gate vs full UI)
  buildExtractScreen()
  // If currently viewing a screen that has pro-gated elements, re-render it
  if (state.screen === 'studio') renderStudioAccordions()
  if (state.screen === 'vars') renderVarsScreen()
  if (state.screen === 'code') renderCodeScreen()
}

// ── Build static screens on init ──────────────────────────────────

function buildHomeScreen() {
  const el = document.getElementById('screen-home')!
  el.innerHTML = `
    <div class="scroll-area">
      <div class="home-top">
        <div class="logo-box">
          <span class="logo-p">P</span>
          <div class="logo-dots">
            <span class="logo-dot" style="background:#6C47FF"></span>
            <span class="logo-dot" style="background:#8B6FFF"></span>
            <span class="logo-dot" style="background:#A897FF"></span>
            <span class="logo-dot" style="background:#C4B5FD"></span>
            <span class="logo-dot" style="background:#DDD6FE"></span>
          </div>
        </div>
        <h1 class="home-welcome">Welcome to Paletta</h1>
        <p class="home-desc">Color systems with built-in accessibility</p>
      </div>
      <div class="home-auth" id="home-auth"></div>
      <nav class="menu-list" id="home-menu" aria-label="Main navigation"></nav>
    </div>
    <footer class="home-footer">
      <span class="footer-text">usepaletta.io &middot; v1.0</span>
      <div class="theme-toggle" id="theme-toggle" role="radiogroup" aria-label="Theme"></div>
    </footer>
  `
  // Menu items
  renderHomeMenu()

  // Theme toggle
  const toggle = document.getElementById('theme-toggle')!
  const themes = [
    { id: 'light', icon: ICONS.sun, label: 'Light theme' },
    { id: 'system', icon: ICONS.monitor, label: 'System theme' },
    { id: 'dark', icon: ICONS.moon, label: 'Dark theme' },
  ]
  themes.forEach(t => {
    const btn = document.createElement('button')
    btn.className = `theme-btn${t.id === state.themeMode ? ' active' : ''}`
    btn.setAttribute('role', 'radio')
    btn.setAttribute('aria-checked', String(t.id === state.themeMode))
    btn.setAttribute('aria-label', t.label)
    btn.setAttribute('title', t.label)
    btn.dataset.theme = t.id
    btn.innerHTML = t.icon
    btn.addEventListener('click', () => setTheme(t.id as typeof state.themeMode))
    toggle.appendChild(btn)
  })

  // Auth section (dynamic: signed-in card or sign-in button)
  updateHomeAuthUI()
}

function buildExtractScreen() {
  const el = document.getElementById('screen-extract')!
  if (state.isPro) {
    el.innerHTML = `
      <div class="header-bar">
        <div class="header-left">
          <button class="back-btn" id="extract-back" aria-label="Go back" title="Go back to home">${ICONS.chevronLeft}<span>Back</span></button>
        </div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">${ICONS.image}</div>
        <h2 class="empty-title">Extract from Selection</h2>
        <p class="empty-body">Select layers with solid fills, then extract their colors into a palette.</p>
        <button class="empty-cta" id="extract-action-btn" aria-label="Extract colors" title="Extract colors from selected layers">Extract Colors</button>
      </div>
    `
    document.getElementById('extract-back')!.addEventListener('click', () => navigate('home'))
    document.getElementById('extract-action-btn')!.addEventListener('click', () => {
      send({ type: 'extract-from-selection' })
    })
  } else {
    el.innerHTML = `
      <div class="header-bar">
        <div class="header-left">
          <button class="back-btn" id="extract-back" aria-label="Go back" title="Go back to home">${ICONS.chevronLeft}<span>Back</span></button>
        </div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">${ICONS.image}</div>
        <h2 class="empty-title">Extract from Image</h2>
        <p class="empty-body">Select a frame with an image fill, then extract its color palette.</p>
        <button class="empty-cta" id="extract-pro-btn" aria-label="Go Pro to unlock" title="Upgrade to Pro to unlock image extraction">Go Pro to unlock</button>
        <button class="btn-ghost" id="extract-later-btn" aria-label="Maybe later">Maybe later</button>
      </div>
    `
    document.getElementById('extract-back')!.addEventListener('click', () => navigate('home'))
    document.getElementById('extract-pro-btn')!.addEventListener('click', showProModal)
    document.getElementById('extract-later-btn')!.addEventListener('click', () => navigate('home'))
  }
}

// ── Studio screen ─────────────────────────────────────────────────
function renderStudioScreen() {
  const el = document.getElementById('screen-studio')!
  const harmonyLabel = HARMONY_OPTIONS.find(h => h.mode === state.harmony)?.title || 'Random'
  const isCompact = state.palette.length > 5

  el.innerHTML = `
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" id="studio-back" aria-label="Go back" title="Go back to home">${ICONS.chevronLeft}<span>Back</span></button>
      </div>
      <span class="header-center">Harmony: ${harmonyLabel}</span>
      <div class="header-right">
        <button class="header-action" id="studio-validate" aria-label="Accessibility lens" title="Preview palette under color blindness simulations">${ICONS.eye}</button>
      </div>
    </div>
    <div class="scroll-area">
      <div class="color-bars${isCompact ? ' compact' : ''}" id="studio-bars"></div>
      <div class="ai-row">
        <input class="ai-input" id="studio-ai-input" type="text" placeholder="Describe a palette... (e.g. sunset warm)" aria-label="AI palette prompt" title="Describe the mood or theme for AI generation">
        <button class="ai-btn" id="studio-ai-btn" aria-label="Generate with AI" title="Generate a palette from your text description using AI">AI</button>
      </div>
      <div class="accordion-group" id="studio-accordions"></div>
    </div>
    <div class="bottom-bar">
      <div class="stepper">
        <button class="stepper-btn" id="stepper-minus" aria-label="Decrease color count" title="Remove a color">${ICONS.minus}</button>
        <span class="stepper-val" id="stepper-val">${state.colorCount}</span>
        <button class="stepper-btn" id="stepper-plus" aria-label="Increase color count" title="Add a color">${ICONS.plus}</button>
      </div>
      <button class="btn-primary btn-full" id="studio-generate" aria-label="Generate palette" title="Generate a new palette. Only changes the preview — doesn't modify your Figma file.">Generate</button>
      <button class="btn-icon" id="studio-save" aria-label="Save palette" title="Save this palette to your library">${ICONS.heart}</button>
    </div>
  `

  renderStudioBars()
  renderStudioAccordions()

  // Events
  document.getElementById('studio-back')!.addEventListener('click', () => navigate('home'))
  document.getElementById('studio-validate')!.addEventListener('click', () => {
    const acc = document.querySelector('[data-accordion="lens"]') as HTMLElement | null
    if (acc) acc.classList.toggle('open')
  })
  document.getElementById('stepper-minus')!.addEventListener('click', () => {
    if (state.colorCount > 3) { state.colorCount--; updateStepper(); generatePalette() }
  })
  document.getElementById('stepper-plus')!.addEventListener('click', () => {
    if (state.colorCount >= 8) return
    if (state.colorCount >= 5 && !state.isPro) {
      showProModal()
      return
    }
    state.colorCount++
    updateStepper()
    generatePalette()
  })
  document.getElementById('studio-generate')!.addEventListener('click', generatePalette)
  document.getElementById('studio-save')!.addEventListener('click', async () => {
    if (state.palette.length === 0) { showToast('Generate a palette first'); return }
    const name = state.palette.map(c => c.name).slice(0, 3).join(' \u00b7 ')

    if (state.isSignedIn && state.authToken) {
      // Cloud save via API
      const saved = await apiSavePalette(name, state.palette)
      if (saved) {
        state.savedPalettes.unshift(saved)
        showToast('Saved!')
      }
    } else {
      // Local save: check free limit client-side
      if (!state.isPro && state.savedPalettes.length >= 3) {
        showProModal()
        return
      }
      send({ type: 'save-palette', name, colors: state.palette })
    }
  })

  // AI — fetch directly from UI iframe (figma.fetch not available in sandbox)
  const aiInput = document.getElementById('studio-ai-input') as HTMLInputElement
  const aiBtn = document.getElementById('studio-ai-btn') as HTMLButtonElement
  aiBtn.addEventListener('click', () => {
    const prompt = aiInput.value.trim()
    if (!prompt) { showToast('Enter a prompt first'); return }
    aiGenerateFromUI(prompt, state.colorCount, aiBtn)
  })
  aiInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); aiBtn.click() }
  })
}

function renderStudioBars() {
  const container = document.getElementById('studio-bars')
  if (!container) return
  container.innerHTML = ''
  state.palette.forEach((color, i) => {
    const displayHex = simulateColor(color.hex, state.lens)
    const textColor = isLightColor(displayHex) ? '#000000' : '#ffffff'
    const badge = getWcagBadge(color.hex)
    const bar = document.createElement('button')
    bar.className = 'color-bar'
    bar.setAttribute('tabindex', '0')
    bar.setAttribute('data-locked', String(color.locked))
    bar.setAttribute('aria-label', `${ROLES[i] || 'color'} ${color.hex}${color.locked ? ', locked' : ''}`)
    bar.setAttribute('title', 'Click to lock/unlock this color. Locked colors stay when you regenerate.')
    bar.style.backgroundColor = displayHex
    bar.innerHTML = `
      <span class="bar-lock" style="color:${textColor}">${ICONS.lock}</span>
      <span class="bar-badge ${badge.pass ? 'bar-badge-pass' : 'bar-badge-fail'}">${badge.label} ${badge.ratio}</span>
      <span class="bar-hex" style="color:${textColor}">${color.hex.toUpperCase()}</span>
    `
    bar.addEventListener('click', () => {
      state.palette[i] = { ...state.palette[i], locked: !state.palette[i].locked }
      renderStudioBars()
    })
    container.appendChild(bar)
  })
}

function renderStudioAccordions() {
  const container = document.getElementById('studio-accordions')
  if (!container) return
  container.innerHTML = ''

  // Harmony accordion
  const harmonyAcc = createAccordion('harmony', 'Harmony')
  const harmonyList = document.createElement('div')
  harmonyList.className = 'accordion-list'
  const harmonyHeader = document.createElement('div')
  harmonyHeader.style.cssText = 'padding:12px 16px 8px;margin-bottom:8px;border-bottom:1px solid var(--border)'
  harmonyHeader.innerHTML = `
    <div style="font-size:13px;font-weight:600;color:var(--text);line-height:1.3">Harmony Mode</div>
    <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;line-height:1.4">Choose how colors relate to each other on the wheel</div>
  `
  harmonyList.appendChild(harmonyHeader)
  HARMONY_OPTIONS.forEach(opt => {
    const row = document.createElement('button')
    row.className = 'option-row'
    row.dataset.selected = String(state.harmony === opt.mode)
    row.setAttribute('aria-label', opt.title)
    row.setAttribute('title', opt.desc)
    row.innerHTML = `
      <span class="option-icon">${(ICONS as Record<string, string>)[opt.icon]}</span>
      <span class="option-text">
        <span class="option-title">${opt.title}</span>
        <span class="option-desc">${opt.desc}</span>
      </span>
      ${state.harmony === opt.mode ? `<span class="option-check">${ICONS.check}</span>` : ''}
    `
    row.addEventListener('click', () => {
      state.harmony = opt.mode
      harmonyAcc.classList.remove('open')
      const label = document.querySelector('.header-center')
      if (label) label.textContent = `Harmony: ${opt.title}`
      renderStudioAccordions()
      generatePalette()
    })
    harmonyList.appendChild(row)
  })
  harmonyAcc.querySelector('.accordion-content')!.appendChild(harmonyList)
  container.appendChild(harmonyAcc)

  // Lens accordion
  const lensAcc = createAccordion('lens', 'Accessibility Lens')
  const lensList = document.createElement('div')
  lensList.className = 'accordion-list'
  const lensHeader = document.createElement('div')
  lensHeader.style.cssText = 'padding:12px 16px 8px;margin-bottom:8px;border-bottom:1px solid var(--border)'
  lensHeader.innerHTML = `
    <div style="font-size:13px;font-weight:600;color:var(--text);line-height:1.3">Accessibility Lens</div>
    <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;line-height:1.4">See how people with color vision differences experience your palette</div>
  `
  lensList.appendChild(lensHeader)
  LENS_OPTIONS.forEach(opt => {
    const isGated = !opt.free && !state.isPro
    const row = document.createElement('button')
    row.className = 'option-row'
    row.dataset.selected = String(state.lens === opt.id)
    row.setAttribute('aria-label', opt.title)
    row.setAttribute('title', isGated ? 'Pro feature — upgrade to unlock' : opt.desc)
    row.innerHTML = `
      <span class="option-icon">${ICONS.eye}</span>
      <span class="option-text">
        <span class="option-title">${opt.title}${isGated ? ' <span class="pro-badge-sm">PRO</span>' : ''}</span>
        <span class="option-desc">${opt.desc}</span>
      </span>
      ${state.lens === opt.id ? `<span class="option-check">${ICONS.check}</span>` : ''}
    `
    row.addEventListener('click', () => {
      if (isGated) {
        showProModal()
        return
      }
      state.lens = opt.id
      lensAcc.classList.remove('open')
      renderStudioBars()
      renderStudioAccordions()
    })
    lensList.appendChild(row)
  })
  lensAcc.querySelector('.accordion-content')!.appendChild(lensList)
  container.appendChild(lensAcc)

  // Contrast accordion
  const contrastAcc = createAccordion('contrast', 'Contrast')
  const contrastList = document.createElement('div')
  contrastList.className = 'accordion-list'
  state.palette.forEach((color, i) => {
    const badge = getWcagBadge(color.hex)
    const role = ROLES[i] || `color-${i + 1}`
    const row = document.createElement('div')
    row.className = 'card-row'
    row.innerHTML = `
      <span class="card-square" style="background:${color.hex}"></span>
      <span class="card-label">${role}</span>
      <span class="card-value">${badge.ratio}:1</span>
      <span class="card-badge ${badge.pass ? 'card-badge-pass' : 'card-badge-fail'}">${badge.label}</span>
    `
    contrastList.appendChild(row)
  })
  contrastAcc.querySelector('.accordion-content')!.appendChild(contrastList)
  container.appendChild(contrastAcc)
}

function createAccordion(id: string, title: string): HTMLElement {
  const acc = document.createElement('div')
  acc.className = 'accordion'
  acc.dataset.accordion = id
  acc.innerHTML = `
    <button class="accordion-header" aria-expanded="false" aria-label="${title}">
      <span>${title}</span>
      <span class="accordion-chevron">${ICONS.chevronDown}</span>
    </button>
    <div class="accordion-content"></div>
  `
  const header = acc.querySelector('.accordion-header')!
  header.addEventListener('click', () => {
    acc.classList.toggle('open')
    header.setAttribute('aria-expanded', String(acc.classList.contains('open')))
  })
  return acc
}

function updateStepper() {
  const val = document.getElementById('stepper-val')
  const minus = document.getElementById('stepper-minus') as HTMLButtonElement | null
  const plus = document.getElementById('stepper-plus') as HTMLButtonElement | null
  if (val) val.textContent = String(state.colorCount)
  if (minus) minus.disabled = state.colorCount <= 3
  if (plus) plus.disabled = state.colorCount >= 8
}

// ── AI daily limit (free: 3/day, Pro: unlimited) ─────────────────
// Uses in-memory counter, initialized from figma.clientStorage via init message,
// persisted back via set-ai-usage message. No localStorage (blocked in plugin iframes).
const AI_DAILY_LIMIT = 3
let aiUsage = { count: 0, date: new Date().toDateString() }

function initAiUsage(stored: { count: number; date: string } | null) {
  if (!stored) { aiUsage = { count: 0, date: new Date().toDateString() }; return }
  if (stored.date !== new Date().toDateString()) { aiUsage = { count: 0, date: new Date().toDateString() }; return }
  aiUsage = { count: stored.count, date: stored.date }
}

function incrementAiUsage(): number {
  aiUsage.count++
  aiUsage.date = new Date().toDateString()
  send({ type: 'set-ai-usage', usage: { ...aiUsage } })
  return aiUsage.count
}

function canUseAi(): boolean {
  if (state.isPro) return true
  if (aiUsage.date !== new Date().toDateString()) { aiUsage = { count: 0, date: new Date().toDateString() } }
  return aiUsage.count < AI_DAILY_LIMIT
}

function getAiRemaining(): number {
  if (state.isPro) return Infinity
  if (aiUsage.date !== new Date().toDateString()) return AI_DAILY_LIMIT
  return Math.max(0, AI_DAILY_LIMIT - aiUsage.count)
}

async function aiGenerateFromUI(prompt: string, count: number, btn: HTMLButtonElement) {
  if (!canUseAi()) {
    showToast('Daily AI limit reached')
    showProModal()
    return
  }

  btn.disabled = true
  btn.classList.add('loading')
  btn.textContent = '\u2026'
  try {
    const response = await fetch('https://www.usepaletta.io/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, colorCount: count, isPro: state.isPro }),
    })
    if (response.status === 429) {
      showToast('Daily AI limit reached')
      showProModal()
      return
    }
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`API ${response.status}: ${body.slice(0, 100)}`)
    }
    const data = await response.json() as { colors: string[] }
    if (!data.colors || !Array.isArray(data.colors)) throw new Error('Invalid response')
    state.palette = data.colors.map(hex => ({ hex, name: hex, locked: false }))
    state.colorCount = data.colors.length
    renderStudioBars()
    renderStudioAccordions()
    updateStepper()

    // Count successful call and show remaining
    incrementAiUsage()
    const remaining = getAiRemaining()
    if (remaining > 0 && remaining <= 2) {
      showToast(`${remaining} AI prompt${remaining === 1 ? '' : 's'} left today`)
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[AI_FETCH_ERROR]', detail)
    showToast(`AI error: ${detail.slice(0, 60)}`)
    // Fallback: generate random palette via sandbox
    send({ type: 'generate', mode: 'random', count, seedColor: null, lockedIndices: [] })
  } finally {
    btn.disabled = false
    btn.classList.remove('loading')
    btn.textContent = 'AI'
  }
}

function generatePalette() {
  const lockedIndices = state.palette
    .map((c, i) => c.locked ? i : -1)
    .filter(i => i >= 0)
  send({
    type: 'generate',
    mode: state.harmony,
    count: state.colorCount,
    seedColor: null,
    lockedIndices,
  })
}

// ── Library screen ────────────────────────────────────────────────
function renderLibraryScreen() {
  const el = document.getElementById('screen-library')!
  if (state.savedPalettes.length === 0) {
    el.innerHTML = `
      <div class="header-bar">
        <div class="header-left">
          <button class="back-btn" id="lib-back" aria-label="Go back" title="Go back to home">${ICONS.chevronLeft}<span>Back</span></button>
        </div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">${ICONS.heart}</div>
        <h2 class="empty-title">Your collection starts here</h2>
        <p class="empty-body">Save favorites and export to Figma or Tailwind CSS. 3 free saves, unlimited with Pro.</p>
        <button class="empty-cta" id="lib-studio-btn" aria-label="Go to Studio" title="Go to Studio to generate your first palette">Go to Studio</button>
      </div>
    `
    el.querySelector('#lib-back')!.addEventListener('click', () => navigate('home'))
    el.querySelector('#lib-studio-btn')!.addEventListener('click', () => navigate('studio'))
    return
  }

  el.innerHTML = `
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" id="lib-back" aria-label="Go back" title="Go back to home">${ICONS.chevronLeft}<span>Back</span></button>
      </div>
    </div>
    <div class="scroll-area">
      <h2 class="section-title">Library</h2>
      <p class="section-subtitle">${state.savedPalettes.length} palette${state.savedPalettes.length !== 1 ? 's' : ''}${!state.isPro ? ` (${state.savedPalettes.length}/3 free)` : ''}</p>
      <div class="section-pad" style="display:flex;flex-direction:column;gap:10px;padding-bottom:16px;" id="lib-list"></div>
    </div>
  `
  el.querySelector('#lib-back')!.addEventListener('click', () => navigate('home'))
  const list = document.getElementById('lib-list')!

  state.savedPalettes.forEach(p => {
    const card = document.createElement('div')
    card.className = 'palette-card'
    card.setAttribute('tabindex', '0')
    card.setAttribute('aria-label', `Load palette: ${p.name}`)
    card.setAttribute('title', `Click to load this palette into Studio`)
    const barHTML = p.colors.map(c => `<div class="palette-bar-segment" style="background:${c.hex}"></div>`).join('')
    card.innerHTML = `
      <div class="palette-bar">${barHTML}</div>
      <div class="palette-info">
        <div style="flex:1;display:flex;flex-direction:column;gap:2px;">
          <span class="palette-name">${p.name}</span>
          <span class="palette-meta">${p.colors.length} colors &middot; ${p.date}</span>
        </div>
        <button class="palette-action palette-action-delete" data-delete="${p.id}" aria-label="Delete palette" title="Delete this palette">${ICONS.x}</button>
      </div>
    `
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-delete]')) return
      state.palette = p.colors.map(c => ({ ...c }))
      state.colorCount = p.colors.length
      navigate('studio')
    })
    const delBtn = card.querySelector('[data-delete]')
    if (delBtn) {
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation()
        if (state.isSignedIn && state.authToken) {
          // Cloud delete via API
          const ok = await apiDeletePalette(p.id)
          if (ok) {
            state.savedPalettes = state.savedPalettes.filter(sp => sp.id !== p.id)
            renderLibraryScreen()
            showToast('Deleted')
          } else {
            showToast('Failed to delete')
          }
        } else {
          // Local delete via sandbox
          send({ type: 'delete-palette', id: p.id })
        }
      })
    }
    list.appendChild(card)
  })
}

// ── Variables screen ──────────────────────────────────────────────
function renderVarsScreen() {
  const el = document.getElementById('screen-vars')!
  if (state.palette.length === 0) {
    el.innerHTML = `
      <div class="header-bar">
        <div class="header-left">
          <button class="back-btn" id="vars-back" aria-label="Go back" title="Go back to home">${ICONS.chevronLeft}<span>Back</span></button>
        </div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">${ICONS.box}</div>
        <h2 class="empty-title">No palette yet</h2>
        <p class="empty-body">Generate a palette in Studio first, then come back to create Figma Variables.</p>
        <button class="empty-cta" id="vars-studio-btn" aria-label="Go to Studio">Go to Studio</button>
      </div>
    `
    el.querySelector('#vars-back')!.addEventListener('click', () => navigate('home'))
    el.querySelector('#vars-studio-btn')!.addEventListener('click', () => navigate('studio'))
    return
  }

  const n = state.palette.length
  el.innerHTML = `
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" id="vars-back" aria-label="Go back" title="Go back to home">${ICONS.chevronLeft}<span>Back</span></button>
      </div>
    </div>
    <div class="scroll-area">
      <h2 class="section-title">Create Figma Variables</h2>
      <div class="prefix-row">
        <span class="prefix-label">Collection:</span>
        <input class="prefix-input" id="vars-prefix" type="text" value="${state.prefix}" aria-label="Variable collection name" title="Collection name for Figma Variables">
      </div>
      <div class="section-pad" style="display:flex;flex-direction:column;gap:4px;" id="vars-list"></div>
      <div class="section-pad" style="padding-top:10px;">
        <label class="checkbox-card" id="vars-shade-card" title="Generate a full 10-step shade scale (50, 100, 200...900) for each color.">
          <input type="checkbox" id="vars-shades" aria-label="Include shade scales">
          <div>
            <div class="checkbox-label">Include shade scales (50-900)${!state.isPro ? ' <span class="pro-badge-sm">PRO</span>' : ''}</div>
            <div class="checkbox-sub" id="vars-shade-sub">${n} &times; 10 = ${n * 10} extra variables</div>
          </div>
        </label>
      </div>
      <div class="info-note">${ICONS.info} Existing variables with these names will be updated.</div>
    </div>
    <div class="bottom-bar" style="flex-direction:column;gap:8px;">
      <button class="btn-primary btn-wide" id="vars-cta" aria-label="Create variables" title="Create Figma Variables in your file. You can undo with Cmd+Z.">Create ${n} variables</button>
      <span class="hint-text">Undo with &#8984;Z</span>
    </div>
  `

  // Render color rows
  const list = document.getElementById('vars-list')!
  state.palette.forEach((color, i) => {
    const role = ROLES[i] || `color-${i + 1}`
    const row = document.createElement('div')
    row.className = 'card-row'
    row.innerHTML = `
      <span class="card-square" style="background:${color.hex}"></span>
      <span class="card-label">${role}</span>
      <span class="card-value">${color.hex}</span>
    `
    list.appendChild(row)
  })

  // Events
  el.querySelector('#vars-back')!.addEventListener('click', () => navigate('home'))
  const prefixInput = document.getElementById('vars-prefix') as HTMLInputElement
  prefixInput.addEventListener('input', () => { state.prefix = prefixInput.value.trim() || 'Paletta' })
  const shadesCheckbox = document.getElementById('vars-shades') as HTMLInputElement
  const cta = document.getElementById('vars-cta') as HTMLButtonElement
  const updateVarsCTA = () => {
    const shades = shadesCheckbox.checked
    const total = shades ? n * 11 : n
    cta.textContent = `Create ${total} variable${total !== 1 ? 's' : ''}`
    const sub = document.getElementById('vars-shade-sub')
    if (sub) sub.textContent = `${n} \u00d7 10 = ${n * 10} extra variables`
  }
  shadesCheckbox.addEventListener('change', () => {
    if (!state.isPro && shadesCheckbox.checked) {
      shadesCheckbox.checked = false
      showProModal()
      return
    }
    updateVarsCTA()
  })
  cta.addEventListener('click', () => {
    send({
      type: 'push-variables',
      colors: state.palette,
      prefix: state.prefix,
      includeShades: shadesCheckbox.checked,
    })
    cta.classList.add('btn-success')
    const total = shadesCheckbox.checked ? n * 11 : n
    cta.textContent = `Created ${total} variables`
    setTimeout(() => {
      cta.classList.remove('btn-success')
      updateVarsCTA()
    }, 2000)
  })
}

// ── Code screen ───────────────────────────────────────────────────
function renderCodeScreen() {
  const el = document.getElementById('screen-code')!
  if (state.palette.length === 0) {
    el.innerHTML = `
      <div class="header-bar">
        <div class="header-left">
          <button class="back-btn" id="code-back" aria-label="Go back" title="Go back to home">${ICONS.chevronLeft}<span>Back</span></button>
        </div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">${ICONS.code}</div>
        <h2 class="empty-title">No palette yet</h2>
        <p class="empty-body">Generate a palette in Studio first, then copy it as code.</p>
        <button class="empty-cta" id="code-studio-btn" aria-label="Go to Studio">Go to Studio</button>
      </div>
    `
    el.querySelector('#code-back')!.addEventListener('click', () => navigate('home'))
    el.querySelector('#code-studio-btn')!.addEventListener('click', () => navigate('studio'))
    return
  }

  const code = state.codeTab === 'css' ? generateCSS() : generateTailwind()
  el.innerHTML = `
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" id="code-back" aria-label="Go back" title="Go back to home">${ICONS.chevronLeft}<span>Back</span></button>
      </div>
    </div>
    <div class="scroll-area">
      <h2 class="section-title">Copy Code</h2>
      <div class="seg-control" id="code-tabs">
        <button class="seg-btn${state.codeTab === 'css' ? ' active' : ''}" data-tab="css" aria-label="CSS" title="Show CSS custom properties">CSS</button>
        <button class="seg-btn${state.codeTab === 'tailwind' ? ' active' : ''}" data-tab="tailwind" aria-label="Tailwind" title="Show Tailwind config">Tailwind${!state.isPro ? ' <span class="pro-badge-sm">PRO</span>' : ''}</button>
      </div>
      <pre class="code-block" id="code-block">${escapeHTML(code)}</pre>
    </div>
    <div class="bottom-bar" style="flex-direction:column;gap:8px;">
      <button class="btn-primary btn-wide" id="code-copy" aria-label="Copy to clipboard" title="Copy the code to your clipboard">Copy ${state.codeTab === 'css' ? 'CSS' : 'Tailwind'}</button>
    </div>
  `

  el.querySelector('#code-back')!.addEventListener('click', () => navigate('home'))
  document.querySelectorAll('#code-tabs .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = (btn as HTMLElement).dataset.tab as 'css' | 'tailwind'
      if (tab === 'tailwind' && !state.isPro) {
        showProModal()
        return
      }
      state.codeTab = tab
      renderCodeScreen()
    })
  })
  document.getElementById('code-copy')!.addEventListener('click', () => {
    const text = state.codeTab === 'css' ? generateCSS() : generateTailwind()
    const copyBtn = document.getElementById('code-copy') as HTMLButtonElement
    if (copyToClipboard(text)) {
      send({ type: 'notify', message: `Copied ${state.codeTab === 'css' ? 'CSS' : 'Tailwind'} config` })
      copyBtn.classList.add('btn-success')
      copyBtn.textContent = 'Copied!'
      setTimeout(() => {
        copyBtn.classList.remove('btn-success')
        copyBtn.textContent = `Copy ${state.codeTab === 'css' ? 'CSS' : 'Tailwind'}`
      }, 2000)
    } else {
      showToast('Failed to copy')
    }
  })
}

// ── Contrast screen ───────────────────────────────────────────────
function renderContrastScreen() {
  const el = document.getElementById('screen-contrast')!
  if (state.palette.length === 0) {
    el.innerHTML = `
      <div class="header-bar">
        <div class="header-left">
          <button class="back-btn" id="contrast-back" aria-label="Go back" title="Go back to home">${ICONS.chevronLeft}<span>Back</span></button>
        </div>
      </div>
      <div class="empty-state">
        <div class="empty-icon">${ICONS.checkCircle}</div>
        <h2 class="empty-title">No palette yet</h2>
        <p class="empty-body">Generate a palette in Studio first, then check contrast.</p>
        <button class="empty-cta" id="contrast-studio-btn" aria-label="Go to Studio">Go to Studio</button>
      </div>
    `
    el.querySelector('#contrast-back')!.addEventListener('click', () => navigate('home'))
    el.querySelector('#contrast-studio-btn')!.addEventListener('click', () => navigate('studio'))
    return
  }

  // Build pairs: each color vs white and black
  type Pair = { hex: string; bg: string; bgLabel: string; role: string; ratio: number; label: string; pass: boolean }
  const pairs: Pair[] = []
  state.palette.forEach((color, i) => {
    const role = ROLES[i] || `color-${i + 1}`
    const onWhite = contrastRatio(color.hex, '#FFFFFF')
    const onBlack = contrastRatio(color.hex, '#000000')
    pairs.push({
      hex: color.hex, bg: '#FFFFFF', bgLabel: 'white', role,
      ratio: onWhite,
      label: onWhite >= 7 ? 'AAA' : onWhite >= 4.5 ? 'AA' : 'Fail',
      pass: onWhite >= 4.5,
    })
    pairs.push({
      hex: color.hex, bg: '#000000', bgLabel: 'black', role,
      ratio: onBlack,
      label: onBlack >= 7 ? 'AAA' : onBlack >= 4.5 ? 'AA' : 'Fail',
      pass: onBlack >= 4.5,
    })
  })
  const passCount = pairs.filter(p => p.pass).length

  el.innerHTML = `
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" id="contrast-back" aria-label="Go back" title="Go back to home">${ICONS.chevronLeft}<span>Back</span></button>
      </div>
    </div>
    <div class="scroll-area">
      <h2 class="section-title">Contrast Checker</h2>
      <p class="section-subtitle">${passCount}/${pairs.length} pairs pass AA</p>
      <div class="section-pad" style="display:flex;flex-direction:column;gap:6px;padding-bottom:16px;" id="contrast-list"></div>
    </div>
  `

  el.querySelector('#contrast-back')!.addEventListener('click', () => navigate('home'))
  const list = document.getElementById('contrast-list')!
  pairs.forEach(p => {
    const row = document.createElement('div')
    row.className = 'contrast-pair'
    row.innerHTML = `
      <span class="card-square" style="background:${p.hex}"></span>
      <span class="contrast-on">on</span>
      <span class="card-square" style="background:${p.bg}"></span>
      <span class="contrast-label">${p.role} on ${p.bgLabel}</span>
      <span class="contrast-ratio">${p.ratio.toFixed(1)}</span>
      <span class="card-badge ${p.pass ? 'card-badge-pass' : 'card-badge-fail'}">${p.label}</span>
    `
    list.appendChild(row)
  })
}

// ── Pro modal ─────────────────────────────────────────────────────
function renderProModal() {
  const el = document.getElementById('pro-modal')!
  const isYearly = state.proPlan === 'yearly'
  const price = isYearly ? '$3.75' : '$5'
  const period = '/mo'
  const features = [
    '<strong>AI palette</strong> from text prompt',
    '<strong>6, 7 &amp; 8</strong> color palettes',
    '<strong>Unlimited</strong> saved palettes',
    'Image &rarr; palette <strong>extraction</strong>',
    '<strong>Accessibility lens</strong> — vision sim',
    'Full <strong>shade scales</strong> (50-900)',
    'Export <strong>without watermark</strong>',
  ]

  el.innerHTML = `
    <button class="pro-close" id="pro-close" aria-label="Close" title="Close">${ICONS.x}</button>
    <div class="pro-content">
      <span class="pro-tag">+PALETTA PRO</span>
      <h2 class="pro-headline">Unlock the full toolkit</h2>
      <p class="pro-sub">Everything you need to ship palettes faster. Cancel anytime.</p>
      <div class="pro-features">
        ${features.map(f => `<div class="pro-feature">${ICONS.check} <span>${f}</span></div>`).join('')}
      </div>
      <div class="seg-control" style="margin:4px 0;width:100%;" id="pro-plan-toggle">
        <button class="seg-btn${!isYearly ? ' active' : ''}" data-plan="monthly" aria-label="Monthly plan">Monthly</button>
        <button class="seg-btn${isYearly ? ' active' : ''}" data-plan="yearly" aria-label="Yearly plan">Yearly <span class="yearly-badge">-25%</span></button>
      </div>
      <div class="pro-price-row">
        <span class="pro-price">${price}</span>
        <span class="pro-period">${period}</span>
      </div>
      <button class="btn-primary btn-large btn-wide" id="pro-cta" aria-label="Go Pro" title="Subscribe to Paletta Pro">Go Pro &mdash; ${price}${period}</button>
    </div>
    <div class="pro-footer">
      <span>Launch pricing &middot; Powered by Stripe</span>
      <button class="btn-ghost" id="pro-later" aria-label="Maybe later">Maybe later</button>
    </div>
  `

  el.querySelector('#pro-close')!.addEventListener('click', hideProModal)
  el.querySelector('#pro-later')!.addEventListener('click', hideProModal)
  el.querySelector('#pro-cta')!.addEventListener('click', () => {
    if (state.isSignedIn) {
      window.open('https://www.usepaletta.io', '_blank')
      send({ type: 'notify', message: 'Opening usepaletta.io' })
    } else {
      hideProModal()
      handleLogin()
    }
  })
  document.querySelectorAll('#pro-plan-toggle .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.proPlan = (btn as HTMLElement).dataset.plan as 'monthly' | 'yearly'
      renderProModal()
    })
  })
}

// ── Theme management ──────────────────────────────────────────────
function setTheme(mode: 'light' | 'system' | 'dark') {
  state.themeMode = mode
  const html = document.documentElement
  if (mode === 'light') {
    html.classList.remove('figma-dark')
  } else if (mode === 'dark') {
    html.classList.add('figma-dark')
  } else {
    // System: detect from Figma or OS
    const isDark = html.dataset.figmaTheme === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches
    html.classList.toggle('figma-dark', isDark)
  }
  // Update toggle buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    const isActive = (btn as HTMLElement).dataset.theme === mode
    btn.classList.toggle('active', isActive)
    btn.setAttribute('aria-checked', String(isActive))
  })
}

// ── HTML escape ───────────────────────────────────────────────────
function escapeHTML(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── Handle messages from plugin sandbox ───────────────────────────
window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage as PluginMessage
  if (!msg) return

  switch (msg.type) {
    case 'init':
      state.savedPalettes = msg.palettes || []
      initAiUsage(msg.aiUsage)
      initAuth(msg.auth)
      updateHomeAuthUI()
      updateProUI()
      if (!msg.hasSeenOnboarding) {
        send({ type: 'set-onboarded' })
      }
      break

    case 'palette-generated':
      state.palette = msg.colors
      if (state.screen === 'studio') {
        renderStudioBars()
        renderStudioAccordions()
      }
      break

    case 'colors-applied':
      showToast(`Applied to ${msg.count} layer${msg.count !== 1 ? 's' : ''}`)
      break

    case 'variables-pushed':
      // Handled by the CTA button success state in renderVarsScreen
      break

    case 'colors-extracted': {
      state.palette = msg.colors.map(hex => ({ hex, name: hex, locked: false }))
      state.colorCount = msg.colors.length
      navigate('studio')
      showToast(`Extracted ${msg.colors.length} colors`)
      break
    }

    case 'selection-changed':
      state.hasSelection = msg.hasSelection
      state.selectionCount = msg.count
      break

    case 'palettes-loaded':
      state.savedPalettes = msg.palettes
      if (state.screen === 'library') renderLibraryScreen()
      break

    case 'palette-saved':
      state.savedPalettes.unshift(msg.palette)
      showToast('Saved!')
      break

    case 'palette-deleted':
      state.savedPalettes = state.savedPalettes.filter(p => p.id !== msg.id)
      if (state.screen === 'library') renderLibraryScreen()
      break

    case 'error':
      showToast(msg.message)
      break
  }
}

// ── Keyboard navigation ───────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const proModal = document.getElementById('pro-modal')!
    if (proModal.classList.contains('active')) {
      hideProModal()
      e.preventDefault()
      return
    }
    if (state.screen !== 'home') {
      navigate('home')
      e.preventDefault()
    }
  }
  if (e.code === 'Space' && document.activeElement === document.body && state.screen === 'studio') {
    e.preventDefault()
    generatePalette()
  }
})

// ── Init ──────────────────────────────────────────────────────────
buildHomeScreen()
buildExtractScreen()
setTheme('system')
send({ type: 'ui-ready', count: state.colorCount })
