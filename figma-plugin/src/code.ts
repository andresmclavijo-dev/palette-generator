/**
 * Paletta Figma Plugin — Sandbox code
 *
 * Runs in Figma's main thread with access to the Figma Plugin API.
 * Communicates with the UI via figma.ui.postMessage / figma.ui.onmessage.
 */
import { generateByMode, getColorName, hexToFigmaRGB, figmaRGBToHex, makePaletteColors, generateShadeScale } from './colorEngine'
import type { UIMessage, PluginMessage, PaletteColor, SavedPalette } from './types'

// ── Plugin state ─────────────────────────────────────────────────
let currentPalette: PaletteColor[] = []

// ── Launch UI ────────────────────────────────────────────────────
figma.showUI(__html__, { width: 420, height: 640, themeColors: true })

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

// ── Library storage key ──────────────────────────────────────────
const LIBRARY_KEY = 'paletta_saved_palettes'

async function loadPalettes(): Promise<SavedPalette[]> {
  const stored = await figma.clientStorage.getAsync(LIBRARY_KEY)
  return Array.isArray(stored) ? stored : []
}

async function savePalettes(palettes: SavedPalette[]): Promise<void> {
  await figma.clientStorage.setAsync(LIBRARY_KEY, palettes)
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
figma.ui.onmessage = async (msg: UIMessage) => {
  switch (msg.type) {
    case 'ui-ready': {
      const hasSeenOnboarding = await figma.clientStorage.getAsync('paletta_onboarded')
      const palettes = await loadPalettes()
      const aiUsage = await figma.clientStorage.getAsync('paletta_ai_usage') as { count: number; date: string } | null
      send({ type: 'init', hasSeenOnboarding: !!hasSeenOnboarding, palettes, aiUsage: aiUsage || null })

      const hexes = generateByMode('random', null, msg.count || 5)
      currentPalette = hexes.map(hex => ({ hex, name: getColorName(hex), locked: false }))
      send({ type: 'palette-generated', colors: currentPalette })

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
      figma.notify(`Applied to ${applied} layer${applied !== 1 ? 's' : ''}`)
      break
    }

    case 'push-variables': {
      const prefix = msg.prefix || 'Paletta'
      const includeShades = msg.includeShades
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
        let variable = existingVars.find(v =>
          v.name === roleName && v.variableCollectionId === collection!.id
        )
        if (!variable) {
          variable = figma.variables.createVariable(roleName, collection, 'COLOR')
        }
        variable.setValueForMode(modeId, hexToRGBA(msg.colors[i].hex))
        pushed++
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
      figma.notify(`Created ${pushed} variable${pushed !== 1 ? 's' : ''} in "${prefix}"`)
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
              if (!colors.includes(hex)) colors.push(hex)
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

    case 'save-palette': {
      const palettes = await loadPalettes()
      const palette: SavedPalette = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: msg.name,
        colors: msg.colors,
        date: new Date().toLocaleDateString('en-US'),
      }
      palettes.unshift(palette)
      await savePalettes(palettes)
      send({ type: 'palette-saved', palette })
      figma.notify('Palette saved')
      break
    }

    case 'load-palettes': {
      const palettes = await loadPalettes()
      send({ type: 'palettes-loaded', palettes })
      break
    }

    case 'delete-palette': {
      const palettes = await loadPalettes()
      const filtered = palettes.filter(p => p.id !== msg.id)
      await savePalettes(filtered)
      send({ type: 'palette-deleted', id: msg.id })
      figma.notify('Palette deleted')
      break
    }

    case 'set-onboarded': {
      await figma.clientStorage.setAsync('paletta_onboarded', true)
      break
    }

    case 'set-ai-usage': {
      await figma.clientStorage.setAsync('paletta_ai_usage', msg.usage)
      break
    }

    case 'notify': {
      figma.notify(msg.message)
      break
    }
  }
}
