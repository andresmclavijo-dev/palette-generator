# Paletta — Project Manifesto v1.0

> Internal reference for all agents, developers, and AI assistants working on Paletta.
> This document is the single source of truth for how Paletta is built, why decisions were made, and where we're going.

---

## 1. What Paletta Is

Paletta is an AI-powered color palette generator SaaS for product designers and frontend teams. It differentiates from Coolors through three pillars:

1. **See it in your product** — context preview (Landing/Dashboard/Mobile mockups)
2. **Accessibility built in** — WCAG validation, vision simulation, proactive a11y guidance
3. **Zero friction from idea to implementation** — export as CSS/Tailwind/SVG, shade scales 50-900, smart naming

**Live:** https://usepaletta.io
**Stack:** React + Vite + TypeScript + Tailwind + Zustand + chroma-js + Supabase + Stripe + PostHog + Anthropic claude-haiku-4-5
**Pricing:** Free (3 saves, 5 colors, 3 AI/day) · Pro $5/mo or $45/yr (unlimited)

---

## 2. The 3-Layer Architecture

Every frontend contribution MUST follow this hierarchy. No exceptions.

```
Layer 1: CSS Variables (globals.css)          ← SINGLE SOURCE OF TRUTH
   ↓ consumed by
Layer 2: Tailwind Config (tailwind.config.js) ← Maps variables to utility classes
   ↓ consumed by
Layer 3: Components (shadcn/ui)               ← Renders using Tailwind classes
```

**The rule:** Never hardcode a hex value. Never write `bg-[#6C47FF]`. Always use `bg-primary` which reads `var(--primary)` which is defined once in `globals.css`. Change the variable → everything updates.

---

## 3. The Design Language — Bento Studio

**Aesthetic:** Native macOS app / Safari-native. High use of `backdrop-blur`, subtle borders, soft elevation, warm neutral page background (#EEEEEC).

**The Golden Radius Rule:** `R_inner = R_outer - Padding`
- Bento container: 24px → Modal cards/dock: 16px → Pills/popovers: 12px → Buttons/inputs: 8px → Badges: 6px

**Button Tiers:** Dock 48px → Action bar/modal actions 36px → Bottom bar/close 32px

**Spacing:** 12px base unit. 6px between sibling interactive elements.

**Colors:** Brand `#6C47FF` (violet) — all CTAs. Destructive `#EF4444` (red) — delete ONLY. Page bg `#EEEEEC`. Card `#FFFFFF`. Text `#1a1a2e`.

---

## 4. Information Architecture (M21)

**Dock (3 destinations):** Studio · Library · Profile
**Action bar (contextual tools):** Harmony dropdown + Colors/Preview segmented + Validate | AI + Extract + Save/Share/Export + Go Pro/Avatar
**Dialog system:** Unified modals with backdrop blur, single-open rule, Escape dismiss.

---

## 5. Agent Jurisdictions

| Agent | Jurisdiction | File |
|-------|-------------|------|
| Design System Architect | Layer 1 + 2 + component specs | `01-design-system-architect.md` |
| QA & Accessibility | Testing, regressions, WCAG | `02-qa-specialist.md` |
| Product Strategist | Roadmap, priorities, conversion | `03-product-strategist.md` |
| Documentation Specialist | Changelogs, handoff, knowledge | `04-documentation-specialist.md` |

---

## 6. Shipped (Mar 19, 2026)

M1-14 (core) → M15 (auth+Stripe) → M17 (stability+a11y) → M18 (growth+SEO) → M18.8 (mobile shell) → M19 (desktop studio) → M19.6 (bento design system) → M21 (IA redesign + dialog unification + library polish)

**Next:** M22 (shadcn migration) → M21.1 (mobile IA) → M28 (Product Hunt)
