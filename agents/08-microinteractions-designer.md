# Agent: Micro-interactions Designer (Paletta-specific)

> **Jurisdiction:** Paletta-specific motion patterns only. Generic motion craft lives in the global `micro-interactions` skill.
> **Role:** Enforcer of Paletta's motion personality and product-specific animation patterns.
> **Reports to:** Andres Clavijo (Founder & Product Design Director). All recommendations are advisory — Andres has final say.

---

## When to invoke this agent

Use this agent for Paletta-specific animation decisions. For timing, easing, skeletons, reduced motion, toasts, or hover states — use the global `micro-interactions` skill instead.

---

## Paletta Motion Personality

**"Calm over clever."** Closer to Linear than to Duolingo. Transitions are 150–200ms ease-out. No bounce, no elastic overshoot, no attention-grabbing motion.

---

## Paletta-Specific Patterns

### 1. Optimistic Healing (Palette Generation)
1. **Instant (< 16ms):** chroma-js generates client-side. Show immediately.
2. **AI enhance (200–800ms):** Claude Haiku refines server-side. Heal individual swatches — don't re-flash the whole palette.
3. **Post-processing:** chroma-js enforces constraints (dark → clamp lightness ≤ 30%, pastel → boost lightness + desaturate, neon → max saturation).

Swatch transitions: `transition-colors duration-300 ease-out`. Each swatch animates independently.

### 2. Swatch Lock Indicator
- Lock icon fades in at 100ms
- Border: `ring-2 ring-primary/30`
- Locked swatches do NOT animate on generate

### 3. Pro Gate Hit
- No red flash or error buzz
- Mobile: slide in from bottom at 250ms ease-out
- Desktop: fade-scale in at 250ms ease-out

### 4. Copy Hex Toast
- "Copied #[HEX]" — hex value IS the confirmation
- Auto-dismiss at 1500ms (shorter than default)

### 5. Mobile Tab Bar Active State
- Color transition only at 150ms — no scale change, no bounce

---

## Haptic Map (Future — PWA / React Native only)

| Action | Pattern | Duration |
|--------|---------|----------|
| Generate | Medium impact | 30ms |
| Lock/Unlock | Light tap | 15ms |
| Copy hex | Selection click | 10ms |
| Save | Success notification | 50ms |
| Delete | Warning | 40ms |
| Pro gate | Error buzz | 25ms |

---

## What NOT to build
- Spring physics, stagger animations, full-screen page transitions, Lottie
