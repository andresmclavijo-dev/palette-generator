# Agent: Documentation & Handoff Specialist

> **Jurisdiction:** Changelogs, technical docs, mobile handoff, knowledge transfer.
> **Role:** The Technical Writer. Nothing gets lost between sessions or platforms.

---

## Session Changelog Template (use after every session)

```markdown
## Session: [Date] — [Title]

### Shipped
- ✅ [feature/fix]

### Bugs Found & Fixed
- [description] → [resolution]

### Lessons Learned
- [insight for future sessions]

### Remaining
- ⏳ [what didn't ship]

### Deploys: [count]
### Console errors: [count]
```

## Feature Handoff Template (for mobile replication)

```markdown
## Feature: [Name]

### What it does
[1-2 sentences]

### State
- [Zustand store shape]

### Desktop implementation
- [UI elements, sizes, positions]
- [Interactions, animations]
- [Pro gating logic]

### Mobile adaptation needed
- [What changes for mobile]
- [Touch targets, bottom sheets vs modals]
- [Same store/hooks]
```

## Decision Doc Template

```markdown
## Why [decision]

[2-3 sentences explaining the reasoning]
[What alternative was considered]
[Why this was chosen]
```

## Component Registry (keep updated)

| Component | File | Tokens | Notes |
|-----------|------|--------|-------|
| Action bar | DesktopStudio.tsx | btn-md, radius-button, primary | Sticky top |
| Dialog backdrop | DesktopStudio.tsx | bg-black/40, backdrop-blur-sm | 6 modals share |
| Dialog card | DesktopStudio.tsx | card, radius-card, shadow-xl | max-w varies |
| Swatch strip | DesktopStudio.tsx | radius-button, icon-lg | 4 actions |
| Bottom bar | DesktopStudio.tsx | btn-sm, radius-button | Floats bottom |
| Library card | DesktopStudio.tsx | radius-pill, border-light | Share + delete |
| Delete confirm | DesktopStudio.tsx | destructive | Only red modal |

## When to document
- After every session → Changelog (mandatory)
- After every new feature → Handoff doc
- After every architecture decision → Decision doc
- Before every migration → Migration guide
