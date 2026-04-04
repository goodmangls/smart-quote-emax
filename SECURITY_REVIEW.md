# smart-quote-main Security & API Review

Date: 2026-03-28  
Reviewer: Codex  
Project: `/Users/jaehong/Developer/Projects/smart-quote-main`

## Scope

Reviewed:
- `src/api/apiClient.ts`
- `src/lib/slackNotification.ts`
- `src/contexts/AuthContext.tsx`
- `src/components/ProtectedRoute.tsx`
- Hardcoded secret/API key/token scan across `src/`

## Executive Summary

No hardcoded secrets were found in `src/`, but there are two meaningful frontend security issues:

1. Authentication tokens are stored in `localStorage`, which makes them accessible to JavaScript and therefore vulnerable to exfiltration through XSS.
2. `VITE_EIA_API_KEY` is exposed in client-side code and sent directly from the browser to a third-party API.

The project also relies on client-side route protection for admin pages. That is acceptable as a UX guard, but it is not a security boundary. Real protection depends on backend authorization enforcement for admin and sensitive endpoints.

## Severity Summary

- Critical: 0
- High: 2
- Medium: 3
- Low: 3

## Findings

### High

#### H-1: Auth tokens are stored in `localStorage`
Files:
- `src/api/apiClient.ts:15`
- `src/contexts/AuthContext.tsx:68`
- `src/contexts/AuthContext.tsx:102`
- `src/contexts/AuthContext.tsx:131`
- `src/api/quoteApi.ts:125`

Details:
- The application reads bearer tokens from `localStorage` and injects them into `Authorization` headers.
- Login and signup flows persist tokens to `localStorage`.
- Password update and CSV export also read the same token from browser storage.

Risk:
- Any XSS in the app can read and exfiltrate the token.
- A stolen token can be replayed directly against backend APIs.
- Frontend logout does not protect against previously stolen tokens.

Recommendation:
- Replace this with `HttpOnly`, `Secure`, `SameSite` cookies or a server-backed session model.
- If migration cannot happen immediately, isolate token access behind a single storage helper to reduce blast radius.

---

#### H-2: `VITE_EIA_API_KEY` is exposed client-side
Files:
- `src/api/eiaApi.ts:11`
- `src/api/eiaApi.ts:17`

Details:
- The EIA API key is read from `import.meta.env.VITE_EIA_API_KEY`.
- The key is appended to the outgoing third-party request URL from the browser.

Risk:
- Any `VITE_*` variable is bundled into the frontend and is public to end users.
- The key may leak through browser devtools, logs, proxies, and monitoring systems.
- If the provider expects the key to be private or rate-limited, the integration is insecure by design.

Recommendation:
- Move the EIA integration behind the backend.
- Expose a server endpoint such as `GET /api/v1/market/jet-fuel?weeks=12`.
- Store the real EIA key only in server-side environment configuration.

---

### Medium

#### M-1: Frontend surfaces backend error messages directly
Files:
- `src/api/apiClient.ts:32`
- `src/api/apiClient.ts:35`
- `src/contexts/AuthContext.tsx:73`
- `src/contexts/AuthContext.tsx:107`
- `src/contexts/AuthContext.tsx:151`

Details:
- The frontend parses backend error payloads and forwards those messages into thrown errors or auth results.
- This behavior can expose backend internals if the server returns verbose messages.

Risk:
- Leakage of implementation details, auth failure reasons, or internal exception text.
- Possible account enumeration if login failures differ between cases.

Recommendation:
- Normalize frontend-visible errors to a safe allowlist:
  - `401` -> `Session expired`
  - `403` -> `Access denied`
  - `404` -> `Not found`
  - `5xx` -> `Server error`
  - fallback -> `Request failed`

---

#### M-2: `ProtectedRoute` is client-side only
Files:
- `src/components/ProtectedRoute.tsx:14`
- `src/components/ProtectedRoute.tsx:18`
- `src/App.tsx:65`
- `src/App.tsx:77`

Details:
- `ProtectedRoute` checks `isAuthenticated` and `user.role` in the browser.
- Admin-only pages are hidden or redirected client-side.

Risk:
- This is not a true security boundary.
- If backend endpoints used by `/admin` or `/schedule` do not enforce authorization server-side, a user can bypass the SPA and access those APIs directly.

Recommendation:
- Verify that all admin endpoints enforce both authentication and role authorization on the server.
- Keep `ProtectedRoute` as UX only.

---

#### M-3: Logout appears client-only from the visible frontend
File:
- `src/contexts/AuthContext.tsx:115`

Details:
- Logout clears local auth state and removes the browser-stored token.
- No backend revocation or logout endpoint is visible in the reviewed frontend code.

Risk:
- If tokens are long-lived and one is stolen, logout may not invalidate it server-side.
- Session invalidation policy is unclear.

Recommendation:
- Add and use a backend logout/revocation endpoint if not already present.
- Define token/session lifetime and revocation behavior explicitly.

---

### Low

#### L-1: No embedded Slack credentials found
File:
- `src/lib/slackNotification.ts`

Details:
- No Slack webhook URL, bot token, or secret is hardcoded in this file.
- Notifications are sent through the application API, not directly to Slack from the browser.

Risk:
- None from embedded credential exposure in this file.

Recommendation:
- Keep Slack credentials server-side only.

---

#### L-2: Slack notification payload includes user PII
Files:
- `src/lib/slackNotification.ts:21`
- `src/lib/slackNotification.ts:30`

Details:
- The Slack notification includes `company / name / email`.

Risk:
- User identity data may be over-shared into Slack channels.
- This is a privacy/data minimization issue rather than a credential leak.

Recommendation:
- Remove or mask email unless it is strictly required operationally.
- Prefer `company / name` or masked email.

---

#### L-3: Sentry scrubbing should be verified
File:
- `src/lib/slackNotification.ts:38`

Details:
- Slack notification failures are captured to Sentry.
- No direct credential leak is visible in code, but the telemetry policy was not reviewed.

Risk:
- Request payloads, emails, or auth metadata may be captured if scrubbing is insufficient.

Recommendation:
- Confirm `Authorization`, request bodies, and user PII are redacted in Sentry.

## Hardcoded Secret Scan

### Scan Outcome
No hardcoded secrets or tokens were found in `src/`.

### Client-exposed env keys observed
From `src/vite-env.d.ts`:
- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_SENTRY_DSN`
- `VITE_CHANNEL_TALK_PLUGIN_KEY`
- `VITE_ENABLE_SENTRY`
- `VITE_EIA_API_KEY`

### Assessment
- `VITE_SUPABASE_ANON_KEY`, browser Google Maps keys, Sentry DSN, and ChannelTalk plugin keys may be intentionally public client identifiers.
- `VITE_EIA_API_KEY` is the one that should not remain in frontend code.

## Affected Code References

### `src/api/apiClient.ts`
- Reads token from `localStorage`
- Adds `Authorization` header
- Emits auth-expired event on `401`
- Surfaces backend messages directly

### `src/contexts/AuthContext.tsx`
- Stores token on login/signup
- Validates token on mount
- Clears token on logout
- Uses raw `fetch` for auth flows
- Surfaces backend messages directly

### `src/components/ProtectedRoute.tsx`
- Redirects unauthenticated users to `/login`
- Redirects non-admin users away from admin-only pages

### `src/lib/slackNotification.ts`
- No embedded secrets
- Sends user PII in notification payload
- Reports failures to Sentry

### `src/api/eiaApi.ts`
- Reads public env key
- Sends key in client-side request URL

## Recommended Remediation Plan

### Immediate
1. Audit backend auth and role enforcement for:
   - admin endpoints
   - schedule endpoints
   - quote export
   - password update
   - Slack notification endpoint
2. Move EIA API access behind the backend.
3. Stop relying on `localStorage` for auth tokens.

### Short-Term
1. Add an auth storage abstraction to isolate token handling.
2. Centralize auth calls in a dedicated auth API module.
3. Normalize frontend-visible errors.
4. Add backend logout/revocation support if missing.

### Follow-Up
1. Reduce Slack PII.
2. Verify Sentry scrubbing.
3. Optionally generalize `ProtectedRoute` role checks for maintainability.

## Suggested Engineering Tasks

1. Replace `localStorage` token handling with a safer session model.
2. Add `src/lib/authStorage.ts` as an interim containment step.
3. Refactor `src/api/apiClient.ts` to normalize errors.
4. Add `src/api/authApi.ts` and move auth fetch logic out of `AuthContext.tsx`.
5. Refactor `src/api/quoteApi.ts` export flow to stop direct token access.
6. Proxy EIA requests through the backend and remove `VITE_EIA_API_KEY` from the frontend.
7. Review Slack notification payload minimization.
8. Confirm Sentry scrubbing of auth and PII.

## QA Verification Checklist

1. Verify no bearer token is readable from browser storage after auth changes.
2. Verify `401` forces logout and shows a generic safe message.
3. Verify admin APIs reject non-admin users server-side.
4. Verify quote export rejects unauthorized requests server-side.
5. Verify browser network traffic no longer contains the EIA key.
6. Verify Slack messages no longer include unnecessary PII.
7. Verify Sentry does not capture auth headers or sensitive payloads.

## Final Assessment

No committed secrets were found in `src/`. The main frontend security weaknesses are:
- browser-readable auth tokens
- client-exposed third-party API key

The largest unresolved risk is backend authorization. If backend auth and role enforcement are strong, the main remaining work is frontend hardening. If not, admin and sensitive flows may be directly exploitable outside the SPA.
