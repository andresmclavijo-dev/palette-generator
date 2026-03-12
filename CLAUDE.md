# Paletta — Project Intelligence File
> Read this file at the start of every session before touching any code.

---

## Project Overview

**Paletta** is a color palette generator web app.
- **Live URL:** https://palette-generator-chi.vercel.app
- **GitHub:** https://github.com/andresmclavijo-dev/palette-generator
- **Local folder:** ~/Downloads/palette-gen
- **Owner:** Andres Clavijo (non-developer, Mac)
- **Deploy:** Push to `main` → Vercel auto-deploys

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React + Vite + TypeScript |
| Styling | Tailwind CSS (utility only, no custom config) |
| State | Zustand |
| Color logic | chroma-js |
| Deploy | Vercel (auto from GitHub main) |

---

## Folder Structure

```
src/
├── App.tsx                          # Root layout, header, harmony nav
├── components/palette/
│   ├── ColorSwatch.tsx              # Individual swatch (label, icons, action bar)
│   ├── CountPicker.tsx              # 3–8 color count selector
│   ├── ExportPanel.tsx              # CSS/Tailwind/Hex export bottom sheet
│   ├── HarmonyPicker.tsx            # Harmony mode tabs
│   ├── PaletteCanvas.tsx            # Swatch grid container
│   ├── ShadesPanel.tsx              # Shade scale panel
│   └── ShortcutLegend.tsx           # ? help popup
├── lib/colorEngine.ts               # Color generation logic
├── store/paletteStore.ts            # Zustand store
└── main.tsx
```

---

## Data Model

```ts
interface Swatch {
  id: string
  hex: string
  locked: boolean
}

interface PaletteState {
  swatches: Swatch[]
  count: number                      // 3–5 free, 6–8 Pro
  harmonyMode: HarmonyMode           // random|analogous|monochromatic|complementary|triadic
  seedColor: string | null
  history: Swatch[][]                // 20-step undo stack
  historyIndex: number
  // Actions: generate, setSwatches, setCount, lockSwatch, editSwatch, setHarmonyMode, setSeedColor, undo
}
```

---

## Design System

**Brand color:** `#1A73E8` (Google blue)
**Font:** System default (Inter-like)
**Border radius:** `rounded-full` for pills, `rounded-2xl` for panels
**Shadow:** `shadow-md` for floating elements, `shadow-xl` for modals
**Breakpoint:** `< 640px` = mobile layout

### Component patterns (Google Store style)
- **Active tab/pill:** Blue bg (`#1A73E8`), white text, `rounded-full`
- **Inactive pill:** `bg-gray-100`, gray text, `rounded-full`
- **Floating buttons:** White bg, `shadow-md`, `rounded-full`, min 40px
- **Bottom sheets:** White, `rounded-t-2xl`, `shadow-xl`, drag handle bar
- **Action bar:** White pill, `shadow-md`, icons 24px, dividers between actions
- **Touch targets:** Minimum 44×44px everywhere

### Icon conventions
- Size: 20–24px
- Stroke-width: 1.5
- Color: Inherit from context, white with drop-shadow on colored backgrounds
- Lock icon: Always white fill + `drop-shadow(0 1px 3px rgba(0,0,0,0.5))` — never inherits swatch color
- Drag handle + labels: Auto light/dark via `chroma.luminance() > 0.4` — light bg → dark icons, dark bg → light icons

---

## Layout Architecture (current as of M8)

```
[Header 56px — Paletta logo ············ Share  Export    ]
[Harmony tab bar 48px — Random·Analogous·Mono·Comp·Triadic]
[                  PALETTE CANVAS (flex-1)                ]
[? floating BL]   [↻ Generate floating BC]  [3·4·5 floating BR]
```

- No footer
- Harmony bar is sticky below header, white bg, `border-b border-gray-200`
- Switching harmony tab calls `generate()` immediately
- Floating elements sit over the canvas with `position: fixed` or `absolute`

### Mobile (< 640px)
- Swatches stack vertically (full width rows)
- Harmony tab bar scrolls horizontally (`overflow-x-auto`, hidden scrollbar)
- Same three floating elements
- Action bar appears on first tap, dismissed by ✕ or tapping swatch body

---

## Freemium Model

| Tier | Colors | Status |
|---|---|---|
| Free | 3, 4, 5 | Live |
| Pro | 6, 7, 8 | UI teased (✦ badge), not yet gated with payment |

**Pricing target:** $4/month or $36/year (below Coolors at $3–6/month)
**Competitor:** Coolors.co — we are positioned as cleaner, more modern alternative

---

## Milestone History

### ✅ M1–M3 — Core
Generate, lock, undo, harmony modes, hex editing, shades panel, color names, URL sharing

### ✅ M4 — Polish + Export
Toolbar click-through fix, label contrast, font sizes, count selector with Pro teaser, export panel (CSS/Tailwind/Hex)

### ✅ M5 — Visual redesign
White header, Paletta logo, floating Generate button, harmony labels spelled out, Google Store pill style throughout, spacebar hint tooltip, ? help popup

### ✅ M6 — Mobile layout
Vertical stacked swatches on mobile, drag handle, floating action bar (Copy/Shades/Edit), touch targets

### ✅ M7 — Mobile interactions
Action bar centered in swatch, slide-up animation, auto-generate on harmony switch, lock icon contrast fix, stronger lock feedback

### ✅ M8 — Layout overhaul
Harmony tabs moved to top nav, footer removed, floating controls (?, Generate, count), color picker on hex double-click, bigger labels (12px name, 16px hex bold), mobile scroll harmony bar

---

## Roadmap

### ✅ M9 — Interaction polish
Action bar anchored inside swatch, last swatch label fix, mobile safe area padding, drag handle contrast, harmony tab hover states, lock visual feedback (filled icon + overlay), onboarding "tap to lock" tooltip

### M10 — Icon contrast & mobile fixes (in progress)
- [x] Remove mystery chevron (fixed double overflow-x-auto on harmony bar)
- [x] Action bar position (bar above labels with 12px gap, flex-col layout)
- [x] Lock icon always white with drop-shadow(0 1px 3px rgba(0,0,0,0.5))
- [x] Auto light/dark icon logic (chroma luminance > 0.4 threshold for drag handle, labels)
- [x] Mobile safe area (floating-bottom with env(safe-area-inset-bottom))
- [x] Count picker visibility (32px items, 13px font, clear active state)

### M11 — Growth + conversion
- [ ] Pro upsell modal — when user taps 6/7/8, show compelling upgrade prompt (not just tooltip)
- [ ] First-visit tagline — "Generate beautiful color palettes instantly" shown once
- [ ] Palette history — last 10 generated palettes, swipeable
- [ ] Save palette — requires account (auth needed, big feature, plan carefully)

### M12 — Pro features (paid tier)
- [ ] 6–8 colors unlocked for Pro users
- [ ] AI palette from text prompt ("sunset over ocean")
- [ ] Image → palette extraction (upload photo)
- [ ] Full shade scales 100–900 (Tailwind-style)
- [ ] PNG / SVG export
- [ ] Contrast checker (WCAG AA/AAA)
- [ ] Color blindness preview (deuteranopia, protanopia, tritanopia)
- [ ] Team sharing / collections

---

## Known Issues (unresolved)

- Drag to reorder not yet implemented
- Pro features (6–8 colors) not gated with real payment — just tooltips
- No account/auth system yet
- Color picker "Picker" dropdown label is unclear — should be "Mode" or removed
- Shades panel icon (looks like a table) — unintuitive, needs redesign

---

## Deploy Commands

```bash
cd ~/Downloads/palette-gen
git add .
git commit -m "Milestone X: description"
git push origin main
```

## File Placement Reference

| File | Location |
|---|---|
| App.tsx | src/ |
| paletteStore.ts | src/store/ |
| colorEngine.ts | src/lib/ |
| All components | src/components/palette/ |

## Before Every Session

1. Read this file
2. Read all files in `src/` and `src/components/palette/`
3. Check current milestone in roadmap above
4. Run `npm run build` before starting to confirm clean baseline
5. Run `npm run build` again after changes to confirm zero TypeScript errors
