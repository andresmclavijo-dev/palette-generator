# Agent: Design System Architect

> **Jurisdiction:** Layer 1 (CSS Variables) + Layer 2 (Tailwind Config) + component visual specs.
> **Role:** Lead Frontend Engineer. Every pixel is intentional, token-based, and DRY.
> **Reports to:** Andres Clavijo (Founder & Product Design Director). All recommendations are advisory — Andres has final say.

---

## Layer 1 — CSS Variables (globals.css)

```css
:root {
  /* Brand */
  --primary: #6C47FF;
  --primary-hover: #5B38E0;
  --primary-foreground: #FFFFFF;

  /* Destructive (delete actions ONLY) */
  --destructive: #EF4444;
  --destructive-hover: #DC2626;
  --destructive-foreground: #FFFFFF;

  /* Text */
  --foreground: #1a1a2e;
  --muted: #9CA3AF;
  --muted-foreground: #6B7280;

  /* Surfaces */
  --background: #EEEEEC;
  --card: #FFFFFF;
  --surface: #F9FAFB;
  --surface-warm: #FAFAF8;

  /* Borders */
  --border: #E5E7EB;
  --border-light: #F3F4F6;

  /* Feedback */
  --success: #16A34A;
  --success-bg: #DCFCE7;

  /* Radius (R_inner = R_outer - Padding) */
  --radius-bento: 24px;
  --radius-card: 16px;
  --radius-pill: 12px;
  --radius-button: 8px;
  --radius-badge: 6px;

  /* Button heights */
  --button-lg: 48px;
  --button-md: 36px;
  --button-sm: 32px;

  /* Icon sizes */
  --icon-lg: 20px;
  --icon-md: 16px;
  --icon-sm: 14px;

  /* Spacing (12px base) */
  --space-1: 4px;
  --space-1-5: 6px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

### Naming rules:
- USE: `--primary`, `--surface`, `--destructive` (semantic roles)
- NEVER: `--purple`, `--gray-100`, `--red-500` (literal color names)

---

## Layer 2 — Tailwind Config

```js
colors: {
  primary: { DEFAULT: 'var(--primary)', hover: 'var(--primary-hover)', foreground: 'var(--primary-foreground)' },
  destructive: { DEFAULT: 'var(--destructive)', hover: 'var(--destructive-hover)' },
  foreground: 'var(--foreground)',
  muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
  background: 'var(--background)',
  card: 'var(--card)',
  surface: { DEFAULT: 'var(--surface)', warm: 'var(--surface-warm)' },
  border: { DEFAULT: 'var(--border)', light: 'var(--border-light)' },
  success: { DEFAULT: 'var(--success)', bg: 'var(--success-bg)' },
},
borderRadius: {
  'bento': 'var(--radius-bento)',
  'card': 'var(--radius-card)',
  'pill': 'var(--radius-pill)',
  'button': 'var(--radius-button)',
  'badge': 'var(--radius-badge)',
}
```

---

## Component Specs

### Buttons
| Context | Height | Radius | Icon |
|---------|--------|--------|------|
| Dock | 48px (--button-lg) | 12px (pill) | 20px |
| Action bar / modal actions | 36px (--button-md) | 8px (button) | 16px |
| Modal close / bottom bar | 32px (--button-sm) | 8px (button) | 16px |

### Modals
- Backdrop: `fixed inset-0 bg-black/40 backdrop-blur-sm z-[99]`
- Card: `bg-card rounded-card shadow-xl max-w-lg p-6 z-[100]`
- Close: `w-8 h-8 rounded-button text-muted hover:bg-surface`
- Primary CTA: `bg-primary text-primary-foreground h-btn-md rounded-button`
- Destructive CTA: `bg-destructive text-white h-btn-md rounded-button` (DELETE ONLY)

### Popovers
- Card: `bg-card rounded-pill shadow-lg border-border p-4 z-30`

---

## Review Checklist (every code change)

1. ❌ Hardcoded hex? → Replace with token
2. ❌ `bg-[#...]`? → Use semantic class (`bg-primary`)
3. ❌ `style={{ color: '...' }}`? → Move to className
4. ❌ Button height wrong? → Must be 48/36/32
5. ❌ Button radius not 8px? → Fix to `rounded-button`
6. ❌ Modal radius not 16px? → Fix to `rounded-card`
7. ❌ Sibling gap not 6px? → Fix to `gap-1.5`
8. ❌ Missing aria-label? → Add one
9. ❌ Delete using violet? → Change to `bg-destructive`
10. ❌ New color not tokenized? → Add to Layer 1 first
