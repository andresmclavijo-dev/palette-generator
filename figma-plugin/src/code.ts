/**
 * Paletta Figma Plugin — Sandbox code
 *
 * Runs in Figma's main thread with access to the Figma Plugin API.
 * Communicates with the UI via figma.ui.postMessage / figma.ui.onmessage.
 */
import { generateByMode, getColorName, hexToFigmaRGB, figmaRGBToHex, makePaletteColors, generateShadeScale } from './colorEngine'
import type { UIMessage, PluginMessage, PaletteColor } from './types'

// ── Plugin state ─────────────────────────────────────────────────
let currentPalette: PaletteColor[] = []

// ── Launch UI ────────────────────────────────────────────────────
figma.showUI(__html__, { width: 360, height: 620, themeColors: true })

// ── Send message helper ──────────────────────────────────────────
function send(msg: PluginMessage) {
  figma.ui.postMessage(msg)
}

// ── Hex → Figma RGBA (0-1 range) ─────────────────────────────────
function hexToRGBA(hex: string): RGBA {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16) / 255
  const g = parseInt(c.substring(2, 4), 16) / 255
  const b = parseInt(c.substring(4, 6), 16) / 255
  return { r, g, b, a: 1 }
}

// ── Role names for variables ─────────────────────────────────────
const ROLES = ['primary', 'secondary', 'accent', 'surface', 'muted', 'highlight', 'border', 'overlay']

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
figma.ui.onmessage = async (msg: UIMessage) => {
  switch (msg.type) {
    case 'ui-ready': {
      // Check onboarding state
      const hasSeenOnboarding = await figma.clientStorage.getAsync('paletta_onboarded')
      send({ type: 'init', hasSeenOnboarding: !!hasSeenOnboarding })

      // Generate an initial palette on launch
      const hexes = generateByMode('random', null, msg.count || 5)
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
      figma.notify(`✓ Applied to ${applied} layer${applied !== 1 ? 's' : ''}`)
      break
    }

    case 'push-variables': {
      const prefix = msg.prefix || 'Paletta'
      const includeShades = msg.includeShades

      // Find or create collection
      const collections = figma.variables.getLocalVariableCollections()
      let collection = collections.find(c => c.name === prefix)
      if (!collection) {
        collection = figma.variables.createVariableCollection(prefix)
      }

      const modeId = collection.modes[0].modeId
      const existingVars = figma.variables.getLocalVariables('COLOR')

      let pushed = 0
      for (let i = 0; i < msg.colors.length; i++) {
        const roleName = ROLES[i] || `color-${i + 1}`

        // Push flat base variable
        let variable = existingVars.find(v =>
          v.name === roleName && v.variableCollectionId === collection!.id
        )
        if (!variable) {
          variable = figma.variables.createVariable(roleName, collection, 'COLOR')
        }
        variable.setValueForMode(modeId, hexToRGBA(msg.colors[i].hex))
        pushed++

        // Push shade ramp if requested
        if (includeShades) {
          const shades = generateShadeScale(msg.colors[i].hex)
          for (const { shade, hex } of shades) {
            const shadeName = `${roleName}/${shade}`
            let shadeVar = existingVars.find(v =>
              v.name === shadeName && v.variableCollectionId === collection!.id
            )
            if (!shadeVar) {
              shadeVar = figma.variables.createVariable(shadeName, collection, 'COLOR')
            }
            shadeVar.setValueForMode(modeId, hexToRGBA(hex))
            pushed++
          }
        }
      }

      send({ type: 'variables-pushed', count: pushed })
      figma.notify(`✓ Created ${pushed} variable${pushed !== 1 ? 's' : ''} in "${prefix}"`)
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

    case 'ai-generate': {
      send({ type: 'ai-loading', loading: true })

      try {
        const response = await figma.fetch('https://www.usepaletta.io/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: msg.prompt,
            colorCount: msg.count,
            isPro: true,
          }),
        })

        if (!response.ok) {
          throw new Error(`API ${response.status}`)
        }

        const data = await response.json() as { colors: string[] }
        if (!data.colors || !Array.isArray(data.colors)) {
          throw new Error('Invalid response')
        }

        currentPalette = data.colors.map(hex => ({
          hex,
          name: getColorName(hex),
          locked: false,
        }))
        send({ type: 'ai-loading', loading: false })
        send({ type: 'palette-generated', colors: currentPalette })
      } catch {
        send({ type: 'ai-loading', loading: false })
        const hexes = generateByMode('random', null, msg.count)
        currentPalette = hexes.map(hex => ({ hex, name: getColorName(hex), locked: false }))
        send({ type: 'palette-generated', colors: currentPalette })
        send({ type: 'error', message: 'AI unavailable — generated random palette instead' })
      }
      break
    }

    case 'set-onboarded': {
      await figma.clientStorage.setAsync('paletta_onboarded', true)
      break
    }

    case 'notify': {
      figma.notify(msg.message)
      break
    }
  }
}
