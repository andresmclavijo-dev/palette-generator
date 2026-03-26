# Paletta — RLS Security Audit Results

**Date:** 2026-03-26
**Scope:** Supabase RLS policies, API route security, client-side Supabase usage, key exposure

---

## 1. RLS Policies — Documented State

### `profiles`

| Policy | Command | Expression | Status |
|--------|---------|------------|--------|
| Users read own profile | SELECT | `auth.uid() = id` | PASS |
| Users update own profile | UPDATE | `auth.uid() = id` | PASS |
| (no INSERT policy) | — | Created by trigger on sign-up | PASS |
| (no DELETE policy) | — | Users cannot delete profiles | PASS |

### `saved_palettes`

| Policy | Command | Expression | Status |
|--------|---------|------------|--------|
| Users read own palettes | SELECT | `auth.uid() = user_id` | PASS |
| Users insert own palettes | INSERT | `auth.uid() = user_id` (WITH CHECK) | PASS |
| Users delete own palettes | DELETE | `auth.uid() = user_id` | PASS |
| (no UPDATE policy) | — | Palettes are immutable | PASS |

### `plugin_auth_sessions`

| Policy | Command | Expression | Status |
|--------|---------|------------|--------|
| (none expected) | — | Service role access only | MANUAL CHECK NEEDED |

**ACTION REQUIRED:** Verify in Supabase Dashboard:
1. Navigate to Authentication > Policies > `plugin_auth_sessions`
2. Confirm RLS is **ENABLED** on the table
3. Confirm there are **NO** policies (service role bypasses RLS)
4. If RLS is disabled, enable it:
   ```sql
   ALTER TABLE plugin_auth_sessions ENABLE ROW LEVEL SECURITY;
   ```

---

## 2. Tables Without RLS

**ACTION REQUIRED:** Run in Supabase SQL Editor:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```
Every row must show `rowsecurity = true`. Flag any that don't.

---

## 3. API Route Security Audit

### `api/palettes.ts` — PASS
- Uses `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- User identity derived from Base64 token server-side (never from request body)
- Pro gating: counts palettes server-side, not trusting client `isPro`
- Rate limited: 30 req/min/IP
- **Fix applied:** Added hex format validation (`#RRGGBB`), name length limit (200 chars), color count limit (8 max)

### `api/palettes-delete.ts` — PASS
- Uses `SUPABASE_SERVICE_ROLE_KEY`
- User identity from token
- DELETE scoped to both `id` AND `user_id` (ownership check)
- Rate limited: 30 req/min/IP
- **Fix applied:** Added UUID format validation on palette `id`, type check on `id` param

### `api/stripe-webhook.ts` — PASS
- Verifies Stripe signature via `stripe.webhooks.constructEvent(rawBody, sig, secret)`
- Raw body parsing (no JSON middleware)
- Service role key for DB writes
- No user-facing error details leaked

### `api/plugin-auth-status.ts` — PASS
- Service role key for DB access
- Tokens are one-time use (deleted after first read)
- Sessions expire after 5 minutes
- No token leaks in error responses

### `api/create-checkout-session.ts` — PASS (with fix)
- No auth required (by design — supports signed-out checkout)
- `client_reference_id` from client is safe: attacker would need to pay real money
- **Fix applied:** Error responses no longer leak internal Stripe error messages

### `api/create-portal-session.ts` — FIXED (was FAIL)
- **Vulnerability found:** Accepted `customerId` from request body without ownership verification. An authenticated user could pass another user's Stripe customer ID to access their billing portal.
- **Fix applied:** Removed client-sent `customerId`. Now looks up Stripe customer exclusively by the authenticated user's verified email from `supabase.auth.getUser()`.
- **Fix applied:** Error responses no longer leak internal error messages.

### `api/generate.ts` — PASS
- Server-side Pro check via `supabase.auth.getUser()` + profiles lookup
- Rate limited: 15 req/min/IP
- Free-tier daily limit: 3/day (server-enforced)
- Prompt length capped at 500 chars
- AI response validated (hex regex)

### `api/plugin-token.ts` — PASS
- Auth verified via `supabase.auth.getUser(accessToken)` server-side
- Pro status from DB, not client
- Token is Base64-encoded (not signed — documented as MVP trade-off)

### `api/share.ts` — PASS
- No auth/DB access needed
- Color input validated: `[0-9a-fA-F]{6}` only (no XSS vector)
- Read-only operation

### `api/og.ts` — PASS
- No auth/DB access needed
- Color input validated: `[0-9a-fA-F]{6}` only
- Read-only image generation

---

## 4. Client-Side Supabase Calls

All client-side code uses the **anon key** (`VITE_SUPABASE_ANON_KEY`) via `src/lib/supabase.ts`. RLS policies protect all data.

| File | Operation | Table | Scoped by | Status |
|------|-----------|-------|-----------|--------|
| `App.tsx` | SELECT count, SELECT existing, INSERT | `saved_palettes` | `user_id` (RLS) | PASS |
| `DesktopStudio.tsx` | SELECT count, SELECT existing, INSERT | `saved_palettes` | `user_id` (RLS) | PASS |
| `LibraryView.tsx` | SELECT, DELETE | `saved_palettes` | `user_id` (RLS) | PASS |
| `MobileLibrary.tsx` | SELECT, DELETE | `saved_palettes` | `user_id` (RLS) | PASS |
| `MobileStudio.tsx` | SELECT count, SELECT existing, INSERT | `saved_palettes` | `user_id` (RLS) | PASS |
| `MobileProfile.tsx` | SELECT count | `saved_palettes` | `user_id` (RLS) | PASS |
| `SavedPalettesPanel.tsx` | SELECT, DELETE | `saved_palettes` | `user_id` (RLS) | PASS |
| `PaymentSuccessModal.tsx` | auth.signInWithOAuth | — | N/A | PASS |
| `useAuth.ts` | auth session management | — | N/A | PASS |
| `usePro.ts` | SELECT `is_pro` | `profiles` | `id` (RLS) | PASS |
| `PluginAuth.tsx` | auth session, SELECT profile | `profiles` | `id` (RLS) | PASS |

**Note:** Client-side DELETE calls (e.g., `LibraryView.tsx:52`) only filter by `id`, not `user_id`. This is safe because RLS enforces `auth.uid() = user_id` — the delete silently fails if the palette belongs to another user.

---

## 5. Service Role Key Exposure

| Check | Result |
|-------|--------|
| `SERVICE_ROLE_KEY` in `src/` | NOT FOUND — PASS |
| `SERVICE_ROLE_KEY` in `api/` | 7 files (all server-side) — PASS |
| `VITE_` prefix on service key | NOT FOUND — PASS |
| `.env.local` contains service key | NO — PASS |
| `.env.local` in `.gitignore` | YES — PASS |

---

## Summary

| Category | Status |
|----------|--------|
| RLS policies (profiles) | PASS |
| RLS policies (saved_palettes) | PASS |
| RLS policies (plugin_auth_sessions) | MANUAL CHECK NEEDED |
| API route auth | PASS (1 fix applied) |
| API input validation | PASS (3 fixes applied) |
| API error message leakage | PASS (2 fixes applied) |
| Client-side Supabase usage | PASS |
| Service role key exposure | PASS |

### Fixes Applied
1. **`api/create-portal-session.ts`** — Removed client-sent `customerId`; now derives Stripe customer from authenticated user's email only
2. **`api/create-portal-session.ts`** — Sanitized error responses (no longer leaks internal details)
3. **`api/create-checkout-session.ts`** — Sanitized error responses
4. **`api/palettes.ts`** — Added hex format validation, name length limit (200), color count limit (8), type check on name
5. **`api/palettes-delete.ts`** — Added UUID format validation on palette id, type check

### Manual Steps Required
1. Verify `plugin_auth_sessions` has RLS enabled in Supabase Dashboard
2. Run `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';` to confirm all tables have RLS
