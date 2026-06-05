---
template: plan
version: 1.1
feature: smart-quote-emax-e2e-landing-debt
date: 2026-06-05
author: jhlim725
project: emax-quote-system
status: draft
---

# smart-quote-emax-e2e-landing-debt Plan

> **Status**: Draft
> **Project**: emax-quote-system (E-MAX Worldwide Express)
> **Author**: jhlim725
> **Created**: 2026-06-05
> **PDCA Phase**: Plan

---

## 1. Overview

### 1.1 Purpose

GitHub Actions `e2e` job(`e2e/landing.spec.ts`)이 수 주째 실패해 **main CI가 만성 red**입니다(2026-05-17~06-02 main run 5/5 failure, PR #1에서도 동일). 이 사이클은 **e2e 랜딩 테스트를 현재 마크업/i18n에 맞게 정상화**하여 CI를 green으로 회복합니다.

### 1.2 Background

**진단 결과(2026-06-05, 코드 검증 완료): 앱은 정상, e2e 테스트가 stale.**

CI 실패 로그가 `landing.spec.ts:6`(WCA 텍스트 줄)에서 발생 → 직전 라인 5(`nav` visible)는 통과 = **Vite dev 서버·앱 렌더 정상**. 실패는 셀렉터가 현재 랜딩 페이지와 불일치하기 때문:

| # | 테스트 단언 | 현재 실제 | 결과 |
|---|-------------|-----------|------|
| 1 | `getByText(/WCA.*MPL.*EAN.*JCtrans/)` (hero) | 해당 텍스트는 LandingPage에 없음 — admin `UserManagementWidget`·auth로 이동 | ❌ |
| 2 | `getByRole('link', {name: /sign in\|login/i})` | login 링크 텍스트 = `t('nav.login')` = **'로그인'** (기본 언어 ko) | ❌ |
| 2 | `getByRole('link', {name: /sign up\|signup\|register/i})` | signup 링크 텍스트 = `t('landing.getStarted')` = **'무료로 시작하기'** | ❌ |
| 3 | `/sign in\|login/i` 링크 click → `/login` | '로그인' 미매칭 → locator 30s 타임아웃 | ❌ |

**근본 원인**: 기본 언어가 **`ko`** (`LanguageContext` line 21: localStorage 없을 때 `return 'ko'`)이고 랜딩 페이지가 재디자인(CTA '무료로 시작하기', login '로그인', freight network 배지 admin/auth로 이동)되었으나, e2e 셀렉터는 **영문 텍스트 + 구 디자인**을 가정하고 있음.

### 1.3 Related Documents

| Type | Link |
|------|------|
| Memory | `project_smart_quote_emax_e2e_landing_debt` (분리 사이클 후보 기록) |
| Parent | PR #1 box-level-rounding (admin merge `0f69e08`, e2e debt로 인해 admin merge 사용) |
| Reference | `[[project_asca_e2e_clerk_key_debt_candidate]]` (유사 e2e 인프라 debt 패턴) |

---

## 2. Scope

### 2.1 In Scope

- **CI를 막는 stale e2e 스펙 전부** 현재 마크업/i18n에 맞게 수정 (**테스트 전용**) — 구현 중 landing 외 login·accessibility 도 동일 원인으로 실패 확인되어 스코프 확장:
  - `e2e/landing.spec.ts` (3): `nav`→`header`(랜딩에 `<nav>` 없음), login/signup href 기반, stale WCA hero 단언 제거→`h1`
  - `e2e/login.spec.ts` (3): `getByLabel(/email|password/)`→`#email`/`#password`, `getByRole(button /sign in/)`→`button[type=submit]`, `getByRole(link /sign up/)`→`a[href="/signup"]`
  - `e2e/accessibility.spec.ts` (1): login 폼 라벨 검증을 ko/en 동시 매칭(`/이메일|email/`, `/비밀번호|password/`)으로 라벨-연결 의도 보존
- i18n-robust 셀렉터로 전환: 지역화 텍스트 대신 **`href`/`id`/`type`/role 기반**
- 로컬 Playwright 실행으로 green 확인 → CI green 검증

### 2.2 Out of Scope

- **앱 코드 변경 없음** (LandingPage/Header/i18n/auth 미변경 — 앱은 정상 동작)
- 기본 언어 정책 변경(ko→en) — 별개 제품 결정
- 다른 e2e 스펙(quote, auth 등) 점검 — 본 사이클은 landing.spec.ts 한정
- CI 워크플로 구조 변경(Node 20 deprecation 경고 등은 별개)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | `landing.spec.ts` 3개 테스트가 기본 언어(ko) 상태에서 통과 |
| FR-2 | login/signup 링크 선택은 `href` 기반으로 i18n에 무관하게 동작 |
| FR-3 | hero 단언은 실제 렌더되는 안정 요소(`nav`, hero heading by role, 또는 `a[href="/signup"]`)로 검증 |
| FR-4 | "navigates to login" 은 `a[href="/login"]` 클릭 → URL `/login` 확인 |

### 3.2 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | 테스트는 결정적(deterministic) — 타임아웃 의존 금지, 안정 셀렉터 |
| NFR-2 | 향후 i18n 텍스트 변경에 깨지지 않도록 href/role 우선 |
| NFR-3 | 로컬·CI 모두 green (chromium) |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [x] `npx playwright test` 로컬 green (기본 ko) — **23 passed, 0 failed**
- [ ] CI `e2e` job green → 전체 CI run success (main red 해소)
- [x] 앱 코드 0 변경 (diff는 `e2e/*.spec.ts` 3파일 한정)
- [ ] `.commit_message.txt` 기록 + PR 생성

### 4.2 Quality Criteria

- [ ] 셀렉터가 href/role 기반(텍스트 regex 최소화)
- [ ] 3개 테스트 각각 단일 행위 검증, 명확한 이름 유지
- [ ] Playwright `--reporter` CI 모드 정상 동작

---

## 5. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 랜딩에 login/signup 링크가 인증 상태에 따라 조건부(`!isAuthenticated`) | 미인증 기본 상태이므로 렌더됨 | 테스트는 미인증(fresh context)이라 안전; 필요시 명시적 logout 상태 보장 |
| Header nav + hero 양쪽에 `/login` 링크 존재 | `.first()` 모호 | href 셀렉터 + `.first()` 유지, 또는 hero 영역 scope |
| 다른 e2e 스펙도 stale일 수 있음 | CI 여전히 red | 본 사이클은 landing 한정; 추가 발견 시 후속 사이클로 분리 |
| webServer `npm run dev` CI 기동 지연 | flaky | 현재 nav 통과로 기동 정상 확인됨; 변경 없음 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

- **Level**: Starter (test-only 수정, 인프라/아키텍처 변경 없음)

### 6.2 Key Architectural Decisions

- **AD-1**: 지역화 텍스트 셀렉터 → `href` 기반 전환. 이유: i18n 기본 언어가 ko이고 텍스트는 변동성 큼; route href는 안정적.
- **AD-2**: 앱 수정 대신 테스트 수정. 이유: 앱은 정상 렌더(진단 확인); 실패는 테스트의 stale 가정.
- **AD-3**: hero 배지(WCA 등) 단언 제거. 이유: 해당 콘텐츠가 랜딩에서 제거/이동됨; 존재하지 않는 요소 단언은 무의미.

### 6.3 Clean Architecture Approach

- 테스트 레이어만 수정, 프로덕션 코드 불변 → 관심사 분리 유지.

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- Playwright config: `npm run dev` webServer, baseURL `http://localhost:5173`, timeout 30s, CI reporter `github`.
- i18n: `useLanguage().t(key)`, 기본 언어 ko, localStorage key `smartQuoteLanguage`.

### 7.2 Conventions to Define/Verify

- e2e 셀렉터 표준: **href/role 우선, 지역화 텍스트 회피** (본 사이클에서 정착).

### 7.3 Environment Variables Needed

- 없음 (e2e는 dev 서버 기동만; Supabase env 없이도 랜딩 렌더 정상 확인됨).

### 7.4 Pipeline Integration

- Phase 8(Review)/Phase 9(Deployment) 해당 — CI green 회복이 핵심 산출물.

---

## 8. Next Steps

1. `/pdca design smart-quote-emax-e2e-landing-debt` — 셀렉터 교체 상세 설계(테스트별 before/after)
2. 구현: `e2e/landing.spec.ts` href 기반 재작성 (TDD: 로컬 실행으로 red→green 확인)
3. 로컬 `npx playwright install chromium && npx playwright test e2e/landing.spec.ts`
4. PR → CI `e2e` green 확인 → merge → main CI red 해소

> **권장**: 본 사이클은 Starter 수준 test-only라 Plan→구현 직행 가능. design 단계는 선택(셀렉터 매핑이 단순).

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-06-05 | jhlim725 | 초안 — 근본 원인(stale e2e 셀렉터 + ko 기본 언어) 진단 기반 Plan |
