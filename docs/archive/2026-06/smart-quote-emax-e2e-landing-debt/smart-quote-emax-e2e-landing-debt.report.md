---
template: report
version: 1.1
feature: smart-quote-emax-e2e-landing-debt
date: 2026-06-05
author: jhlim725
project: emax-quote-system
status: complete
---

# smart-quote-emax-e2e-landing-debt Completion Report

> **Status**: Complete
>
> **Project**: emax-quote-system (E-MAX Worldwide Express Smart Quote)
> **Author**: jhlim725
> **Completion Date**: 2026-06-05
> **PDCA Cycle**: Plan → Do → Report (Check는 e2e green 실측으로 갈음)

---

## 1. Summary

### 1.1 Overview

| Item | Content |
|------|---------|
| Feature | smart-quote-emax-e2e-landing-debt (stale e2e 셀렉터 정상화) |
| Trigger | GitHub Actions `e2e` job 수 주째 실패 → main CI 만성 red (box-level-rounding PR #1에서 admin merge 강제) |
| Goal | CI `e2e` green 회복 (main red 해소) |
| Method | 근본원인 진단 → 테스트 전용 수정 → 로컬/CI green 검증 |

### 1.2 Results

```
┌─────────────────────────────────────────────┐
│  Match Rate: 100% (DoD 4/4 충족)             │
├─────────────────────────────────────────────┤
│  ✅ 로컬 e2e 23/23 green                       │
│  ✅ CI(PR #2) check·e2e·lighthouse 전부 pass   │
│  ✅ main CI green — 만성 red 해소 확정          │
│  ✅ 앱 코드 0 변경 (테스트 전용)                │
└─────────────────────────────────────────────┘
```

### 1.3 Root Cause

CI 실패가 `landing.spec.ts:6`(=`page.locator('nav')`)에서 발생 → **앱은 정상 렌더, 셀렉터가 stale**. 기본 언어가 **`ko`**(`LanguageContext` fallback `return 'ko'`)인데 e2e 셀렉터가 **영문 텍스트 + 구 디자인**을 가정:

| stale 셀렉터 | 현재 마크업 |
|--------------|-------------|
| `page.locator('nav')` (landing) | 랜딩에 `<nav>` 없음 — Header는 `<header>` |
| `getByRole('link', /login\|signup/i)` | '로그인' / '무료로 시작하기' (ko) |
| `getByText(/WCA.*MPL.*EAN.*JCtrans/)` | 랜딩에서 제거(admin/auth로 이동) |
| `getByLabel(/email\|password/i)` (login) | '이메일 주소' / '비밀번호' (ko) |
| `getByRole('button', /sign in/i)` | '로그인' (ko) |

---

## 2. Related Documents

| Phase | Document | Status |
|-------|----------|--------|
| Plan | [smart-quote-emax-e2e-landing-debt.plan.md](../../01-plan/features/smart-quote-emax-e2e-landing-debt.plan.md) | ✅ |
| Check | 본 보고서 §5 (e2e green 실측) | ✅ |
| Report | 현재 문서 | ✅ |

---

## 3. Completed Items

### 3.1 Functional

| # | Item | Status |
|---|------|--------|
| 1 | `landing.spec.ts` 3개: `nav`→`header`, login/signup href, WCA hero→`h1` | ✅ |
| 2 | `login.spec.ts` 3개: `#email`/`#password`, `button[type=submit]`, `a[href="/signup"]` | ✅ |
| 3 | `accessibility.spec.ts` 1개: 로그인 폼 라벨 ko/en 동시 매칭(라벨-연결 의도 보존) | ✅ |
| 4 | i18n-robust 셀렉터(href/id/type/role) 전환 | ✅ |

### 3.2 Non-Functional

| Item | Result |
|------|--------|
| 로컬 전체 e2e (chromium) | ✅ 23 passed / 0 failed |
| ESLint (`--max-warnings 0`) | ✅ exit 0 |
| `tsc --noEmit` | ✅ exit 0 |
| 앱 코드 변경 | ✅ 0 (테스트·문서만) |

### 3.3 Deliverables

| File | Change |
|------|--------|
| `e2e/landing.spec.ts` | 셀렉터 href/header/h1 기반 |
| `e2e/login.spec.ts` | 셀렉터 id/type/href 기반 |
| `e2e/accessibility.spec.ts` | 라벨 ko/en 동시 매칭 |
| `docs/01-plan/.../...plan.md` | PDCA Plan |

---

## 4. Incomplete / Out of Scope

- **앱 코드 변경 없음** (의도) — LandingPage/Header/i18n/LoginPage 정상 동작.
- 기본 언어 정책(ko→en) 변경 — 별개 제품 결정, 미포함.
- Header에 시맨틱 `<nav>` 추가(접근성 개선) — 별개 후보, 미포함.
- CI Node 20 deprecation 경고 — 별개 인프라 항목.

---

## 5. Quality Metrics (Check)

### 5.1 검증 증거

| 단계 | 결과 |
|------|------|
| 로컬 e2e 변경 전 | landing 3 + login 3 + accessibility 1 = **4+ fail** (RED 확인) |
| 로컬 e2e 변경 후 | **23 passed, 0 failed** (GREEN) |
| CI PR #2 (run 27004086057) | check ✓ · e2e ✓ (1m17s) · lighthouse ✓ |
| main CI (run 27004256018, merge `c0a34d8`) | check ✓ · **e2e ✓ (1m25s)** · lighthouse ✓ → **main red 해소** |

### 5.2 스코프 확장 기록

Plan은 landing 한정이었으나, 구현 중 `login.spec.ts`·`accessibility.spec.ts`도 **동일 i18n 원인**으로 실패함을 발견 → CI green(목표) 달성을 위해 함께 수정. Plan §2.1 갱신 반영.

---

## 6. Lessons Learned (KPT)

### 6.1 Keep

- CI 실패 로그의 **줄·열 위치**(`:6:39`)를 정확히 읽어 `nav` 단언이 실제 원인임을 규명(초기엔 WCA 텍스트로 오판 → 로컬 재현으로 정정).
- **href/id/type 기반 셀렉터**로 전환해 i18n·리디자인에 강건한 테스트로 개선.
- 로컬 전체 e2e 실행으로 landing 외 추가 stale(login/accessibility) 조기 발견 → 한 번에 CI green.

### 6.2 Problem

- e2e 셀렉터가 지역화 텍스트(영문)에 결합돼 ko 기본 전환 후 광범위 stale 발생.
- main이 수 주째 red여도 방치됨(릴리스 게이트로 작동 안 함).

### 6.3 Try

- e2e 셀렉터 규칙(href/role/test-id 우선, 지역화 텍스트 회피)을 컨벤션 문서화.
- main red 시 알림/차단 정책(branch protection required checks) 검토.

---

## 7. Process Improvement

- **PDCA**: Plan 단계에서 단일 스펙만 가정했으나 구현 중 전체 e2e 실행으로 스코프를 실측 보정 — 초기 Plan에 "전체 e2e 1회 실행으로 영향 범위 확정" 단계 추가 권장.

---

## 8. Next Steps

### 8.1 Immediate

- `/pdca archive smart-quote-emax-e2e-landing-debt` 로 사이클 마감(docs/archive/2026-06/ 이관).

### 8.2 Next Cycle (candidates)

- Header 시맨틱 `<nav>`/landmark 추가(접근성).
- CI Node 20→24 actions 업그레이드.
- e2e 셀렉터 컨벤션 문서화 + `data-testid` 도입 검토.

---

## 9. Changelog

### v1.0.0 (2026-06-05)

- test(e2e): stale 랜딩/로그인/접근성 셀렉터를 href/id/type 기반으로 정상화, CI e2e red 해소. PR #2 admin squash merge `c0a34d8`.
