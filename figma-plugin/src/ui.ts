/**
 * Paletta Figma Plugin — UI code
 *
 * Runs in Figma's iframe sandbox. Communicates with code.ts via postMessage.
 */
import type { UIMessage, PluginMessage, PaletteColor } from './types'

// ── DOM refs ─────────────────────────────────────────────────────
const paletteRow = document.getElementById('palette-row')!
const harmonySelect = document.getElementById('harmony-select') as HTMLSelectElement
const countSelect = document.getElementById('count-select') as HTMLSelectElement
const seedInput = document.getElementById('seed-input') as HTMLInputElement
const prefixInput = document.getElementById('prefix-input') as HTMLInputElement
const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement
const applyBtn = document.getElementById('apply-btn') as HTMLButtonElement
const stylesBtn = document.getElementById('styles-btn') as HTMLButtonElement
const extractBtn = document.getElementById('extract-btn') as HTMLButtonElement
const statusEl = document.getElementById('status')!

// ── State ────────────────────────────────────────────────────────
let colors: PaletteColor[] = []
let hasSelection = false

// ── Send message to plugin sandbox ───────────────────────────────
function send(msg: UIMessage) {
  parent.postMessage({ pluginMessage: msg }, '*')
}

// ── Render palette swatches ──────────────────────────────────────
function renderPalette() {
  paletteRow.innerHTML = ''

  colors.forEach((color, i) => {
    const swatch = document.createElement('button')
    swatch.className = 'swatch'
    swatch.setAttribute('role', 'button')
    swatch.setAttribute('tabindex', '0')
    swatch.setAttribute('data-locked', String(color.locked))
    swatch.setAttribute('aria-label', `${color.name} ${color.hex}${color.locked ? ', locked' : ''}`)
    swatch.style.backgroundColor = color.hex

    // Text color for readability
    const textColor = isLightColor(color.hex) ? '#000000' : '#ffffff'

    const hexLabel = document.createElement('span')
    hexLabel.className = 'swatch-hex'
    hexLabel.textContent = color.hex.toUpperCase()
    hexLabel.style.color = textColor

    const lockIcon = document.createElement('span')
    lockIcon.className = 'swatch-lock'
    lockIcon.textContent = color.locked ? '🔒' : '🔓'
    lockIcon.style.color = '#ffffff'

    swatch.appendChild(hexLabel)
    swatch.appendChild(lockIcon)

    // Toggle lock on click
    swatch.addEventListener('click', () => {
      colors[i] = { ...colors[i], locked: !colors[i].locked }
      renderPalette()
    })

    paletteRow.appendChild(swatch)
  })
}

// ── Simple luminance check ───────────────────────────────────────
function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16) / 255
  const g = parseInt(c.substring(2, 4), 16) / 255
  const b = parseInt(c.substring(4, 6), 16) / 255

  // Relative luminance (sRGB)
  const lum = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
  return lum > 0.4
}

function linearize(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
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

applyBtn.addEventListener('click', () => {
  send({
    type: 'apply-to-selection',
    colors: colors.map(c => c.hex),
  })
})

stylesBtn.addEventListener('click', () => {
  send({
    type: 'create-styles',
    colors,
    prefix: prefixInput.value.trim(),
  })
})

extractBtn.addEventListener('click', () => {
  send({ type: 'extract-from-selection' })
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
    case 'palette-generated':
      colors = msg.colors
      renderPalette()
      break

    case 'colors-applied':
      showStatus(`Applied to ${msg.count} layer${msg.count !== 1 ? 's' : ''}`, 'success')
      break

    case 'styles-created':
      showStatus(`Created ${msg.count} style${msg.count !== 1 ? 's' : ''}`, 'success')
      break

    case 'colors-extracted': {
      colors = msg.colors.map(hex => ({
        hex,
        name: hex, // Name will come from the sandbox on next generate
        locked: false,
      }))
      renderPalette()
      showStatus(`Extracted ${msg.colors.length} color${msg.colors.length !== 1 ? 's' : ''}`, 'success')
      break
    }

    case 'selection-changed':
      hasSelection = msg.hasSelection
      applyBtn.disabled = !hasSelection
      extractBtn.disabled = !hasSelection
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
send({ type: 'ui-ready' })
