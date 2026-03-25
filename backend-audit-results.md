# Backend Infrastructure Audit — Paletta Pre-Launch

**Date:** 2026-03-25
**Auditor:** Claude Code (automated)
**Scope:** api/ (all Vercel serverless functions), src/lib/ (client integrations)

---

## Summary

| Category | Critical | High | Medium | Info |
|----------|----------|------|--------|------|
| Authentication & Authorization | 2 (FIXED) | 1 (FIXED) | 0 | 0 |
| Stripe Integration | 0 | 1 (FIXED) | 1 | 1 |
| Input Validation | 0 | 0 | 0 | 2 |
| Rate Limiting | 0 | 0 | 1 | 0 |
| Infrastructure | 0 | 0 | 0 | 2 |
| **Total** | **2 (all fixed)** | **2 (all fixed)** | **2** | **5** |

---

## Critical Issues (all FIXED)

### 1. Server-side Pro bypass in `/api/generate` (FIXED)
**Before:** `isPro` was sent from the client request body and trusted by the server. Any user could bypass the daily AI limit by sending `{ isPro: true }` in the POST body.

**Fix:** Added server-side Pro verification using Supabase JWT:
- Reads `Authorization: Bearer <token>` header
- Verifies token via `supabase.auth.getUser(token)`
- Looks up `is_pro` from the `profiles` table
- Client no longer sends `isPro` in the request body

**Files changed:**
- `api/generate.ts` — Added `isUserPro()` function, removed client `isPro` trust
- `src/components/palette/AiPrompt.tsx` — Sends `Authorization` header, removed `isPro` from body

### 2. Unauthenticated billing portal access (FIXED)
**Before:** `/api/create-portal-session` accepted any email address without authentication. An attacker could access another user's Stripe billing portal by guessing their email.

**Fix:** Added JWT authentication check before creating portal session.

**Files changed:**
- `api/create-portal-session.ts` — Added Supabase auth verification
- `src/lib/stripe.ts` — `createPortalSession()` now accepts `accessToken` parameter
- `src/App.tsx`, `src/features/studio/DesktopStudio.tsx`, `src/features/mobile/MobileProfile.tsx` — Pass `session.access_token` to portal call

---

## High Issues (all FIXED)

### 3. Incomplete Stripe webhook event handling (FIXED)
**Before:** Only handled `checkout.session.completed`. If a subscription was cancelled, expired, or payment failed, the user would keep Pro access forever.

**Fix:** Added handlers for:
- `customer.subscription.updated` — Updates `is_pro` based on subscription status
- `customer.subscription.deleted` — Sets `is_pro = false`
- `invoice.payment_failed` — Logs the failure (doesn't immediately revoke; Stripe retries)

**Files changed:**
- `api/stripe-webhook.ts` — Added switch statement with all subscription lifecycle events

---

## Medium Issues (not fixed — acceptable for launch)

### 4. In-memory rate limiting resets on cold start
**Where:** `api/generate.ts` — `rateLimitMap` and `ipDailyLimit` use in-memory `Map`
**Risk:** Vercel cold starts reset these maps, allowing brief windows of unlimited access.
**Recommendation:** Migrate to Upstash Redis or Vercel KV for persistent rate limiting post-launch.

### 5. Plugin token is base64-encoded, not signed
**Where:** `api/plugin-token.ts:48-58`
**Risk:** Tokens can be forged. Acknowledged as MVP limitation in code comment.
**Recommendation:** Sign tokens with HMAC-SHA256 in a future iteration.

---

## Info Issues

### 6. Hardcoded success/cancel URLs
**Where:** `api/create-checkout-session.ts` — URLs point to `https://www.usepaletta.io`
**Note:** Fine for single-domain app, but won't work for preview deploys.

### 7. Stripe API version pinned
**Where:** `api/stripe-webhook.ts`, `api/create-portal-session.ts`, `api/create-checkout-session.ts`
**Version:** `2026-02-25.clover`
**Note:** Should review Stripe changelog periodically for breaking changes.

### 8. Console statements in API routes
**Where:** All API files use `console.error` for error logging
**Note:** Intentional — Vercel captures these in function logs. Consider structured logging (e.g., Axiom) post-launch.

### 9. No request body size limit
**Where:** `api/generate.ts` — Only validates prompt length (500 chars), not total body size
**Note:** Vercel enforces a 4.5MB body limit by default, so this is low-risk.

### 10. Security headers comprehensive
**Where:** `vercel.json` — CSP, HSTS, X-Frame-Options, nosniff, Permissions-Policy all configured.
**Note:** Well done. No changes needed.

---

## Passing Checks

- Stripe webhook signature verification ✅
- API key not exposed to client ✅
- CORS configuration appropriate ✅
- Error responses don't leak internal details ✅
- Supabase RLS enabled (service role key only used server-side) ✅
- Environment variables properly referenced ✅
- TypeScript strict mode ✅
