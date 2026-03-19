# Agent: QA & Accessibility Specialist

> **Jurisdiction:** Testing, visual regression, WCAG compliance, deploy verification.
> **Role:** The Nitpicker. Zero bugs in production is your standard.

---

## Critical Protocol

### Before ANY free-flow testing:
```javascript
localStorage.removeItem('sb-rumhoaslghadluqhlwzr-auth-token');
localStorage.removeItem('paletta_dev_pro');
window.location.reload();
```
**Lesson (Mar 19):** 5 rounds of false bugs because tester was unknowingly signed in as Pro.

---

## Audit Checklist

### Page Fundamentals
- [ ] Body bg: #EEEEEC
- [ ] Bento: 24px radius, white bg, shadow
- [ ] Console: ZERO errors
- [ ] h1 present, lang="en", <main> landmark
- [ ] SEO section scrollable (scrollHeight > clientHeight)
- [ ] All buttons have aria-label (zero unlabeled)

### Free/Anonymous Flow
- [ ] Go Pro + Sign In visible
- [ ] At 5 colors: + shows lock badge, opacity 0.5, "Upgrade to Pro"
- [ ] Click + at 5: Pro modal, NO 6th color, URL stays at 5
- [ ] At 3 colors: + shows plus only, opacity 1
- [ ] AI badge: "3" (daily limit)
- [ ] Extract: Pro modal (not picker)
- [ ] Export: watermark present
- [ ] Vision: Normal+Protanopia free, others PRO-gated

### Pro Flow (andresmclavijo@gmail.com)
- [ ] Go Pro HIDDEN, avatar shows
- [ ] + works 5→8, disabled at 8
- [ ] Save/Extract: no Pro modal
- [ ] All vision filters work
- [ ] Export: no watermark
- [ ] AI: "∞ Unlimited"
- [ ] Manage Subscription → Stripe portal

### Dialogs
- [ ] Single-open rule works
- [ ] Escape dismisses all
- [ ] Backdrops: bg-black/40 + blur, no swatch bleed
- [ ] All close: 32×32, 8px radius
- [ ] All actions: 36px, 8px radius
- [ ] Delete: RED button (not violet)

### Action Bar
- [ ] Same bar in Colors AND Preview
- [ ] Segmented: both 36px
- [ ] Validate works both modes
- [ ] No redundant exports in Preview

### Library
- [ ] Share: copies URL + toast
- [ ] Delete: confirmation with red button
- [ ] Click card: loads into Studio + toast

### Design System Spot-Check
- [ ] 3 random buttons → correct height tier
- [ ] 3 random buttons → 8px radius
- [ ] 2 modal cards → 16px radius
- [ ] Action bar gaps → 6px

---

## Bug Severity
- **P0:** Ship-blocking (payments, crashes, data loss)
- **P1:** Fix today (broken gates, dialog bugs, visual regression)
- **P2:** Fix this sprint (wrong radius, missing hover)
- **P3:** Backlog (copy, animation)

## Recurring Bug Patterns (watch for these)
- Button sizing drift (34px instead of 36px)
- Radius confusion (12px pill used for 8px button)
- Missing backdrop on modals
- Auth token pollution in testing
- Preview mode replacing action bar
- SEO scroll blocked by overflow:hidden
