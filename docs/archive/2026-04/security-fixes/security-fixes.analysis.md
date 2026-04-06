# security-fixes Gap Analysis Report

## Analysis Overview

- **Feature**: security-fixes (Code Quality/Security Audit - 10 HIGH Priority Issues)
- **Project**: smart-quote-emax (E-MAX Worldwide Express)
- **Analysis Date**: 2026-04-06
- **Analyzer**: bkit:gap-detector

---

## Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match (10/10 items) | 100% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |
| **Overall Match Rate** | **100%** | **PASS** |

---

## Item-by-Item Verification

### 1. B-H5/H6: DB Unique Indexes -- PASS

**File**: `smart-quote-api/db/migrate/20260406000001_add_unique_indexes_to_users_and_quotes.rb`

- `LOWER(email)` unique index on `users` (case-insensitive)
- `reference_no` unique index on `quotes`
- Bonus: performance indexes (status+validity_date, destination_country, user_id+created_at)

### 2. B-H7: Reference Number Race Condition -- PASS

**File**: `smart-quote-api/app/models/quote.rb` -- `generate_reference_no`

- `pg_advisory_lock` acquired before sequence lookup
- `pg_advisory_unlock` in `ensure` block
- Lock key derived from year hash

### 3. F-H1: EIA API Key Backend Proxy -- PASS

- **Backend**: `smart-quote-api/app/controllers/api/v1/jet_fuel_controller.rb` -- `ENV["EIA_API_KEY"]` server-side
- **Route**: `config/routes.rb` -- `get "jet_fuel"`
- **Frontend**: `src/api/eiaApi.ts` -- calls `${API_URL}/api/v1/jet_fuel`, no `VITE_EIA_API_KEY`
- **Tests**: `src/api/__tests__/eiaApi.test.ts` -- updated for proxy pattern

### 4. B-H3: Refresh Token Rotation -- PASS

- **Migration**: `20260406000002_add_refresh_token_jti_to_users.rb`
- **JWT**: `jwt_authenticatable.rb` -- `SecureRandom.uuid` jti, `update_column(:refresh_token_jti)`, validates jti on decode
- **Auth**: `auth_controller.rb` -- `refresh` returns new `refresh_token` (rotation)
- **Frontend**: `AuthContext.tsx` -- saves rotated token in mount-restore + auto-refresh

### 5. F-H3: Sentry tracesSampleRate -- PASS

**File**: `src/index.tsx`

```typescript
tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
```

### 6. F-H4: exchangeRateApi JSON.parse Safety -- PASS

**File**: `src/api/exchangeRateApi.ts`

```typescript
try { prev = JSON.parse(prevRaw); } catch { /* corrupted localStorage */ }
```

### 7. B-H1: Stale Drafts Separation -- PASS

**File**: `smart-quote-api/app/controllers/api/v1/quotes_controller.rb`

- `expire_stale_drafts!` private method with `Rails.cache` 10-minute guard
- No longer runs `update_all` on every GET request

### 8. B-H2: /auth/promote Rate Limiting -- PASS

**File**: `smart-quote-api/config/initializers/rack_attack.rb`

```ruby
throttle("auth/promote", limit: 3, period: 3600)
```

### 9. B-H4: JWT Duplicate Expiry Check Removal -- PASS

**File**: `smart-quote-api/app/controllers/concerns/jwt_authenticatable.rb`

- No manual `payload["exp"]` check — relies on `JWT::ExpiredSignature` rescue

### 10. M1: Carrier Calculation Code Deduplication -- PASS

- **Module**: `smart-quote-api/app/services/calculators/base_rate_lookup.rb`
- **Included by**: `ups_cost.rb`, `dhl_cost.rb`, `fedex_cost.rb`
- Each provides `exact_rates` and `range_rates` private methods

---

## Test Verification

| Check | Result |
|-------|--------|
| TypeScript (`tsc --noEmit`) | No errors |
| ESLint (`--max-warnings 0`) | No warnings |
| Vitest (32 files, 1204 tests) | All passing |

---

## Conclusion

**Match Rate: 100%** -- All 10 planned fixes fully implemented with no deviations.

Next step: `/pdca report security-fixes`
