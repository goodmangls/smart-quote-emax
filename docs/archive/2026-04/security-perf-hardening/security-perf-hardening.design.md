---
template: design
version: 1.2
feature: security-perf-hardening
date: 2026-04-24
author: jaehong
project: emax-quote-system (smart-quote-emax)
version_project: 0.0.0
---

# security-perf-hardening Design Document

> **Summary**: 실제 `npm run build` 측정을 반영해 범위 축소 — 폰트는 woff2 분리로 -2MB, VITE_ dead key 삭제 + Google Maps Referrer 제한, npm audit 단계적 업그레이드
>
> **Project**: emax-quote-system (smart-quote-emax)
> **Version**: 0.0.0
> **Author**: jaehong
> **Date**: 2026-04-24
> **Status**: Draft
> **Planning Doc**: [security-perf-hardening.plan.md](../../01-plan/features/security-perf-hardening.plan.md)

---

## 0. Plan 수정 사항 (Design 단계에서 확인된 사실)

Plan 단계의 일부 가정은 실제 빌드 출력을 조사한 결과 부정확했습니다. Design에서 다음과 같이 축소합니다:

### 실제 `npm run build` 청크 분석 (2026-04-24 기준)

```
dist/assets/NotoSansKR-Regular-base64-*.js   3,169 KB │ gzip: 1,055 KB  ← 별도 청크(lazy) ✓
dist/assets/index-*.js                         728 KB │ gzip:   220 KB  ← 메인
dist/assets/vendor-pdf-*.js                    357 KB │ gzip:   118 KB  ← PDF(lazy) ✓
dist/assets/QuoteCalculator-*.js               348 KB │ gzip:    59 KB  ← 페이지(lazy) ✓
dist/assets/html2canvas.esm-*.js               202 KB │ gzip:    48 KB
```

**발견**:
1. **NotoSansKR는 이미 dynamic import로 별도 청크 분리됨** (Plan이 주장한 "메인 번들 포함"은 오류). 초기 LCP에 영향 없음. 단, PDF 생성 시 3MB / 1MB gzipped 다운로드가 여전히 발생 → woff2 교체로 **~67% 감축** 가능 + 브라우저 캐시 활용.
2. **`VITE_SLACK_WEBHOOK_URL`, `VITE_EIA_API_KEY`는 소스 코드 어디에도 사용되지 않음**. Slack은 이미 `/api/v1/notifications/slack` (Rails) 프록시, EIA는 `/api/v1/jet_fuel` (Rails) 프록시. **dead `.env` 엔트리**에 불과 → 삭제만 하면 됨. 신규 Vercel serverless 작성 불필요.
3. `VITE_GOOGLE_MAPS_API_KEY`만 실제 클라이언트 키 → Referrer 제한이 유일한 대응.
4. `VITE_SENTRY_DSN`, `VITE_CHANNEL_TALK_PLUGIN_KEY`, `VITE_SUPABASE_ANON_KEY` — 공개용 키 또는 저위험, 변경 없음.

### 범위 변경

| 항목 | Plan(기존) | Design(수정) |
|------|-----------|-------------|
| **C1 폰트** | 유지 | 유지 — woff2 분리 |
| **C2 Slack 프록시** | `api/slack-notify.ts` 신규 | **취소** — 이미 Rails 프록시. `.env`에서 `VITE_SLACK_WEBHOOK_URL` 삭제만 |
| **C2 EIA 프록시** | `api/jet-fuel.ts` 신규 | **취소** — 이미 Rails `/api/v1/jet_fuel` 프록시. `.env`에서 `VITE_EIA_API_KEY` 삭제만 |
| **C2 Maps Referrer** | 유지 | 유지 |
| **C3 npm audit** | 유지 | 유지 — 단계별 수동 업그레이드 |

**영향**: Vercel serverless 신규 작성 2건 제거. 작업량 대폭 감축(~40%).

---

## 1. Overview

### 1.1 Design Goals

- **G1**: PDF 생성 시 폰트 다운로드 크기를 3.17MB → ~1MB 이하로 감축하고 브라우저 캐시를 통해 재방문 시 0KB 다운로드
- **G2**: 클라이언트 번들 및 `.env`에서 불필요한 민감 식별자를 전부 제거하여 공격면 축소
- **G3**: Google Maps 키 남용을 GCP 측 Referrer 제한으로 봉쇄
- **G4**: `npm audit` critical/high 0건 달성하면서 회귀 없음 보장

### 1.2 Design Principles

- **최소 변경(Minimal diff)**: 이미 프록시된 기능은 건드리지 않음. 죽은 코드만 제거.
- **가역성(Reversibility)**: GCP Referrer 설정·의존성 업그레이드는 각 단계마다 롤백 가능한 커밋 단위로 분리.
- **검증 우선(Verify-first)**: 각 변경 후 `npm run build` 사이즈, `grep` 시크릿 스캔, Vitest/Playwright 통과를 커밋 체크리스트에 포함.

---

## 2. Architecture

### 2.1 변경 영향 다이어그램

```
Before                                   After
───────────────────────────────────────  ───────────────────────────────────────
PDF 생성                                  PDF 생성
  └─ pdfFontLoader.loadKoreanFont()         └─ pdfFontLoader.loadKoreanFont()
       └─ dynamic import 3MB base64 TS  ─>    └─ fetch('/assets/fonts/NotoSansKR-Regular.woff2')
                                                └─ addFileToVFS(ArrayBuffer)

Maps 로드                                 Maps 로드
  └─ VITE_GOOGLE_MAPS_API_KEY (any origin)   └─ VITE_GOOGLE_MAPS_API_KEY (Referrer 제한됨)

Slack 알림  (변경 없음)                   Slack 알림
  └─ Rails POST /api/v1/notifications/slack

EIA Jet Fuel  (변경 없음)                 EIA Jet Fuel
  └─ Rails GET /api/v1/jet_fuel

.env                                      .env
  VITE_SLACK_WEBHOOK_URL=... (dead)         (삭제)
  VITE_EIA_API_KEY=... (dead)               (삭제)
```

### 2.2 Data Flow — 폰트 로딩(C1 후)

```
[초기 페이지 로드]
  └─ index.html  <link rel="preload" as="font" href="/assets/fonts/NotoSansKR-Regular.woff2" type="font/woff2" crossorigin>
  └─ @font-face { font-family: 'Noto Sans KR'; src: url('/assets/fonts/NotoSansKR-Regular.woff2'); font-display: swap; }
  └─ 화면 렌더에는 필요 시에만 사용 (한글 포함 시)

[PDF 생성 요청]
  └─ pdfFontLoader.loadKoreanFont(doc)
       ├─ 캐시 확인 (ArrayBuffer 모듈 변수)
       ├─ 없으면 fetch('/assets/fonts/NotoSansKR-Regular.woff2') → ArrayBuffer
       ├─ Uint8Array → base64 변환 (jsPDF는 base64 string 필요)
       ├─ doc.addFileToVFS('NotoSansKR-Regular.ttf', b64)
       │   ※ jsPDF VFS는 TTF만 지원 — woff2를 TTF로 사전 변환 필요 (빌드 타임)
       └─ doc.addFont(...) → setFont(...)
```

> **⚠️ 중요 설계 제약**: jsPDF의 `addFileToVFS`는 TTF만 지원하며 woff2를 직접 로드할 수 없습니다. 따라서 **웹 렌더링용 woff2**와 **PDF VFS용 TTF(서브셋)** 두 파일을 각각 제공해야 합니다.
>
> - 웹: `NotoSansKR-Regular.woff2` (자주 쓰이는 CJK 글리프 서브셋, ~400-600KB gzip)
> - PDF: `NotoSansKR-Regular.ttf` (기존 3MB base64의 원본 TTF, public/에 배치)
>
> woff2 서브셋은 `glyphhanger` 또는 `fonttools`의 pyftsubset으로 생성. 초기 구현은 **전체 TTF 단일 파일**로 진행하고, 서브셋은 추후 최적화로 분리.

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `src/lib/pdfFontLoader.ts` | `public/assets/fonts/NotoSansKR-Regular.ttf` | PDF 한글 렌더 |
| `index.html` `<head>` | `public/assets/fonts/NotoSansKR-Regular.woff2` | 웹 렌더 한글 폰트(선택) |
| `src/index.css` 또는 `globals.css` | 위 woff2 | `@font-face` 선언 |
| `.env*` | (없음) | dead 엔트리 제거 |
| GCP Console | (외부) | Maps key Referrer 제한 |

---

## 3. Data Model

본 기능은 데이터 모델 변경 없음 (폰트 로더 내부 캐시 변수만 존재).

```typescript
// src/lib/pdfFontLoader.ts (after)
let cachedTtfBase64: string | null = null;
let cachedErrorAt: number | null = null;  // 실패 후 재시도 쿨다운
const RETRY_COOLDOWN_MS = 60_000;
```

---

## 4. API Specification

### 4.1 신규 엔드포인트

**없음**. Plan에서 제안했던 `api/slack-notify.ts`, `api/jet-fuel.ts` 신규 작성은 취소 (이미 Rails 프록시 존재).

### 4.2 기존 엔드포인트 (참고)

| Method | Path | Description | 변경 여부 |
|--------|------|-------------|----------|
| POST | `/api/v1/notifications/slack` (Rails) | Slack 알림 | 변경 없음 |
| GET  | `/api/v1/jet_fuel?weeks=N` (Rails) | EIA Jet Fuel | 변경 없음 |
| GET  | `/api/fsc` (Vercel) | UPS FSC 스크래핑 | 변경 없음 |
| GET  | `/api/exchange-rate` (Vercel) | 환율 | 변경 없음 |
| GET  | `/api/logistics-news` (Vercel) | RSS | 변경 없음 |

---

## 5. UI/UX Design

본 기능은 UI 기능 변경 없음. 단, 다음 비가시성 영향 검증 필요:
- 페이지 초기 렌더 한글 텍스트에 FOUT 없음 (`font-display: swap` 정책)
- PDF 생성 버튼 클릭 시 최초 1회 fetch 지연(~500ms 허용), 로딩 스피너 유지
- 개발/로컬에서 woff2 MIME 이슈 없음 (`font/woff2`)

---

## 6. Error Handling

### 6.1 폰트 로딩 실패 처리

| 시나리오 | 처리 |
|---------|------|
| `fetch('/assets/fonts/NotoSansKR-Regular.ttf')` 4xx/5xx | `Sentry.captureException` + 영문 기본 폰트로 폴백 (Helvetica) |
| ArrayBuffer → base64 변환 실패 (OOM 등) | 동일 폴백, 1분 후 재시도 가능 |
| 반복 실패 시 | `cachedErrorAt` 기록, 쿨다운 내엔 재fetch 생략 |

### 6.2 Google Maps Referrer 차단 에러

- GCP 응답: `RefererNotAllowedMapError` (정상 신호)
- 클라이언트 처리: `ChannelTalk` 이슈와 무관, Maps 미로드 시 주소 입력 제한된 폴백 UI (현재도 동일)

### 6.3 의존성 업그레이드 중 타입 오류

- `npm audit fix`에서 major 버전 업그레이드 (예: `jspdf@4.x`) 발생 시 `npx tsc --noEmit`으로 사전 검증 후 적용. 실패 시 해당 패키지는 이번 스프린트에서 보류.

---

## 7. Security Considerations

- [x] 입력 검증: 신규 엔드포인트 없음
- [x] 인증/인가: 변경 없음 (Slack/EIA는 Rails 쪽에서 기존 정책 유지)
- [x] 민감 데이터: `.env`에서 dead VITE_ 키 삭제, 배포 후 Vercel Dashboard에서도 동일 키 제거
- [x] HTTPS: 모든 신규 fetch는 상대경로(`/assets/fonts/...`)로 동일 origin
- [x] Rate Limiting: 폰트 로더 내부 재시도 쿨다운 60초
- [x] Maps 키: GCP Console에서 HTTP Referrer 제한 (`smart-quote-emax.vercel.app/*`, `localhost:5173/*`, `localhost:4173/*`(preview)) + API 사용 가능 항목을 Maps JavaScript API / Places API로 한정

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Unit | `pdfFontLoader` 캐시/폴백 로직 | Vitest (`src/lib/__tests__/pdfFontLoader.test.ts` 신규) |
| Unit | `pdfService` PDF 생성 결과에 한글 포함 확인 | Vitest (기존 `pdfService.test.ts` 회귀) |
| Integration | Jet Fuel / Slack / Maps 정상 동작 | Vitest existing + 수동 |
| E2E | landing, login, magic-link 흐름 회귀 | Playwright (`npm run test:e2e`) |
| Bundle | 빌드 산출물 크기 확인, 시크릿 문자열 부재 | `npm run build` + `grep` 스크립트 |
| Security | `npm audit --audit-level=high` | CI/로컬 |

### 8.2 Test Cases (Key)

- [ ] `pdfFontLoader.loadKoreanFont()` 최초 호출 시 `/assets/fonts/NotoSansKR-Regular.ttf` 정확히 1회 fetch
- [ ] 2회차 호출 시 fetch 없음 (캐시 히트)
- [ ] 404 응답 시 Sentry 에러 + Helvetica 폴백 + cachedErrorAt 기록
- [ ] 쿨다운 60초 내 재호출 시 재fetch 생략
- [ ] PDF 생성 결과가 한글을 포함한 상태로 정상 렌더 (snapshot or visual check)
- [ ] `grep -r "hooks.slack.com\|api_key=" dist/` → 0 hits
- [ ] `.env.example` / Vercel env 점검 후 VITE_SLACK/VITE_EIA 없음
- [ ] `npm run build` 메인 번들 gzipped 변화 없음 (폰트 청크 1,055KB → ~600KB 이하)
- [ ] Playwright E2E 전부 통과

---

## 9. Clean Architecture

### 9.1 Layer Structure (영향 받는 곳만)

| Layer | 파일 | 변경 |
|-------|------|------|
| Presentation | `index.html` | `<link rel="preload">` + `@font-face` 추가 |
| Infrastructure | `src/lib/pdfFontLoader.ts` | 전면 재작성 |
| Infrastructure | `src/lib/pdfService.ts` | 변경 없음 (loader 인터페이스 동일) |
| Config | `public/assets/fonts/*` | 신규 파일 배치 |
| Config | `.env`, `.env.example`, `.env.production` | dead 키 제거 |
| Build | `package.json`, `package-lock.json` | 의존성 업그레이드 |
| External | GCP Console | Maps 키 제한 설정 |

### 9.2 Dependency Rules

기존 Dynamic level 구조 준수. `pdfFontLoader`는 Infrastructure로 남음. 신규 import 없음.

### 9.3 File Import Rules

변경 없음. `pdfFontLoader.ts`는 여전히 `jspdf` 타입만 import.

---

## 10. Coding Convention Reference

### 10.1 Naming

변경 없음.

### 10.2 Import Order

변경 없음.

### 10.3 Environment Variables (신규 규칙)

| Prefix | Scope | 정책 |
|--------|-------|------|
| `VITE_*` | Browser (번들 인라인됨) | **공개 가능한 키만**. Supabase Anon, Sentry DSN, Channel Talk, Google Maps (+ Referrer 제한), API URL |
| (prefix 없음) | Server/Vercel Function 전용 | 비밀키는 전부 여기. Rails 백엔드도 동일 |

→ `CLAUDE.md`에 1줄 추가: *"서버 전용 비밀키는 VITE_ prefix 금지. 클라이언트 노출 가능한 키만 VITE_*."

### 10.4 This Feature's Conventions

| Item | 적용 |
|------|------|
| Error handling | Sentry + 폴백(Helvetica) + retry cooldown |
| Dynamic asset loading | 상대경로 `/assets/` (public/ 직접 서빙) |
| Font file hygiene | PDF용 TTF는 `public/assets/fonts/`, 웹용 woff2도 동일 경로 |

---

## 11. Implementation Guide

### 11.1 파일 변경 목록 (diff 스케치)

| # | 파일 | 변경 유형 | 설명 |
|---|------|---------|------|
| F1 | `public/assets/fonts/NotoSansKR-Regular.ttf` | **신규** | 기존 base64 디코드한 원본 TTF (또는 Google Fonts에서 내려받음) |
| F2 | `public/assets/fonts/NotoSansKR-Regular.woff2` | **신규** (선택, 웹용) | subset 또는 full woff2 |
| F3 | `src/lib/pdfFontLoader.ts` | **재작성** | dynamic import → fetch TTF → base64 변환 → addFileToVFS |
| F4 | `src/lib/__tests__/pdfFontLoader.test.ts` | **신규** | 캐시/폴백/쿨다운 단위 테스트 (MSW 또는 fetch mock) |
| F5 | `src/assets/fonts/NotoSansKR-Regular-base64.ts` | **삭제** | 3MB base64 소스 제거 |
| F6 | `index.html` | 수정 | `<link rel="preload">` + 선택: `<link rel="stylesheet">` for @font-face 포함 CSS |
| F7 | `src/index.css` (또는 globals.css) | 수정 | `@font-face` 블록 추가 (웹용 woff2) |
| F8 | `.env`, `.env.local`, `.env.production` | 수정 | `VITE_SLACK_WEBHOOK_URL`, `VITE_EIA_API_KEY` 삭제 |
| F9 | `.env.example` | 수정 | 동일 키 삭제 + 주석으로 명시 |
| F10 | `CLAUDE.md` | 수정 | ENV 규칙 1줄 추가 |
| F11 | `package.json` / lock | 수정 | `npm audit fix` 결과 + 수동 업그레이드 |
| F12 | `vite.config.ts` | 변경 없음 (예상) | manualChunks 이미 OK |
| F13 | GCP Console | 외부 | Maps 키 Referrer 제한 |
| F14 | Vercel Dashboard | 외부 | VITE_SLACK/VITE_EIA 키 삭제 |

### 11.2 Implementation Order

**C3 → C1 → C2 순** (리스크 낮은 것부터, 서로 독립).

1. **C3-a (non-breaking audit)**: `npm audit fix` 실행, `npm run build` / test 통과 확인, 커밋
2. **C3-b (breaking 검토)**: `jspdf@4.x`, `@vercel/node@4.x`, `vite@6.5+` 개별 브랜치 시험 → 호환되면 적용, 아니면 README에 사유 기록 후 pending
3. **C1-a**: TTF 파일 `public/assets/fonts/`에 배치 (기존 base64 디코드 또는 Google Fonts 재다운로드)
4. **C1-b**: `pdfFontLoader.ts` 재작성 + Vitest 테스트 추가, 기존 `pdfService.test.ts` 회귀 통과
5. **C1-c**: `src/assets/fonts/NotoSansKR-Regular-base64.ts` 및 모든 참조 삭제, 빌드 사이즈 확인
6. **C1-d** (선택): woff2 웹용 폰트 추가 + `@font-face` + preload
7. **C2-a**: `.env*`에서 `VITE_SLACK_WEBHOOK_URL`, `VITE_EIA_API_KEY` 삭제, `.env.example` 갱신
8. **C2-b**: Vercel Dashboard에서 위 두 환경변수 제거 (실서비스 영향 없음 — 이미 미사용)
9. **C2-c**: GCP Console에서 Google Maps API 키 HTTP Referrer 제한 설정 (허용: `https://smart-quote-emax.vercel.app/*`, `http://localhost:5173/*`, `http://localhost:4173/*`, Vercel preview 도메인 와일드카드)
10. **C2-d**: `CLAUDE.md` ENV 규칙 1줄 추가
11. **최종 검증**: `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build`, `npm audit`, grep 시크릿 스캔, Playwright E2E
12. **PR + Vercel preview** 검수 후 메인 머지

### 11.3 롤백 계획

| 문제 | 롤백 |
|------|------|
| 폰트 교체 후 PDF 한글 깨짐 | `git revert` F3~F5 커밋, 원복 후 base64 경로 유지 |
| Maps Referrer 제한 후 지도 차단 | GCP Console에서 제한 즉시 해제 (코드 변경 없음) |
| 의존성 업그레이드로 빌드 실패 | `npm install <pkg>@<prev-version>` 재고정 |

---

## 12. 성공 기준 (DoD)

- [ ] `npm run build`: 메인 번들 gzipped 220KB 수준 유지(변화 없음), 폰트 청크 1,055KB → **600KB 이하** 또는 별도 woff2 preload 구성
- [ ] `grep -r "hooks.slack.com\|\"api_key\":\|eia.gov.*key=" dist/` → 0 hits
- [ ] `npm audit --audit-level=high` → 0건
- [ ] Vitest 1,193 + 신규 `pdfFontLoader.test.ts` 전부 통과
- [ ] Playwright E2E 4 spec 통과
- [ ] Vercel preview에서 PDF 생성·Slack 알림·Jet Fuel·Maps 로드 정상
- [ ] `.commit_message.txt` 한 줄 기록

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-24 | 초기 드래프트 — 실제 빌드 분석으로 범위 축소(Slack/EIA 프록시 취소), C1/C2/C3 구현 순서 확정 | jaehong |
