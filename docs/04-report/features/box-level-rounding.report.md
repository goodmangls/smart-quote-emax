---
template: report
version: 1.1
feature: box-level-rounding
date: 2026-06-05
author: jhlim725
project: emax-quote-system
version_app: 0.0.0
---

# box-level-rounding Completion Report

> **Status**: Complete
>
> **Project**: emax-quote-system (E-MAX Worldwide Express Smart Quote)
> **App Version**: 0.0.0
> **Author**: jhlim725
> **Completion Date**: 2026-06-05
> **PDCA Cycle**: direct-TDD (no formal plan/design phase — implemented test-first on E-MAX business confirmation)

---

## 1. Summary

### 1.1 Project Overview

| Item | Content |
|------|---------|
| Feature | box-level-rounding (per-box billable weight) |
| Trigger | E-MAX 확인: 멀티 박스(2+) 견적은 박스별로 올림 규칙 적용 |
| Start / End | 2026-06-05 (single session) |
| Method | TDD (RED→GREEN), frontend + backend mirror |

### 1.2 Results Summary

```
┌─────────────────────────────────────────────┐
│  Completion Rate: 100% (scope as specified)  │
├─────────────────────────────────────────────┤
│  ✅ FE implemented + verified end-to-end      │
│  ✅ BE mirrored + rspec verified (PG up)      │
│  ✅ Docs + policy updated                      │
└─────────────────────────────────────────────┘
```

### 1.3 Business Rule (the change)

```
billableWeight =
  Σᵢ roundToHalf( max(actualᵢ, volumetricᵢ) )   when totalBoxes (Σ quantity) ≥ 2   ← per-box (NEW)
  max( Σ actual, Σ volumetric )                  when single box (Σ quantity == 1)  ← legacy, unchanged
```

- `roundToHalf(x) = Math.ceil(x*2)/2` (round up to nearest 0.5kg) — unchanged helper, identical FE/BE.
- Volumetric divisor unchanged: EMAX `/6000`, others `/5000`. Dimension ceil unchanged. Packing buffer (+10/+10/+15cm, weight×1.1+10) applied before per-box rounding.
- **A안** chosen (round the per-box `max(actual, vol)`); B안 (round volumetric only) rejected because A안 keeps single-box results byte-identical, matching E-MAX's "2+ boxes" scoping.

---

## 2. Related Documents

| Phase | Document | Status |
|-------|----------|--------|
| Plan | — | ⏭️ skipped (direct TDD on business confirmation) |
| Design | — | ⏭️ skipped |
| Check | inline (this report §5) | ✅ |
| Act | Current document | ✅ |

---

## 3. Completed Items

### 3.1 Functional

| # | Item | Status |
|---|------|--------|
| 1 | Per-box chargeable weight for 2+ boxes (FE) | ✅ |
| 2 | Single-box legacy behavior preserved (FE) | ✅ |
| 3 | Backend mirror (item_cost.rb + quote_calculator.rb) | ✅ |
| 4 | FE↔BE numeric parity (32/6/50) | ✅ verified |
| 5 | Downstream consumers (rate lookup, FSC, addons, PDF, comparison) read engine `billableWeight` | ✅ confirmed (0 recompute sites) |

### 3.2 Non-Functional

| Item | Result |
|------|--------|
| FE typecheck (`tsc --noEmit`) | ✅ 0 errors |
| FE lint (ESLint --max-warnings 0) | ✅ clean |
| FE tests | ✅ 317/317 pass (33 files) |
| BE rspec (my specs) | ✅ 5/5 pass |
| BE rubocop (my files) | ✅ 0 offenses |

### 3.3 Deliverables (8 files)

| File | Change |
|------|--------|
| `src/features/quote/services/calculationService.ts` | `totalBillableWeight` field + per-box accumulation + orchestrator conditional |
| `smart-quote-api/app/services/calculators/item_cost.rb` | `total_billable_weight` + `round_to_half` |
| `smart-quote-api/app/services/quote_calculator.rb` | `total_box_count >= 2` billable selection |
| `src/features/quote/services/calculationService.test.ts` | +4 FE tests (A/B/C/D) |
| `smart-quote-api/spec/services/calculators/item_cost_spec.rb` | +3 BE tests (new) |
| `smart-quote-api/spec/services/quote_calculator_spec.rb` | +2 BE tests (new) |
| `…/__snapshots__/calculationParity.test.ts.snap` | 2 multi-box fixtures updated |
| `CLAUDE.md`, `src/config/business-rules.ts` | policy documented |

---

## 4. Incomplete Items

### 4.1 Carried Over

- None for this scope.

### 4.2 Cancelled / On Hold

- None.

---

## 5. Quality Metrics

### 5.1 Verification Evidence

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| FE A / BE multi-box mixed | 50×40×30 wt5 + 10×10×10 wt20 (UPS /5000) | 32.0 | ✅ |
| FE B / BE qty-3 rounding | 30×20×15 wt1 ×3 (/5000) | 6.0 | ✅ |
| FE C single-box guard | 30×20×15 wt1 ×1 | 1.8 (raw, legacy) | ✅ |
| FE D / BE EMAX /6000 | 60×50×40 wt1 + 10×10×10 wt30, FSC | billable 50, FSC 103000 | ✅ |

### 5.2 Snapshot Impact (parity fixtures)

Independent recomputation with real packing constants confirmed **only 2 fixtures changed**, both legitimate multi-box per-box rounding; all single-box fixtures byte-identical:

| Fixture | boxes | old → new billable | cost change |
|---------|-------|--------------------|-------------|
| `ups_vn_vacuum_fob` | 2 | 92.4 → 93.0 | none (UPS `ceil` absorbs) |
| `ups_us_ddp_full_options` | 3 | 64.1 → 65.0 | none |
| all single-box (5) | 1 | unchanged | none |
| homogeneous multi-box (54.0/63.0/10.0) | 2–5 | unchanged (per-box == total) | none |

### 5.3 Known Unrelated Failure

- `spec/services/discount_rule_resolver_spec.rb` caching test fails (`Rails.cache.read` → nil): test-env `Rails.cache` is NullStore. **Pre-existing, unrelated to this change.** Out of scope.

---

## 6. Lessons Learned (KPT)

### 6.1 Keep

- TDD with hand-computed expecteds (A/B/D) caught the exact behavior before implementing.
- Independent snapshot recomputation (real packing constants, separate from production code) proved single-box regression = 0 without trusting the code under test.
- A안 selected specifically because it makes single-box identical — aligning the implementation with E-MAX's "2+ boxes" wording.

### 6.2 Problem

- Backend rspec cannot run without a live PostgreSQL (`rails_helper` boots DB even for pure calculators) — initial verification was blocked until PG was started.
- The PDF cargo table's per-row "Vol. Weight" uses raw `l*w*h` (no dimension ceil) — a pre-existing display-only discrepancy vs the engine; not addressed (out of scope).

### 6.3 Try

- Consider a `spec_helper`-only (DB-less) suite for pure calculators so per-box math can be CI-verified without Postgres.

---

## 7. Process Improvement

### 7.1 PDCA

- This was a direct-TDD cycle (no plan/design docs) justified by an unambiguous, pre-confirmed business rule from E-MAX. For larger ambiguity, run `/pdca plan` first.

### 7.2 Tools/Environment

- Local backend testing requires `brew services start postgresql@16` + `RAILS_ENV=test bin/rails db:test:prepare`.

---

## 8. Next Steps

### 8.1 Immediate

- Commit (awaiting explicit request — `.commit_message.txt` prepared).
- Optional: `/code-review` before merge.
- On deploy: confirm CI runs the 2 new backend specs green; Render redeploy auto-triggers on `smart-quote-api/` change.

### 8.2 Next Cycle (candidates)

- PDF per-row "Vol. Weight" column: align to engine (dimension ceil) for display consistency.
- `discount_rule_resolver` caching spec: fix test-env cache store (separate infra cycle).

---

## 9. Changelog

### v1.0.0 (2026-06-05)

- feat(billable): per-box chargeable weight rounding for multi-box (2+) shipments, FE+BE mirrored, single-box preserved.
