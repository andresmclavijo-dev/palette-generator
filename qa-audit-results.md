# QA Audit Results — Paletta Pre-Launch

**Date:** 2026-03-25
**Auditor:** Claude Code (automated)
**Scope:** src/ (excluding src/components/preview/ SVG templates)

---

## Summary

| Category | Critical | Warning | Info |
|----------|----------|---------|------|
| Design System Compliance | 17 (FIXED) | 8 | 3 |
| Accessibility (WCAG 2.1 AA) | 0 | 2 | 1 |
| Clean Code | 0 | 2 | 2 |
| **Total** | **17 (all fixed)** | **12** | **6** |

---

## Critical Issues (all FIXED)

### Design System — Banned Color Classes (FIXED)
All `bg-blue-*`, `text-blue-*`, `text-green-*`, `text-red-*` replaced with semantic tokens:

| File | Change |
|------|--------|
| `src/components/palette/ColorSwatch.tsx:305,307,436,438` | `text-green-300` → `text-success`, `text-red-300` → `text-destructive` |
| `src/components/ui/SavedPalettesPanel.tsx:134` | `bg-blue-50 text-blue-600 hover:bg-blue-100` → `bg-primary/8 text-primary hover:bg-primary/12` |
| `src/components/ui/SavedPalettesPanel.tsx:157` | `bg-blue-50 border-blue-100` → `bg-primary/8 border-primary/12` |
| `src/components/ui/MobileDrawer.tsx:133,218` | `bg-blue-50` → `bg-primary/8` |
| `src/components/ui/MobileDrawer.tsx:226` | `text-blue-500` → `text-primary` |
| `src/components/palette/VisionSimulator.tsx:86` | `bg-blue-50 text-blue-600` → `bg-primary/8 text-primary` |
| `src/components/palette/ToolsSheet.tsx:156,184,194` | `bg-blue-50 text-blue-600` → `bg-primary/8 text-primary` |
| `src/components/palette/ToolsSheet.tsx:166` | `text-blue-500` → `text-primary` |
| `src/components/palette/ColorPicker.tsx:194` | `text-blue-500 active:text-blue-700` → `text-primary active:text-primary/80` |

### Font Size Below 10px (FIXED)
| File | Change |
|------|--------|
| `src/features/studio/Dock.tsx:213` | `fontSize: 9` → `fontSize: 10` (badge count) |

### Non-Token Border Radius (FIXED)
| File | Change |
|------|--------|
| `src/features/studio/DesktopStudio.tsx:678` | `borderRadius: 10` → `borderRadius: 12` (pill token) |

---

## Warning Issues

### Design System
1. **ProductMockups.tsx** — Extensive hardcoded hex colors (#fff, #FAFAFA, etc). Acceptable as a design preview component but ideally should use tokens.
2. **DesktopStudio.tsx** — Multiple inline `backgroundColor: '#ffffff'` / `'#000000'` for contrast preview cards (lines 751-752). These are intentional contrast reference values.
3. **ShadesSpecimen.tsx:108-131** — Hardcoded tooltip colors (`#1F2937`, `#ffffff`, `#000000`). Tooltip bg matches DarkTooltip pattern.
4. **DesktopStudio.tsx:837** — `rgba(0,0,0,0.35)` for locked swatch label bg.
5. **bg-white/10** used in DesktopStudio.tsx (lines 871, 887, 1074) for icon hover on colored backgrounds — acceptable for overlay patterns.
6. **Hardcoded box-shadows** in Dock, UserMenu, PreviewMode, ColorInfoPopover — not using shadow tokens.
7. **Touch targets < 44px** — Minus/Plus count buttons at 32x32px in DesktopStudio.tsx (desktop-only, not mobile targets).
8. **borderRadius: 14** in ProductMockups.tsx (lines 24, 260, 495, 502, 512) — should be 16px card token.

### Accessibility
1. **ShadesPanel.tsx:48-52** — Shade rows use `<div>` with click handlers instead of `<button>`.
2. **MobileLibrary.tsx** — Some palette action rows use `<div>` with onClick instead of `<button>`.

---

## Info Issues

### Design System
1. **ProUpgradeModal.tsx:55** — Default palette hex array hardcoded (preview colors, not UI tokens).
2. **ShortcutLegend.tsx:46** — `bg-white/10 text-white/60` for kbd elements on dark overlay (acceptable).
3. **PluginAuth.tsx** — Uses string borderRadius values ('12px', '8px') instead of numbers.

### Clean Code
1. **TODO comments** (2 valid tech debt items):
   - `src/App.tsx:31` — "TODO: code-split with React.lazy()"
   - `src/lib/posthog.ts:1` — "TODO: lazy-load posthog-js (~40KB)"
2. **Console statements** — All `console.error` calls are in error handlers (intentional). All `console.log` calls in usePro.ts are guarded by `import.meta.env.DEV`.

### Accessibility (all passing)
- Icon-only buttons: all have `aria-label` ✅
- Focus-visible styles: comprehensive implementation ✅
- Form labels: all inputs have labels/aria-label ✅
- Image alt text: all correct ✅
- `aria-hidden="true"`: 91 correct usages ✅
- `prefers-reduced-motion`: all animations respect ✅
- `<html lang="en">`: present ✅
- Heading hierarchy: no skipped levels ✅
- TypeScript: `npx tsc --noEmit` passes clean ✅
- Error boundaries: ErrorBoundary wraps app root ✅
