---
template: plan
version: 1.2
feature: security-perf-hardening
date: 2026-04-24
author: jaehong
project: emax-quote-system (smart-quote-emax)
version_project: 0.0.0
---

# security-perf-hardening Planning Document

> **Summary**: code_analysis로 식별된 CRITICAL 3건(폰트 번들 3MB, VITE_ API 키 노출, npm audit 15건)을 해소해 번들 크기와 시크릿 노출 공격면을 제거한다
>
> **Project**: emax-quote-system (smart-quote-emax)
> **Version**: 0.0.0
> **Author**: jaehong
> **Date**: 2026-04-24
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

2026-04-24 종합 코드 분석에서 확인된 CRITICAL 3건을 일괄 해결한다:
- **C1**: `src/assets/fonts/NotoSansKR-Regular-base64.ts` (3.0MB base64)가 메인 JS 번들에 포함 → LCP +1~2초
- **C2**: `VITE_SLACK_WEBHOOK_URL` / `VITE_EIA_API_KEY` / `VITE_GOOGLE_MAPS_API_KEY`가 Vite 빌드 시 클라이언트 JS에 평문 인라인 → DevTools로 즉시 추출 가능
- **C3**: `npm audit` 15건 취약점 (1 critical, 9 high, 5 moderate) — undici CRLF/DoS, vite Path Traversal, jspdf dompurify 등

### 1.2 Background

`code_analysis` 결과 종합 점수 66/100 (보안 55, 성능 50). 린트/타입은 통과 상태지만, 모바일 사용자의 초기 로딩 체감이 크게 악화되고 있고 외부 API 할당량/요금이 악용 가능한 상태. 각 문제가 독립적으로 작업 가능하지만 연관된 Vercel 배포 설정/ENV 개편을 공유하기에 한 스프린트로 묶는다.

### 1.3 Related Documents

- 코드 분석 출처: 2026-04-24 `/code_analysis` 세션
- 관련 문서: `BACKEND_SECURITY_NOTES.md`, `SECURITY_REVIEW.md`
- 커밋 기록: `.commit_message.txt` (직전 분석 요약)

---

## 2. Scope

### 2.1 In Scope

- [ ] **C1**: NotoSansKR-Regular-base64.ts 제거 → `public/assets/fonts/NotoSansKR-Regular.woff2` 분리, `@font-face` + `<link rel="preload">`
- [ ] **C1**: `src/lib/pdfFontLoader.ts` jsPDF용 폰트 로딩을 동적 `fetch()` + `addFileToVFS()`로 재작성
- [ ] **C2**: Slack Webhook을 `api/slack-notify.ts`(Vercel serverless) 프록시로 이동, 클라이언트는 `/api/slack-notify`만 호출
- [ ] **C2**: EIA API Key를 `api/jet-fuel.ts` 프록시로 이동, 서버에서만 key 사용
- [ ] **C2**: Google Maps API Key는 GCP 콘솔에서 HTTP Referrer 제한(`smart-quote-emax.vercel.app/*`, `localhost:5173/*`)만 추가 (VITE_ 유지 — Maps JS SDK는 브라우저 필수)
- [ ] **C3**: `npm audit fix` (non-breaking) → `jspdf@4.x`, `vite@6.5+`, `@vercel/node@4.x` 등 수동 업그레이드 검토 후 적용
- [ ] 전체 회귀 테스트 (`npx vitest run`, `npx playwright test`), Vercel preview에서 PDF 생성·Slack 알림·Jet Fuel 위젯·Maps 로드 검수
- [ ] Vercel 환경변수 재구성: 서버 전용 키(`SLACK_WEBHOOK_URL`, `EIA_API_KEY`)로 추가, 기존 `VITE_*` 2건 삭제

### 2.2 Out of Scope

- HIGH 8건(Refresh Token HttpOnly 쿠키, calculateQuote 리팩토링, Admin Widget 분리, Vercel API timeout, AuthContext 에러 처리, ProtectedRoute 백엔드 검증 등) — 다음 스프린트
- Supabase Anon Key 변경 (공개용 키이므로 그대로 유지, 정책은 별도 점검)
- 번역 파일 모듈화, translations.ts 분할 등 유지보수성 이슈
- 백엔드(Rails) 변경 — 이번 스프린트는 프론트/serverless만

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | PDF 생성 기능(견적서 다운로드)이 폰트 분리 후에도 한글/영문 동일하게 렌더링 | High | Pending |
| FR-02 | Member 사용자의 Slack 알림이 `api/slack-notify.ts` 프록시 경유로 동작 (기능 동일) | High | Pending |
| FR-03 | Jet Fuel Widget이 `api/jet-fuel.ts` 프록시를 통해 데이터 표시 (EIA 키 서버 전용) | High | Pending |
| FR-04 | Google Maps 로드가 Referrer 제한 하에서 정상 동작 (허용된 도메인만) | High | Pending |
| FR-05 | `npm audit` 결과가 critical 0건, high 0건 | High | Pending |
| FR-06 | 기존 Vitest 1,193개 테스트 전부 통과 | High | Pending |
| FR-07 | Playwright E2E (landing, login, magic-link-auth, accessibility) 통과 | Medium | Pending |
| FR-08 | `.env.example` 업데이트 — 서버 키는 VITE_ prefix 없음 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 초기 JS 번들(main chunk) gzipped 사이즈 **50% 이상 감소** | `vite build` 출력 + `dist/` 용량 비교 |
| Performance | Lighthouse LCP < 2.5s (모바일 slow 4G 시뮬레이션) | `lighthouserc.json` 실행 |
| Performance | PDF 생성 첫 호출 지연 허용치 +500ms (동적 fetch) | 수동 타이밍 |
| Security | 클라이언트 번들(`dist/assets/*.js`)에서 Slack Webhook URL, EIA Key 문자열 **검출 불가** | `grep -r "hooks.slack.com\|eia.gov.*api_key" dist/` |
| Security | `npm audit --audit-level=high` 0건 | CI/로컬 실행 |
| Security | Google Maps 키 직접 호출 시 `RefererNotAllowedMapError` 반환 (401 대신 정상 제한) | 외부 도메인에서 수동 호출 |
| Accessibility | 폰트 교체 후 Korean/CJK 문자 렌더 안정, FOUT/FOIT 없음 | 시각 검수 + `font-display: swap` |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] C1/C2/C3 모든 In Scope 항목 구현 완료
- [ ] 기존 32개 테스트 파일(1,193 테스트) 100% 통과
- [ ] `npm run build` 성공, 메인 번들 gzipped 50%+ 감축 확인
- [ ] `npm audit --audit-level=high` 0건
- [ ] `grep` 스캔으로 클라이언트 번들 내 시크릿 문자열 없음 검증
- [ ] Vercel preview 배포에서 4개 핵심 기능(PDF 생성 / Slack 알림 / Jet Fuel / Maps) 정상
- [ ] `docs/02-design/features/security-perf-hardening.design.md` 작성
- [ ] `.commit_message.txt`에 변경 요약 기록

### 4.2 Quality Criteria

- [ ] 테스트 커버리지 기존 수준 유지 (회귀 없음)
- [ ] `npm run lint` 0 에러/0 warning
- [ ] `npx tsc --noEmit` 0 에러
- [ ] `npm run build` 성공

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| jsPDF 4.x 마이그레이션 breaking change (API 변경) | High | Medium | 먼저 `npm audit fix` non-breaking만, jsPDF는 별도 브랜치에서 검증. 현재 2.5.1 유지하고 dompurify만 업그레이드 가능하면 우선 적용 |
| 폰트 동적 로드 실패 시 PDF 한글 깨짐 | High | Low | `pdfFontLoader.ts`에 retry + fallback 경로(번들 내 mini 서브셋), Sentry 에러 추적 |
| Slack/EIA 프록시 지연으로 UX 악화 | Medium | Medium | Vercel serverless 5초 timeout + AbortController, 실패 시 위젯 skeleton 유지 |
| Google Maps Referrer 제한 설정 실수로 프로덕션 지도 차단 | High | Low | 스테이징/preview 도메인 먼저 테스트 후 프로덕션 적용, GCP 콘솔에서 즉시 복구 가능 |
| Vite 6.5 업그레이드 시 `@vitejs/plugin-react` 호환성 | Medium | Low | 로컬에서 `npm run dev` + `npm run build` 검증 후 PR |
| 기존 VITE_ 환경변수 삭제 시 다른 환경(`.env.local`) 누락 | Low | High | `.env.example`에서 명확히 구분, 배포 전 Vercel dashboard 점검 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| Starter | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, services layer | Web apps with backend (현재 프로젝트) | ☑ |
| Enterprise | Strict layer separation, DI | High-traffic complex systems | ☐ |

**선정 사유**: 기존 smart-quote-emax가 이미 Dynamic 구조(`src/features/`, `src/api/`, `src/lib/`)를 채택. 이번 하드닝은 신규 레이어를 추가하지 않고 기존 구조 내에서 진행.

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 폰트 로딩 전략 | base64 인라인 / woff2 @font-face / CDN | **woff2 @font-face + preload** | 번들 크기 감축 + 브라우저 캐시 활용, 오프라인 환경도 ServiceWorker로 대응 가능 |
| jsPDF 폰트 주입 | base64 string / fetch + ArrayBuffer | **fetch + ArrayBuffer (addFileToVFS)** | 번들에서 3MB 제거, PDF 첫 호출 시만 비용 발생 |
| 민감 키 프록시 | Vercel serverless / Rails API / Supabase Edge | **Vercel serverless (api/)** | 이미 `api/fsc.ts`, `api/exchange-rate.ts` 등 같은 패턴 구축됨 |
| Maps 키 보호 | 서버 프록시 / Referrer 제한 | **Referrer 제한만** | Google Maps JS SDK는 브라우저 키가 필수(프록시 불가), Referrer + 쿼터 제한으로 충분 |
| 의존성 업그레이드 순서 | 일괄 `audit fix --force` / 개별 수동 | **개별 수동 (critical → high 순)** | breaking change 리스크 분리, 각 단계에서 회귀 테스트 가능 |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic (기존 구조 유지)

영향 영역:
┌─────────────────────────────────────────────────────┐
│ api/                    (serverless 추가)           │
│   ├── slack-notify.ts   (NEW, C2)                   │
│   ├── jet-fuel.ts       (NEW, C2)                   │
│   └── ... (기존)                                    │
│ public/assets/fonts/    (NEW, C1)                   │
│   └── NotoSansKR-Regular.woff2                      │
│ src/lib/                                            │
│   ├── pdfFontLoader.ts  (재작성, C1)                │
│   └── slackNotification.ts (엔드포인트 변경, C2)    │
│ src/api/                                            │
│   └── eiaApi.ts         (프록시 경유, C2)           │
│ src/assets/fonts/       (삭제, C1)                  │
│ package.json            (버전 업그레이드, C3)       │
└─────────────────────────────────────────────────────┘
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` 코딩/아키텍처 섹션 존재
- [ ] `docs/01-plan/conventions.md` 별도 파일 없음 (CLAUDE.md에 통합)
- [x] `.eslintrc.cjs` 존재
- [x] `.prettierrc` 존재
- [x] `tsconfig.json` 존재 (path alias `@/` → `src/`)

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| Naming | exists | 신규 serverless 파일은 `api/{feature}.ts` kebab-case | Low |
| Folder structure | exists | `public/assets/fonts/` 신설 | Medium |
| Environment variables | partial | 서버 전용 키는 VITE_ prefix 금지 규칙 추가 | **High** |
| Error handling | exists (Sentry) | 프록시 실패 시 fallback UI 패턴 | Medium |
| Import order | exists | 변경 없음 | Low |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `SLACK_WEBHOOK_URL` | 서버 전용 Slack 프록시 | **Server** (Vercel) | ☑ |
| `EIA_API_KEY` | 서버 전용 EIA 프록시 | **Server** (Vercel) | ☑ |
| `VITE_SLACK_WEBHOOK_URL` | (기존, 삭제 대상) | Client | 🗑 삭제 |
| `VITE_EIA_API_KEY` | (기존, 삭제 대상) | Client | 🗑 삭제 |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps JS SDK (유지) | Client | 유지 + Referrer 제한 |
| `VITE_API_URL` | Rails 백엔드 URL (유지) | Client | 변경 없음 |
| `VITE_SUPABASE_*` | Supabase 공개 키 (유지) | Client | 변경 없음 |

### 7.4 Pipeline Integration

| Phase | Status | Document Location | Command |
|-------|:------:|-------------------|---------|
| Phase 1 (Schema) | N/A | DB 변경 없음 | — |
| Phase 2 (Convention) | 부분 | CLAUDE.md에 ENV 규칙 추가 필요 | Design 단계에서 |

---

## 8. Next Steps

1. [ ] 본 Plan 리뷰 및 확정 (사용자 승인)
2. [ ] `/pdca design security-perf-hardening` — Design 문서 작성 (세부 API 스펙, 파일별 diff 계획)
3. [ ] `/pdca do security-perf-hardening` — 구현 시작 (C3 non-breaking → C1 → C2 → C3 수동 업그레이드 순)
4. [ ] `/pdca analyze security-perf-hardening` — Gap 분석
5. [ ] `/pdca report security-perf-hardening` — 완료 보고서

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-24 | 초기 드래프트 (code_analysis CRITICAL 3건 기반) | jaehong |
