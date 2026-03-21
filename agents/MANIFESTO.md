# Paletta — Project Manifesto v2.0

> Internal reference for all agents, developers, and AI assistants working on Paletta.
> This document is the single source of truth for how Paletta is built, why decisions were made, and where we're going.
> Updated: March 20, 2026

---

## 1. Vision

Paletta is an AI-powered color palette generator SaaS for product designers and frontend teams. It differentiates from Coolors through three pillars:

1. **See it in your product** — context preview (Landing/Dashboard/Mobile mockups)
2. **Accessibility built in** — WCAG validation, vision simulation, proactive a11y guidance
3. **Zero friction from idea to implementation** — export as CSS/Tailwind/SVG, shade scales 50-900, smart naming

**Live:** https://usepaletta.io
**Stack:** React + Vite + TypeScript + Tailwind + Zustand + chroma-js + Supabase + Stripe + PostHog + Anthropic Claude Haiku
**Pricing:** Free (3 saves, 5 colors, 3 AI/day) · Pro $5/mo or $45/yr (unlimited)

---

## 1.5. Who We Are

**Andres Clavijo** — Founder & Product Design Director
- Final decision-maker on all product, design, and business decisions
- Approves or rejects all agent recommendations
- Sets the vision, tests on real devices, decides when to ship
- Contact: andresmclavijo@gmail.com · hello@usepaletta.io

**Reporting structure:**
All agents report to Andres. Agent outputs are advisory — Andres has final say. When agents disagree with each other (e.g., Strategist says "skip it" but Architect says "it needs to be pixel-perfect"), Andres breaks the tie.

**Communication style:**
- Andres sends short confirmations ("fixed", "done", "ready to test")
- Shares screenshots to show issues rather than describing them
- Expects agents to identify root causes from visual evidence
- Defers to agents on technical implementation; pushes back on copy/UX decisions with specific reasoning
- Prefers direct strategic recommendations over neutral options

---

## 2. Positioning & Competitive Landscape

### Who we're for
Product designers and frontend developers who need production-ready palettes — not just inspiration boards. They paste CSS into real projects. They care about accessibility. They want to go from "I need warm colors" to "here's the Tailwind config" in under 30 seconds.

### Competitive landscape

| Product | Strength | Paletta's Edge |
|---------|----------|----------------|
| **Coolors** | Speed, community, brand recognition | Accessibility-first (WCAG baked in, not an afterthought), AI generation, context previews |
| **Adobe Color** | Color theory depth, Creative Cloud integration | No subscription lock-in, faster workflow, mobile-native experience |
| **Huemint** | AI-first approach, brand mockups | Better export formats (CSS/Tailwind/SVG), shade scales, Pro features vs one-size-fits-all |
| **Realtime Colors** | Live website preview | WCAG validation + vision simulation, library management, Pro tier economics |

### Positioning statement
Paletta is the color tool that designers trust for production. Where Coolors stops at "looks nice", Paletta validates accessibility, simulates vision deficiencies, and exports code your team can paste and ship.

---

## 3. Product Principles

### The 30-Second Rule
Every core flow must complete in under 30 seconds:
- Generate → Adjust → Export: < 30s
- Open → AI prompt → Palette applied: < 30s
- Library → Load → Edit → Save: < 30s

### Export = Paste-and-Go
Every export format must be immediately usable. CSS custom properties, Tailwind config objects, SVG swatches — no manual transformation required. The user should be able to copy, paste into their project, and it works.

### Library Empty State
When a user's library is empty, show a sample palette they can load instantly. The goal: zero-state should still demonstrate value. "Your collection starts here" with a CTA that invites exploration, not punishes emptiness.

### Pro Gates = Aspiration, Not Punishment
Free users see what Pro unlocks. Every gate leads with the benefit ("Unlock unlimited AI palettes") not the restriction ("You've run out of AI credits"). The upgrade path should feel like leveling up, not hitting a wall.

---

## 4. Architecture & Design System

### The 3-Layer Architecture

Every frontend contribution MUST follow this hierarchy. No exceptions.

```
Layer 1: CSS Variables (globals.css)          ← SINGLE SOURCE OF TRUTH
   ↓ consumed by
Layer 2: Tailwind Config (tailwind.config.js) ← Maps variables to utility classes
   ↓ consumed by
Layer 3: Components (shadcn/ui)               ← Renders using Tailwind classes
```

**The rule:** Never hardcode a hex value. Never write `bg-[#6C47FF]`. Always use `bg-primary` which reads `var(--primary)` which is defined once in `globals.css`. Change the variable → everything updates.

### The Bento Design Language

**Aesthetic:** Native macOS app / Safari-native. High use of `backdrop-blur`, subtle borders, soft elevation, warm neutral page background (#EEEEEC).

**The Golden Radius Rule:** `R_inner = R_outer - Padding`
- Bento container: 24px → Modal cards/dock: 16px → Pills/popovers: 12px → Buttons/inputs: 8px → Badges: 6px

**Button Tiers:** Dock 48px → Action bar/modal actions 36px → Bottom bar/close 32px

**Spacing:** 12px base unit. 6px between sibling interactive elements.

**Colors:** Brand `#6C47FF` (violet) — all CTAs. Destructive `#EF4444` (red) — delete ONLY. Page bg `#EEEEEC`. Card `#FFFFFF`. Text `#1a1a2e`.

### Mobile Typography Table

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Screen titles | text-[24px] | font-extrabold | text-foreground |
| Section titles | text-[17px] | font-bold | text-foreground |
| Button labels / CTAs | text-[15px] | font-semibold | white |
| Body text / subtitles | text-[15px] | font-normal | text-foreground/60 |
| List item names | text-[15px] | font-semibold | text-foreground |
| List descriptions | text-[13px] | font-normal | text-muted-foreground |
| Tab bar labels | text-[11px] | font-bold (active) / medium | primary / muted |
| Action row labels | text-[10px] | font-medium | text-muted-foreground |
| WCAG badges | text-[10px] | font-bold | text-foreground |
| Hex codes | text-[10px] | font-semibold mono | text-foreground |
| PRO badges | text-[10px] | font-bold | text-primary |

**Rule: Nothing below 10px. Descriptions minimum 13px. Subtitles minimum 15px.**

### Optimistic Healing (Hybrid Generation)

Palette generation uses an "optimistic healing" pattern:
1. **Instant:** Client-side chroma-js generates a palette immediately (< 16ms)
2. **AI enhance:** If user provides a text prompt, the server-side Claude Haiku call refines it (200-800ms)
3. **Post-processing:** chroma-js enforces keyword constraints (dark → clamp lightness, pastel → boost lightness + desaturate, neon → max saturation)

This means the UI is never blocked. The user always sees a result instantly, and AI enhancement is a progressive upgrade.

### Haptic Feedback Map (Future — Native/PWA)

| Action | Pattern | Duration |
|--------|---------|----------|
| Generate | Medium impact | 30ms |
| Lock/Unlock swatch | Light tap | 15ms |
| Copy hex | Selection click | 10ms |
| Save palette | Success notification | 50ms |
| Delete palette | Warning | 40ms |
| Pro gate hit | Error buzz | 25ms |

Reserved for future PWA or React Native migration. Currently web-only — no haptics.

### Information Architecture (M21)

**Desktop:** Dock (3 destinations) + Action bar (contextual tools) + Dialog system (single-open)
**Mobile (M21.1):** 3-tab bar (Studio/Library/Profile) + Bottom sheets (Apple Maps style) + Generate bar

---

## 5. Tech Stack Details

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | React 18 + Vite | Fast HMR, modern ESM |
| Language | TypeScript (strict) | Type safety across components + API |
| Styling | Tailwind CSS | Token-based, utility-first |
| State | Zustand | Minimal boilerplate, React-native-ready |
| Color Math | chroma-js | Industry-standard color manipulation |
| Color Picker | react-colorful | Lightweight, accessible |
| Components | shadcn/ui (Radix + CVA) | Accessible primitives, no runtime CSS-in-JS |
| Auth + DB | Supabase | Postgres + auth + realtime, generous free tier |
| Payments | Stripe | Checkout Sessions + Customer Portal |
| Analytics | PostHog | Self-hostable, privacy-friendly |
| AI | Anthropic Claude Haiku | 20x cheaper than Sonnet, fast enough for color generation |
| Hosting | Vercel | Auto-deploy, edge functions, preview deploys |
| DNS/CDN | Cloudflare | DDoS protection, SSL, page rules |

---

## 6. Security & Sustainability

### API Key Security
- **Anthropic API key** is server-only (`ANTHROPIC_API_KEY` in Vercel env vars, NOT `VITE_` prefixed)
- All AI calls route through `/api/generate` — the client never touches the key
- Rate limiting: 15 req/min per IP (all users), 3/day per IP (free tier)

### Cost-Per-User Guardrail
Claude Haiku costs ~$0.25 per 1M input tokens. At 3 free AI prompts/day:
- **Free user worst case:** ~$0.003/day = $0.09/month
- **Pro user heavy use (20 prompts/day):** ~$0.02/day = $0.60/month
- **Pro revenue:** $5/month → ~$4.40 margin per Pro user

**Guardrail:** If cost-per-user exceeds $1/month, investigate prompt caching or switch to a cheaper model. Monitor via PostHog custom events + Anthropic dashboard.

### Cloudflare Gotchas
- Cloudflare proxies usepaletta.io — can silently drop POST requests on www redirects
- Always verify webhook delivery at the DNS layer after any webhook changes

### Supabase Security
- Row Level Security (RLS) enabled on all tables
- `saved_palettes` restricted to `user_id = auth.uid()`
- `profiles` read: own row only; write: webhook function only

---

## 7. Agent Jurisdictions

| Agent | Jurisdiction | File |
|-------|-------------|------|
| Design System Architect | Layer 1 + 2 + component specs | `01-design-system-architect.md` |
| QA & Accessibility | Testing, regressions, WCAG | `02-qa-specialist.md` |
| Product Strategist | Roadmap, priorities, conversion | `03-product-strategist.md` |
| Documentation Specialist | Changelogs, handoff, knowledge | `04-documentation-specialist.md` |
| Frontend Expert | React patterns, state, performance | `05-frontend-expert.md` |
| Brand & UX Expert | Brand identity, UX writing, voice, visual brand standards | `07-brand-ux-expert.md` |
| Micro-interactions Designer | Animations, transitions, feedback | `08-microinteractions-designer.md` |

---

## 8. Core Principles

1. **Tokens over hardcodes** — Every color, radius, spacing value comes from the design system. Zero magic numbers.
2. **Accessibility is not optional** — WCAG 2.1 AA minimum. Vision simulation. Keyboard navigation. Screen reader support. This is a core differentiator, not a checkbox.
3. **Ship daily, polish weekly** — Small commits, frequent deploys, visual regression catches on real devices.
4. **Mobile is not a port** — Mobile has its own IA, its own interaction patterns (bottom sheets, swipe, tap), its own typography scale. It's a first-class citizen, not a responsive afterthought.
5. **Pro earns its price** — Every Pro feature must deliver clear value. If a free user can't understand why it's worth $5/month within 10 seconds of hitting the gate, the gate is wrong.
6. **Calm over clever** — No bounce animations. No elastic overshoot. No attention-grabbing motion. Paletta is a professional tool — transitions are 150-200ms ease-out, subtle, and purposeful.
7. **Code is the spec** — The running app is the source of truth, not a Figma file. Design decisions are made in code and tested on devices.

---

## 9. Shipped (as of March 20, 2026)

M1-14 (core) → M15 (auth+Stripe) → M17 (stability+a11y) → M18 (growth+SEO) → M18.8 (mobile shell) → M19 (desktop studio) → M19.6 (bento design system) → M21 (IA redesign + dialog unification + library polish) → M21.1 (mobile IA v2 — 3-tab, bottom sheets, action row, vision strip, preview cards)

---

## 10. Roadmap (Priority Order)

1. **M22 — Image Extraction** — Upload photo → extract dominant palette via canvas sampling + k-means clustering (Pro only)
2. **M23 — Shade Scales** — Generate 50-900 shade scale for any color, export as Tailwind config (Pro only)
3. **M24 — Color Info Panel** — HSL/RGB/OKLCH values, complementary/analogous suggestions, naming etymology
4. **M25 — Figma Plugin** — Direct export from Paletta to Figma variables (Pro only, high-value differentiator)
5. **M26 — Community Gallery** — Browse + fork public palettes. Social proof + SEO long-tail
6. **M27 — Dark Mode** — Full dark theme using existing CSS variable architecture. Low effort, high polish.
7. **M28 — Product Hunt Launch** — Landing page refresh, OG images, launch checklist, press kit
8. **M29 — PWA + Offline** — Service worker, offline palette generation (chroma-js only), install prompt
9. **M30 — Teams** — Shared workspaces, brand color libraries, role-based access (enterprise tier)
10. **M31 — React Native** — Native iOS/Android app with haptic feedback, Share Sheet integration, widget
