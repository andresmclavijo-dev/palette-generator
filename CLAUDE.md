# Paletta — Claude Code context

## Project
- **App:** usepaletta.io
- **Local:** /Users/andresclavijo/palette-gen
- **GitHub:** andresmclavijo-dev/palette-generator
- **Branch:** always work on `main` unless told otherwise (feature branches: `feat/[name]`)
- **Deploy:** Vercel auto-deploys on push to `main`

## Stack
- React + Vite + TypeScript + Tailwind CSS
- Zustand — global state
- chroma-js — color manipulation and post-processing
- react-colorful — color picker component (replaced custom canvas picker)
- Supabase — auth + database (ref: `rumhoaslghadluqhlwzr`)
- Stripe — payments ($5/mo or $45/yr)
- Vercel Serverless Functions — API routes at `/api/*`
- Anthropic API (Claude Haiku) — AI palette generation

## Key files & paths
- API routes: `api/` (Vercel serverless)
- Supabase client: check `src/lib/supabase.ts`
- Pro hook: `usePro()` — reads `is_pro` from Supabase `profiles` table
- Stripe webhook: `api/webhook.ts` — flips `is_pro=true` on payment
- OG image: `public/og-image.png` (1200×630)
- Sitemap: `public/sitemap.xml`
- Robots: `public/robots.txt`

## Supabase schema (key tables)
- `profiles` — `id`, `is_pro` (boolean), set to true by Stripe webhook
- `saved_palettes` — `id`, `user_id`, `colors` (jsonb), `name`

## Infrastructure gotchas
- **Cloudflare** proxies usepaletta.io — can silently drop POST requests on www redirects. Always verify webhook delivery at the DNS layer after any webhook changes.
- **vercel.json** SPA catch-all rewrite must explicitly exclude `/api/*` routes or they get swallowed.
- **Supabase env vars** — double-check var names in Vercel dashboard if webhook stops working.

## Pro tier
- Free: 3 saved palettes, 5 colors max, export with watermark, 3 AI prompts/day
- Pro: unlimited saves, 6/7/8 colors, no watermark, full shade scales, image extraction, vision sim, AI unlimited
- **Test Pro on production:** load `usepaletta.io?dev_pro=1` — activates via `paletta_dev_pro` localStorage key
- **⚠️ Always clear after Pro testing:** `localStorage.removeItem('paletta_dev_pro')` in console before switching back to free flow

## Audit rule — run after every deploy
Test BOTH tiers every time:
1. Free (anonymous) — PRO badges visible, gates fire on Image/Vision/AI
2. Pro (`?dev_pro=1`) — no PRO badges, AI shows Unlimited, all features unlocked, no ProUpgradeModal

## Commit convention
Always end every task with:
```
git add -A && git commit -m "feat/fix: [short description]" && git push
```

## Accessibility — Paletta-specific rules
Inherits all global WCAG 2.1 AA rules from ~/.claude/CLAUDE.md. Additional Paletta-specific rules:

- Brand violet `#6C47FF` on white `#FAFAF8` — contrast 5.9:1 ✅ safe for all text
- Brand violet `#6C47FF` on dark `#1a1a2e` — contrast 3.2:1 ✅ safe for large text/UI only, NOT body text
- PRO badge (violet bg + white text) — always verify contrast when changing badge background
- Bottom sheets / drawers: must trap focus, close on Escape, restore focus to trigger element
- Color swatches: hex code label must always be visible — color alone is never the only identifier
- Lock icons on swatches: must have `aria-label="Locked"` / `aria-label="Unlocked"`
- Generate button: `aria-label="Generate new palette"` always present
- All icon-only toolbar buttons (undo, redo, export, menu): must have `aria-label`
- Vision simulation modes: mode name must be announced via `aria-live="polite"` when changed
- Mobile tap targets: all swatches, buttons, and icons minimum 44×44px


- andresmclavijo@gmail.com — main dev account, manually set is_pro=true in Supabase Table Editor

## Pro user types (all set manually in Supabase)
- `dev` — andresmclavijo@gmail.com, developer access
- `beta` — friends/feedback users comped Pro manually, no Stripe payment
- `stripe` — real paying customers via Stripe webhook
- Note: pro_source column being added in M20 to distinguish these in the DB

## Anthropic API
- Model: claude-haiku (20x cheaper than Sonnet)
- Spend limit: $10/mo, auto-recharge at $5 → tops up to $15
- Key stored in Vercel env vars as `ANTHROPIC_API_KEY`

---

## Design System Agent (auto-loaded)

Read `agents/01-design-system-architect.md` before writing any UI code. All visual decisions must follow the token spec defined there.

Key rules (quick reference):
- NEVER hardcode hex values — use semantic tokens (bg-primary, not bg-[#6C47FF])
- Button heights: 48px (dock) / 36px (action bar + modal) / 32px (bottom bar + close)
- Button radius: ALWAYS 8px (rounded-button) — not 12px, not 6px
- Modal card radius: ALWAYS 16px (rounded-card)
- Gaps between sibling buttons: ALWAYS 6px (gap-1.5)
- Destructive actions (delete): RED (bg-destructive), not violet
- Every button must have aria-label

For full spec, token values, and review checklist: see `agents/01-design-system-architect.md`
For project context and architecture: see `agents/MANIFESTO.md`

---

## End-of-Session Protocol
Before the final commit of any session, read `agents/04-documentation-specialist.md` and update `paletta-roadmap.jsx` following its end-of-session checklist (mark ✅ items, update session log, refresh compliance section, update timestamp).
