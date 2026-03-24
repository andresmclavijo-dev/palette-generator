/**
 * Paletta Figma Plugin — Sandbox code
 *
 * Runs in Figma's main thread with access to the Figma Plugin API.
 * Communicates with the UI via figma.ui.postMessage / figma.ui.onmessage.
 */
import { generateByMode, getColorName, hexToFigmaRGB, figmaRGBToHex, makePaletteColors } from './colorEngine'
import type { UIMessage, PluginMessage, PaletteColor } from './types'

// ── Plugin state ─────────────────────────────────────────────────
let currentPalette: PaletteColor[] = []

// ── Launch UI ────────────────────────────────────────────────────
figma.showUI(__html__, { width: 360, height: 520, themeColors: true })

// ── Send message helper ──────────────────────────────────────────
function send(msg: PluginMessage) {
  figma.ui.postMessage(msg)
}

// ── Selection change listener ────────────────────────────────────
figma.on('selectionchange', () => {
  const sel = figma.currentPage.selection
  send({
    type: 'selection-changed',
    hasSelection: sel.length > 0,
    count: sel.length,
  })
})

// ── Handle messages from UI ──────────────────────────────────────
figma.ui.onmessage = (msg: UIMessage) => {
  switch (msg.type) {
    case 'ui-ready': {
      // Generate an initial palette on launch
      const hexes = generateByMode('random', null, 5)
      currentPalette = hexes.map(hex => ({ hex, name: getColorName(hex), locked: false }))
      send({ type: 'palette-generated', colors: currentPalette })

      // Send initial selection state
      const sel = figma.currentPage.selection
      send({ type: 'selection-changed', hasSelection: sel.length > 0, count: sel.length })
      break
    }

    case 'generate': {
      const hexes = generateByMode(msg.mode, msg.seedColor, msg.count)
      currentPalette = makePaletteColors(hexes, msg.lockedIndices, currentPalette)
      send({ type: 'palette-generated', colors: currentPalette })
      break
    }

    case 'apply-to-selection': {
      const selection = figma.currentPage.selection
      if (selection.length === 0) {
        send({ type: 'error', message: 'Select at least one layer' })
        return
      }

      let applied = 0
      for (const node of selection) {
        if ('fills' in node) {
          const colorIndex = applied % msg.colors.length
          const rgb = hexToFigmaRGB(msg.colors[colorIndex])
          const fills: SolidPaint[] = [{ type: 'SOLID', color: rgb }]
          node.fills = fills
          applied++
        }
      }

      send({ type: 'colors-applied', count: applied })
      break
    }

    case 'create-styles': {
      let created = 0
      for (const color of msg.colors) {
        const styleName = msg.prefix
          ? `${msg.prefix}/${color.name}`
          : color.name

        const style = figma.createPaintStyle()
        style.name = styleName
        style.paints = [{ type: 'SOLID', color: hexToFigmaRGB(color.hex) }]
        created++
      }

      send({ type: 'styles-created', count: created })
      figma.notify(`Created ${created} color style${created !== 1 ? 's' : ''}`)
      break
    }

    case 'extract-from-selection': {
      const selection = figma.currentPage.selection
      if (selection.length === 0) {
        send({ type: 'error', message: 'Select at least one layer' })
        return
      }

      const colors: string[] = []
      for (const node of selection) {
        if ('fills' in node && Array.isArray(node.fills)) {
          for (const fill of node.fills as readonly Paint[]) {
            if (fill.type === 'SOLID' && fill.visible !== false) {
              const hex = figmaRGBToHex(fill.color.r, fill.color.g, fill.color.b)
              if (!colors.includes(hex)) {
                colors.push(hex)
              }
            }
          }
        }
      }

      if (colors.length === 0) {
        send({ type: 'error', message: 'No solid fills found in selection' })
        return
      }

      send({ type: 'colors-extracted', colors })
      break
    }
  }
}
