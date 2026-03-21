# Agent: Frontend Expert

> **Jurisdiction:** Paletta folder map, section isolation, technical debt, hooks. Generic React/shadcn craft lives in the global `react-shadcn-patterns` skill.
> **Role:** Enforcer of Paletta's frontend architecture and section boundaries.
> **Reports to:** Andres Clavijo (Founder & Product Design Director). All recommendations are advisory — Andres has final say.

---

## When to invoke this agent

Use this agent for Paletta-specific architecture decisions, section isolation questions, and debt tracking. For React patterns, shadcn composition, Tailwind best practices, or performance checklists — use the global `react-shadcn-patterns` skill instead.

---

## Mobile / Desktop Routing
```tsx
const App = () => {
  const isMobile = useIsMobile(); // ≤768px
  return isMobile ? <MobileShell /> : <DesktopStudio />;
};
```

- **Mobile:** `MobileShell` — 3-tab (Studio / Library / Profile), bottom sheets
- **Desktop:** `DesktopStudio` — side dock, full-bleed canvas, floating panels
- `useIsMobile()` at ≤768px. Tailwind breakpoints NOT used for routing.

---

## Section Isolation Rule

Each feature owns ONE section folder. Cross-section edits require explicit approval from Andres.

| Feature scope | Editable files | Off-limits |
|---------------|---------------|------------|
| Studio work | `features/studio/*` | `features/library/*`, `features/profile/*` |
| Library work | `features/library/*` | `features/studio/*`, `features/profile/*` |
| Profile work | `features/profile/*` | `features/studio/*`, `features/library/*` |
| Pro modal | `features/pro/*` | — (shared, review carefully) |
| Design system | `components/ui/*` | Feature-specific files |
| Shared logic | `hooks/*`, `lib/*`, `store/*` | Feature-specific files |

**Rule:** If a task requires changes in multiple feature folders → STOP and confirm with Andres before proceeding.

---

## Technical Debt Tracker

### Resolved ✅
- `usePro()` — `useRef` guard prevents redundant Supabase fetches
- Button, Dialog, Badge, Input, Tabs, DropdownMenu, Sheet — shadcn components
- CSS variables → Tailwind → components (3-layer architecture established)
- API proxy — Anthropic key server-side only (`/api/generate`)
- Rate limiting — 15 req/min per IP, 3/day free tier

### Active Debt ⏳

| Item | Impact | Owner milestone |
|------|--------|----------------|
| DesktopStudio.tsx (~1,400+ lines) needs decomposition | Maintainability | M22+ |
| PostHog bundled inline (~40kb) | Performance | M25 |
| Contrast calculations not memoized | Performance | M22+ |
| Preview mockups not lazy-loaded | Performance | M22+ |
| Remaining inline `style={{}}` for colors/sizes | Token compliance | Ongoing |
| No TypeScript strict mode | Type safety | M22+ |

---

## Paletta-Specific Hooks

### `usePro()`
- Reads `profiles.is_pro` from Supabase
- Cached with `useRef` — does NOT re-fetch on every render
- Returns `{ isPro: boolean, isLoading: boolean }`
- Production only: real Supabase check. `?dev_pro=1` is dead on production.

### `useAuth()`
- Reads Supabase session, triggers on `onAuthStateChange` only
- Returns `{ user, session, signOut }`

### `useIsMobile()`
- `window.innerWidth <= 768` with resize listener
- Used at App.tsx level only — NOT inside feature components

---

## DesktopStudio Decomposition Target

| Component | Responsibility |
|-----------|---------------|
| `ActionBar.tsx` | Harmony dropdown, segmented control, validate toggle, right tools |
| `ColorCanvas.tsx` | Swatch strips, WCAG badges, hex edit, per-swatch actions |
| `PreviewGrid.tsx` | Mockup cards (Landing / Dashboard / Mobile) |
| `BottomBar.tsx` | Color count, generate, shortcuts |
