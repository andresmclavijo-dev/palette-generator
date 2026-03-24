/**
 * Paletta Figma Plugin — UI code
 *
 * Runs in Figma's iframe sandbox. Communicates with code.ts via postMessage.
 */
import type { UIMessage, PluginMessage, PaletteColor } from './types'

// ── Constants ─────────────────────────────────────────────────────
const ROLES = ['primary', 'secondary', 'accent', 'surface', 'muted', 'highlight', 'border', 'overlay']
const ROLE_ABBREVS = ['prim.', 'sec.', 'acc.', 'surf.', 'mut.', 'high.', 'bord.', 'over.']
const ROLE_ABBREVS_SHORT = ['p.', 's.', 'a.', 'sf.', 'm.', 'h.', 'b.', 'o.']

// ── DOM refs ─────────────────────────────────────────────────────
const mainView = document.getElementById('main-view')!
const paletteRow = document.getElementById('palette-row')!
const harmonySelect = document.getElementById('harmony-select') as HTMLSelectElement
const countSelect = document.getElementById('count-select') as HTMLSelectElement
const seedInput = document.getElementById('seed-input') as HTMLInputElement
const prefixInput = document.getElementById('prefix-input') as HTMLInputElement
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement
const extractBtn = document.getElementById('extract-btn') as HTMLButtonElement
const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement
const aiPromptInput = document.getElementById('ai-prompt-input') as HTMLInputElement
const aiGenerateBtn = document.getElementById('ai-generate-btn') as HTMLButtonElement
const statusEl = document.getElementById('status')!

// Scope picker
const scopeRadios = document.querySelectorAll<HTMLInputElement>('input[name="scope"]')
const shadeCheckboxContainer = document.getElementById('shade-checkbox')!
const includeShadesCheckbox = document.getElementById('include-shades') as HTMLInputElement
const ctaBtn = document.getElementById('cta-btn') as HTMLButtonElement

// Confirmation panel
const confirmPanel = document.getElementById('confirm-panel')!
const confirmCloseBtn = document.getElementById('confirm-close-btn') as HTMLButtonElement
const confirmCancelBtn = document.getElementById('confirm-cancel-btn') as HTMLButtonElement
const confirmPushBtn = document.getElementById('confirm-push-btn') as HTMLButtonElement
const confirmPrefixEl = document.getElementById('confirm-prefix')!
const confirmListEl = document.getElementById('confirm-list')!

// Onboarding
const onboardingOverlay = document.getElementById('onboarding')!
const onboardingDismissBtn = document.getElementById('onboarding-dismiss-btn') as HTMLButtonElement

// ── State ────────────────────────────────────────────────────────
let colors: PaletteColor[] = []
let hasSelection = false
let selectionCount = 0

// ── Send message to plugin sandbox ───────────────────────────────
function send(msg: UIMessage) {
  parent.postMessage({ pluginMessage: msg }, '*')
}

// ── WCAG contrast utilities ──────────────────────────────────────
function luminance(hex: string): number {
  const rgb = [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ].map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1)
  const l2 = luminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function getWcagBadge(hex: string): { label: string; pass: boolean } {
  const onWhite = contrastRatio(hex, '#FFFFFF')
  const onBlack = contrastRatio(hex, '#000000')
  const best = Math.max(onWhite, onBlack)
  if (best >= 7) return { label: 'AAA', pass: true }
  if (best >= 4.5) return { label: 'AA', pass: true }
  return { label: 'Fail', pass: false }
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16) / 255
  const g = parseInt(c.substring(2, 4), 16) / 255
  const b = parseInt(c.substring(4, 6), 16) / 255
  const lum = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  return lum > 0.4
}

function linearize(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

// ── Render palette swatches ──────────────────────────────────────
function renderPalette() {
  paletteRow.innerHTML = ''

  const isCompact = colors.length > 5
  paletteRow.classList.toggle('compact', isCompact)

  colors.forEach((color, i) => {
    const swatch = document.createElement('button')
    swatch.className = 'swatch'
    swatch.setAttribute('tabindex', '0')
    swatch.setAttribute('data-locked', String(color.locked))
    const roleAbbrev = isCompact
      ? (ROLE_ABBREVS_SHORT[i] || `c${i + 1}`)
      : (ROLE_ABBREVS[i] || `c${i + 1}`)
    const roleFull = ROLES[i] || `color-${i + 1}`
    swatch.title = `Click to lock/unlock this color. Locked colors stay when you regenerate.`
    swatch.setAttribute('aria-label', `${roleFull} ${color.name} ${color.hex}${color.locked ? ', locked' : ''}`)
    swatch.style.backgroundColor = color.hex

    const textColor = isLightColor(color.hex) ? '#000000' : '#ffffff'

    // Hex label
    const hexLabel = document.createElement('span')
    hexLabel.className = 'swatch-hex'
    hexLabel.textContent = color.hex.toUpperCase()
    hexLabel.style.color = textColor

    // WCAG badge
    const badge = getWcagBadge(color.hex)
    const badgeEl = document.createElement('span')
    badgeEl.className = `swatch-badge ${badge.pass ? 'swatch-badge-pass' : 'swatch-badge-fail'}`
    badgeEl.textContent = badge.label

    // Role abbreviation label
    const roleLabel = document.createElement('span')
    roleLabel.className = 'swatch-role'
    roleLabel.textContent = roleAbbrev
    roleLabel.style.color = textColor

    // Lock icon
    const lockIcon = document.createElement('span')
    lockIcon.className = 'swatch-lock'
    lockIcon.setAttribute('aria-label', color.locked ? 'Locked' : 'Unlocked')
    lockIcon.title = color.locked ? 'This color is locked. It won\'t change when you regenerate.' : 'Click to lock this color'
    lockIcon.innerHTML = color.locked
      ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
      : '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 8 0"/></svg>'

    swatch.appendChild(hexLabel)
    swatch.appendChild(badgeEl)
    swatch.appendChild(roleLabel)
    swatch.appendChild(lockIcon)

    swatch.addEventListener('click', () => {
      colors[i] = { ...colors[i], locked: !colors[i].locked }
      renderPalette()
    })

    paletteRow.appendChild(swatch)
  })

  updateCTA()
}

// ── Status messages ──────────────────────────────────────────────
function showStatus(text: string, type: 'info' | 'success' | 'error' = 'info') {
  statusEl.textContent = text
  statusEl.className = `status${type === 'success' ? ' status-success' : type === 'error' ? ' status-error' : ''}`

  if (type !== 'error') {
    setTimeout(() => {
      if (statusEl.textContent === text) statusEl.textContent = ''
    }, 3000)
  }
}

// ── Parse seed input ─────────────────────────────────────────────
function parseSeed(): string | null {
  const raw = seedInput.value.trim()
  if (!raw) return null
  const hex = raw.startsWith('#') ? raw : `#${raw}`
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
  }
  return null
}

// ── Scope picker ─────────────────────────────────────────────────
function getSelectedScope(): string {
  const checked = document.querySelector<HTMLInputElement>('input[name="scope"]:checked')
  return checked?.value || 'variables'
}

function updateCTA() {
  const scope = getSelectedScope()
  const n = colors.length
  const shades = includeShadesCheckbox.checked

  // Show/hide shade checkbox with animation
  shadeCheckboxContainer.classList.toggle('hidden', scope !== 'variables')

  switch (scope) {
    case 'variables':
      if (shades) {
        const total = n * 11 // N flat + N * 10 shades
        ctaBtn.textContent = `Create ${total} variables`
      } else {
        ctaBtn.textContent = `Create ${n} variable${n !== 1 ? 's' : ''}`
      }
      ctaBtn.disabled = n === 0
      break
    case 'copy-css':
      ctaBtn.textContent = 'Copy CSS variables'
      ctaBtn.disabled = n === 0
      break
    case 'copy-tailwind':
      ctaBtn.textContent = 'Copy Tailwind config'
      ctaBtn.disabled = n === 0
      break
    case 'apply':
      if (hasSelection) {
        ctaBtn.textContent = `Apply to ${selectionCount} frame${selectionCount !== 1 ? 's' : ''}`
        ctaBtn.disabled = false
      } else {
        ctaBtn.textContent = 'Select frames first'
        ctaBtn.disabled = true
      }
      break
  }
}

// Scope radio change
scopeRadios.forEach(radio => {
  radio.addEventListener('change', updateCTA)
})

// Shade checkbox change
includeShadesCheckbox.addEventListener('change', updateCTA)

// ── Clipboard helpers ────────────────────────────────────────────
function copyToClipboard(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  document.body.removeChild(textarea)
  return ok
}

function generateCSS(): string {
  return colors.map((c, i) => {
    const role = ROLES[i] || `color-${i + 1}`
    return `  --${role}: ${c.hex};`
  }).join('\n')
}

function generateTailwind(): string {
  const entries = colors.map((c, i) => {
    const role = ROLES[i] || `color-${i + 1}`
    return `      '${role}': '${c.hex}',`
  }).join('\n')
  return `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n${entries}\n      },\n    },\n  },\n}`
}

// ── Confirmation panel ───────────────────────────────────────────
function showConfirmPanel() {
  const prefix = prefixInput.value.trim() || 'Paletta'
  const shades = includeShadesCheckbox.checked
  const n = colors.length
  const total = shades ? n * 11 : n

  confirmPrefixEl.textContent = prefix
  confirmListEl.innerHTML = ''

  colors.forEach((color, i) => {
    const role = ROLES[i] || `color-${i + 1}`
    const item = document.createElement('div')
    item.className = 'confirm-item'
    item.innerHTML = `
      <span class="confirm-chip" style="background:${color.hex}"></span>
      <span class="confirm-role">${role}</span>
      <span class="confirm-hex">${color.hex}</span>
    `
    confirmListEl.appendChild(item)

    if (shades) {
      const note = document.createElement('div')
      note.className = 'confirm-shade-note'
      note.textContent = `+ ${role}/50 … ${role}/900 (10 shades)`
      confirmListEl.appendChild(note)
    }
  })

  confirmPushBtn.textContent = `Create ${total} variable${total !== 1 ? 's' : ''}`
  confirmPanel.style.display = 'flex'
}

function hideConfirmPanel() {
  confirmPanel.style.display = 'none'
}

function executePush() {
  send({
    type: 'push-variables',
    colors,
    prefix: prefixInput.value.trim() || 'Paletta',
    includeShades: includeShadesCheckbox.checked,
  })
  hideConfirmPanel()
}

confirmCloseBtn.addEventListener('click', hideConfirmPanel)
confirmCancelBtn.addEventListener('click', hideConfirmPanel)
confirmPushBtn.addEventListener('click', executePush)

// Escape closes confirmation panel
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (confirmPanel.style.display !== 'none') {
      hideConfirmPanel()
      e.preventDefault()
    }
  }
})

// ── CTA click handler ────────────────────────────────────────────
ctaBtn.addEventListener('click', () => {
  if (colors.length === 0) {
    showStatus('Generate a palette first', 'error')
    return
  }

  const scope = getSelectedScope()

  switch (scope) {
    case 'variables':
      showConfirmPanel()
      break

    case 'copy-css': {
      const css = `:root {\n${generateCSS()}\n}`
      if (copyToClipboard(css)) {
        send({ type: 'notify', message: '✓ Copied CSS variables' })
        showStatus('Copied CSS variables', 'success')
      } else {
        showStatus('Failed to copy', 'error')
      }
      break
    }

    case 'copy-tailwind': {
      const tw = generateTailwind()
      if (copyToClipboard(tw)) {
        send({ type: 'notify', message: '✓ Copied Tailwind config' })
        showStatus('Copied Tailwind config', 'success')
      } else {
        showStatus('Failed to copy', 'error')
      }
      break
    }

    case 'apply':
      if (!hasSelection) {
        showStatus('Select frames to apply colors', 'error')
        return
      }
      send({
        type: 'apply-to-selection',
        colors: colors.map(c => c.hex),
      })
      break
  }
})

// ── Reset ────────────────────────────────────────────────────────
function resetAll() {
  aiPromptInput.value = ''
  seedInput.value = ''
  includeShadesCheckbox.checked = false

  // Reset scope to variables
  const variablesRadio = document.querySelector<HTMLInputElement>('input[name="scope"][value="variables"]')
  if (variablesRadio) variablesRadio.checked = true

  // Reset count to 5
  countSelect.value = '5'

  // Reset harmony to random
  harmonySelect.value = 'random'

  // Generate fresh random palette
  send({
    type: 'generate',
    mode: 'random',
    count: 5,
    seedColor: null,
    lockedIndices: [],
  })

  updateCTA()
  showStatus('Reset', 'info')
}

resetBtn.addEventListener('click', resetAll)

// ── Onboarding ───────────────────────────────────────────────────
function showOnboarding() {
  onboardingOverlay.style.display = 'flex'
}

function dismissOnboarding() {
  onboardingOverlay.style.display = 'none'
  send({ type: 'set-onboarded' })
}

onboardingDismissBtn.addEventListener('click', dismissOnboarding)

// ── Event handlers ───────────────────────────────────────────────
generateBtn.addEventListener('click', () => {
  const lockedIndices = colors
    .map((c, i) => c.locked ? i : -1)
    .filter(i => i >= 0)

  send({
    type: 'generate',
    mode: harmonySelect.value as UIMessage & { type: 'generate' } extends { mode: infer M } ? M : never,
    count: parseInt(countSelect.value),
    seedColor: parseSeed(),
    lockedIndices,
  })
})

extractBtn.addEventListener('click', () => {
  if (!hasSelection) {
    showStatus('Select a frame with an image fill', 'error')
    return
  }
  send({ type: 'extract-from-selection' })
})

aiGenerateBtn.addEventListener('click', () => {
  const prompt = aiPromptInput.value.trim()
  if (!prompt) {
    showStatus('Enter a prompt first', 'error')
    return
  }
  send({
    type: 'ai-generate',
    prompt,
    count: parseInt(countSelect.value),
  })
})

aiPromptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    aiGenerateBtn.click()
  }
})

// Keyboard: spacebar to generate
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.activeElement === document.body) {
    e.preventDefault()
    generateBtn.click()
  }
})

// ── Handle messages from plugin sandbox ──────────────────────────
window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage as PluginMessage
  if (!msg) return

  switch (msg.type) {
    case 'init':
      if (!msg.hasSeenOnboarding) {
        showOnboarding()
      }
      break

    case 'palette-generated':
      colors = msg.colors
      renderPalette()
      break

    case 'colors-applied':
      showStatus(`Applied to ${msg.count} layer${msg.count !== 1 ? 's' : ''}`, 'success')
      break

    case 'variables-pushed':
      showStatus(`Created ${msg.count} variable${msg.count !== 1 ? 's' : ''}`, 'success')
      break

    case 'ai-loading':
      aiGenerateBtn.disabled = msg.loading
      if (msg.loading) {
        aiGenerateBtn.classList.add('btn-loading')
        aiGenerateBtn.textContent = '…'
      } else {
        aiGenerateBtn.classList.remove('btn-loading')
        aiGenerateBtn.textContent = 'AI'
      }
      break

    case 'colors-extracted': {
      colors = msg.colors.map(hex => ({
        hex,
        name: hex,
        locked: false,
      }))
      renderPalette()
      showStatus(`Extracted ${msg.colors.length} color${msg.colors.length !== 1 ? 's' : ''}`, 'success')
      break
    }

    case 'selection-changed':
      hasSelection = msg.hasSelection
      selectionCount = msg.count
      updateCTA()
      break

    case 'error':
      showStatus(msg.message, 'error')
      break
  }
}

// ── Figma dark theme detection ───────────────────────────────────
const isDark = document.documentElement.dataset.figmaTheme === 'dark' ||
  window.matchMedia('(prefers-color-scheme: dark)').matches
if (isDark) {
  document.documentElement.classList.add('figma-dark')
}

// ── Tell the sandbox we're ready ─────────────────────────────────
send({ type: 'ui-ready', count: parseInt(countSelect.value) })
