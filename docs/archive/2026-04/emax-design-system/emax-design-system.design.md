---
template: design
version: 1.2
feature: emax-design-system
date: 2026-04-25
author: jaehong
project: emax-quote-system (smart-quote-emax)
version_project: 0.0.0
---

# emax-design-system Design Document

> **Summary**: Google DESIGN.md v1 spec을 MD3 semantic token 스타일로 채택, 현 Tailwind palette(emax/accent/gray)를 semantic 역할(primary/tertiary/neutral)로 매핑하며 `@google/design.md@0.1.1` CLI alpha를 `npx`로 lint/diff 실행, CI 통합
>
> **Project**: emax-quote-system (smart-quote-emax)
> **Version**: 0.0.0
> **Author**: jaehong
> **Date**: 2026-04-25
> **Status**: Draft
> **Planning Doc**: [emax-design-system.plan.md](../../01-plan/features/emax-design-system.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- **G1**: `DESIGN.md`를 design token의 **Single Source of Truth**로 확립 (Tailwind config은 "소비자" 역할로 강등, Phase 4에서 자동 생성 목표)
- **G2**: Google spec v1 준수 — coding agent(Claude/Cursor 등)가 front matter를 mdast로 파싱 가능한 YAML 구조
- **G3**: 기존 `emax-{50..950}`, `accent-{50..950}` Tailwind 클래스 전부 그대로 동작 (비파괴)
- **G4**: `jways` palette 완전 제거 + 담당자 정보 본인(`jhlim725@gmail.com`)으로 교체 (이미 Plan 보정 단계에서 선행 완료)
- **G5**: CLI alpha(0.1.1)의 불안정성 대비 `scripts/design-check.mjs` 자체 구현 fallback 준비

### 1.2 Design Principles

- **Spec 우선**: Google DESIGN.md spec을 변경하지 않고 준수. 이 프로젝트 고유 확장은 front matter 하위가 아닌 markdown prose에 기록.
- **역할 기반 토큰**: raw palette (emax-50..950) 외에 semantic role (primary/on-primary/tertiary/neutral/surface 등)을 별도 정의 — 의도 명확화.
- **점진 도입**: Phase 1(문서 작성) → Phase 2(dead code 제거) → Phase 3(CLI + CI) → Phase 4(자동 export). 각 단계 독립 커밋, 롤백 가능.
- **두 번 쓰지 않기**: 색상 값은 DESIGN.md 한 곳에만. Tailwind config은 reference 주석으로 동기화 대상 명시.

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DESIGN.md (root)                         │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ YAML front matter                                    │  │
│   │   - colors (raw + semantic MD3-style)                │  │
│   │   - typography (display/headline/body/label variants)│  │
│   │   - rounded / spacing / motion                       │  │
│   │   - components (optional: button, card, input)       │  │
│   ├──────────────────────────────────────────────────────┤  │
│   │ Markdown prose                                       │  │
│   │   - Brand voice                                      │  │
│   │   - Color rationale (E-MAX 빨강 사유)                 │  │
│   │   - Typography usage                                 │  │
│   │   - Do / Don't 원칙                                  │  │
│   └──────────────────────────────────────────────────────┘  │
└────────┬──────────────────────────────────────┬─────────────┘
         │                                      │
         ▼ lint (Phase 3)                       ▼ diff (Phase 3)
  ┌─────────────┐                    ┌──────────────────────┐
  │ npx design. │                    │ scripts/design-diff. │
  │   md lint   │                    │   mjs                │
  └─────────────┘                    └──────────┬───────────┘
                                                │
                                                ▼
                                      ┌──────────────────┐
                                      │ tailwind.config. │
                                      │   cjs (소비자)   │
                                      └──────────────────┘
```

### 2.2 Data Flow

```
디자인 변경 필요
   │
   ▼
[개발자] DESIGN.md front matter 수정
   │
   ▼
[CI/로컬] npx design.md lint  →  Fail → 수정
   │                           ↓
   ▼                           Pass
[개발자] tailwind.config.cjs 동기화 (Phase 3) 또는 design:export로 자동 (Phase 4)
   │
   ▼
[CI/로컬] npm run design:diff →  Fail (드리프트) → 경고
   │                           ↓
   ▼                           Pass
[빌드] npm run build → dist에 동일 시각 결과
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `DESIGN.md` | — | Single source of truth |
| `@google/design.md@0.1.1` | npm registry (alpha) | lint 엔진 |
| `scripts/design-diff.mjs` | `yaml` npm package (CLI 설치 시 transitive) | DESIGN.md ↔ Tailwind 값 대조 |
| `.github/workflows/ci.yml` | Node 22 | `npx design.md lint` step 추가 |
| `tailwind.config.cjs` | DESIGN.md (참조용 주석) | 런타임 소비자, Phase 3까지는 수작업 sync |

---

## 3. Data Model

### 3.1 DESIGN.md Front Matter 스키마 (Google spec 준수)

```yaml
---
name: E-MAX Worldwide Express
colors:
  # === Raw palette (기존 Tailwind와 1:1 매칭) ===
  emax-50:  "#fef2f2"
  emax-100: "#fee2e2"
  emax-200: "#fecaca"
  emax-300: "#fca5a5"
  emax-400: "#f87171"
  emax-500: "#ef4444"   # 브랜드 핵심 빨강
  emax-600: "#dc2626"
  emax-700: "#b91c1c"
  emax-800: "#991b1b"
  emax-900: "#7f1d1d"
  emax-950: "#450a0a"
  accent-50:  "#f0f9ff"
  accent-500: "#0ea5e9"
  accent-600: "#0284c7"
  accent-900: "#0c4a6e"
  gray-50:  "#fafafa"
  gray-500: "#737373"
  gray-900: "#171717"
  gray-950: "#0a0a0a"
  # === Semantic roles (MD3 스타일) ===
  primary: "#dc2626"             # emax-600
  on-primary: "#ffffff"
  primary-container: "#fee2e2"   # emax-100
  on-primary-container: "#7f1d1d" # emax-900
  secondary: "#0284c7"           # accent-600
  on-secondary: "#ffffff"
  tertiary: "#737373"            # gray-500
  on-tertiary: "#ffffff"
  surface: "#ffffff"
  surface-container: "#fafafa"   # gray-50
  surface-container-high: "#f5f5f5"
  on-surface: "#171717"          # gray-900
  outline: "#d4d4d4"             # gray-300
  background: "#ffffff"
  error: "#b91c1c"               # emax-700
  on-error: "#ffffff"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: "700"
    lineHeight: 1.1
  headline-lg:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: "600"
    lineHeight: 1.2
  headline-md:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: "600"
    lineHeight: 1.3
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: "400"
    lineHeight: 1.6
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: "400"
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: "400"
    lineHeight: 1.5
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: "600"
    lineHeight: 1.4
    letterSpacing: 0.025em
rounded:
  none: "0"
  sm: "0.25rem"
  DEFAULT: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  "2xl": "2rem"
  full: "9999px"
spacing:
  unit: "0.25rem"
  container-padding: "1rem"
  section-gap: "2.5rem"
motion:
  duration-fast: "150ms"
  duration-normal: "250ms"
  duration-slow: "400ms"
  ease-out: "cubic-bezier(0.16, 1, 0.3, 1)"
---
```

### 3.2 Markdown Prose 구조 (최소 섹션)

1. **Brand Voice** — E-MAX Worldwide Express의 실용성/정확성/신속성
2. **Color Rationale** — 왜 빨강(`emax-600 #dc2626`), accent 하늘색 사용 이유
3. **Typography** — Inter 단일 패밀리 선택 이유 + scale 사용 가이드
4. **Spacing & Rhythm** — 8px 기반 rhythm
5. **Motion** — compositor-friendly(transform/opacity) 원칙
6. **Do / Don't** — 5개 이상의 원칙 (예: "`primary`는 CTA 1개에만", "`emax-500`은 large area 금지")

---

## 4. API Specification

신규 HTTP 엔드포인트 없음. 대신 **npm scripts**를 도입:

| Script | Command | Phase |
|--------|---------|-------|
| `design:lint` | `npx design.md lint DESIGN.md` | Phase 3 |
| `design:diff` | `node scripts/design-diff.mjs` | Phase 3 |
| `design:export` (optional) | `npx design.md export --target tailwind > tailwind.generated.cjs` | Phase 4 검토 |

### 4.1 `scripts/design-diff.mjs` 설계 (자체 구현, CLI alpha 의존 최소화)

```javascript
// scripts/design-diff.mjs
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const source = readFileSync('DESIGN.md', 'utf8');
const match = source.match(/^---\n([\s\S]*?)\n---/);
if (!match) {
  console.error('DESIGN.md front matter not found');
  process.exit(1);
}
const design = parse(match[1]);

// 동적 require로 tailwind config 로드 (CJS)
const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);
const tailwind = require(new URL('../tailwind.config.cjs', import.meta.url).pathname);
const tw = tailwind.theme.extend.colors;

const errors = [];

// emax-{50..950} 비교
for (const [key, expected] of Object.entries(design.colors)) {
  const m = key.match(/^(emax|accent|gray)-(\d+)$/);
  if (!m) continue;
  const actual = tw[m[1]]?.[m[2]];
  if (actual && actual.toLowerCase() !== expected.toLowerCase()) {
    errors.push(`${key}: DESIGN.md=${expected} vs tailwind=${actual}`);
  }
}

if (errors.length) {
  console.error('DESIGN.md ↔ tailwind.config.cjs 불일치:');
  errors.forEach(e => console.error('  ' + e));
  process.exit(1);
}
console.log('✓ DESIGN.md and tailwind.config.cjs are in sync');
```

특성:
- CLI 설치 실패해도 독립 동작 (`yaml` 패키지만 필요; CLI 설치 시 transitive로 따라옴, 아니면 별도 설치)
- 추후 Phase 4에서 `@google/design.md`의 export 기능으로 교체 가능

---

## 5. UI/UX Design

DESIGN.md 도입 자체는 **런타임 UI 변경 없음**. 다만 `jways` 팔레트 제거 시 혹시 그라디언트나 커스텀 클래스에서 `jways-500` 사용처가 남아있는지 최종 grep으로 확인 (Plan 단계에서 0건 확인됨).

---

## 6. Error Handling

| 시나리오 | 처리 |
|---------|------|
| `npx design.md lint` 실패 (alpha 버그) | CI에서 warning으로만 출력(optional), fallback으로 `scripts/design-diff.mjs`만 필수 통과 |
| `DESIGN.md` 파싱 실패 | `scripts/design-diff.mjs`가 exit 1 + stderr 메시지 |
| CLI 설치 실패 (npm registry 문제) | Phase 3에서 CLI 생략하고 `scripts/design-diff.mjs`만 도입, Phase 4 보류 |
| DESIGN.md ↔ Tailwind 값 불일치 | diff script가 모든 불일치 나열 후 exit 1 |

---

## 7. Security Considerations

- [x] `@google/design.md@0.1.1` 신규 devDep — 설치 후 `npm audit --audit-level=high` 추가 취약점 없는지 확인 (zod, remark, unified 등 well-known 패키지 기반)
- [x] CLI는 런타임 번들에 포함되지 않음 (devDep, 빌드 시만 사용)
- [x] DESIGN.md는 공개 문서 — 시크릿/키 포함 금지 (토큰만 명시)

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Lint | DESIGN.md front matter 유효성 | `npx design.md lint` |
| Diff | DESIGN.md ↔ Tailwind 일치 | `scripts/design-diff.mjs` |
| Regression | 기존 Vitest (298 tests) | Vitest |
| Build | `npm run build` 성공, 번들 시각 결과 불변 | Vite |
| Visual | 주요 페이지(Landing/Login/Dashboard/Quote) 시각 sanity | 로컬 수동 + PR Vercel preview |

### 8.2 Test Cases (Key)

- [ ] DESIGN.md front matter가 Google spec lint 통과
- [ ] DESIGN.md의 `emax-600` 값(#dc2626)이 Tailwind `theme.extend.colors.emax.600`과 동일
- [ ] `jways-500` Tailwind 클래스 grep 0 hits (사용처 + 정의)
- [ ] `npm run build` 성공, 기존 번들 청크 크기 ±1% 이내
- [ ] AccountManagerWidget 담당자 이름/이메일이 `Jaehong Lim / jhlim725@gmail.com`으로 렌더
- [ ] CI에서 `design:lint` + `design:diff` 양쪽 통과

---

## 9. Clean Architecture

### 9.1 Layer 할당

| 파일 | Layer | 역할 |
|------|-------|------|
| `DESIGN.md` | **Meta / Config** (루트) | Single source of truth |
| `tailwind.config.cjs` | Infrastructure | 소비자 (런타임 생성기) |
| `scripts/design-diff.mjs` | Tooling (build-time) | 불변성 검증 |
| `package.json` scripts | Tooling | 엔트리 포인트 |
| `.github/workflows/ci.yml` | CI/Infra | 자동 검증 |

### 9.2 의존성 방향

```
DESIGN.md  ←── (참조) ── tailwind.config.cjs
         ↑
         └── (검증) ── scripts/design-diff.mjs
                          ↑
                          └── (엔트리) ── npm scripts
                                              ↑
                                              └── (자동 실행) ── .github/workflows/ci.yml
```

---

## 10. Coding Convention

### 10.1 네이밍

- YAML keys: kebab-case (spec 준수, 예: `on-primary`, `surface-container`)
- Typography variant: `{size-class}-{scale}` (예: `headline-lg`, `body-md`)
- Script 파일: `design-*.mjs` (build tool convention)

### 10.2 Import Order (`scripts/design-diff.mjs`)

```js
import { readFileSync } from 'node:fs';  // node built-in
import { parse } from 'yaml';             // npm package
// no internal imports (build-time script)
```

### 10.3 ENV variables

추가 없음.

---

## 11. Implementation Guide

### 11.1 File Structure (변경 후)

```
/
├── DESIGN.md                              (NEW)
├── scripts/
│   └── design-diff.mjs                    (NEW)
├── tailwind.config.cjs                    (MOD — jways 제거, prose 주석 추가)
├── package.json                           (MOD — devDep + 3 scripts)
├── .github/workflows/ci.yml               (MOD — design:lint / design:diff step)
├── CLAUDE.md                              (MOD — DESIGN.md policy)
└── src/
    ├── features/quote/components/widgets/
    │   ├── AccountManagerWidget.tsx       (이미 수정됨 — 본인 정보)
    │   └── __tests__/AccountManagerWidget.test.tsx (이미 수정됨)
    └── pages/__tests__/CustomerDashboard.test.tsx (이미 수정됨 — admin@emax.co.kr)
```

### 11.2 Implementation Order

**Phase 1** — DESIGN.md + prose (안전, 런타임 영향 0)
1. [ ] 프로젝트 루트에 `DESIGN.md` 생성 (§3.1, §3.2 구조대로)
2. [ ] prose 섹션 6개 작성 (brand voice/color/typography/spacing/motion/do-don't)
3. [ ] `npm run build` + `npx vitest run` 회귀 없음 확인

**Phase 2** — jways palette 제거 (이미 이메일/테스트 정리 선행됨)
4. [ ] `tailwind.config.cjs:29-41`에서 `jways: {...}` 블록 삭제
5. [ ] 최종 grep 확인: `grep -rn "jways" src/ tailwind.config.cjs` → 0 hits
6. [ ] `npm run build` + Vitest 회귀 없음

**Phase 3** — CLI + CI
7. [ ] `npm i -D @google/design.md@0.1.1 yaml` 설치
8. [ ] `npm run design:lint` 실행해 alpha 동작 확인 (실패 시 issue 기록 후 optional 처리)
9. [ ] `scripts/design-diff.mjs` 작성 (§4.1 코드 그대로)
10. [ ] `package.json` scripts에 `design:lint`, `design:diff` 등록
11. [ ] `.github/workflows/ci.yml`에 step 추가 (lint는 `|| true`로 non-blocking 시작, diff는 hard fail)
12. [ ] `CLAUDE.md`에 DESIGN.md policy 2-3줄 추가

**Phase 4 (선택)** — Tailwind 자동 export
13. [ ] `npx design.md export` 또는 `design.md --help`로 export 기능 확인
14. [ ] 가능하면 `design:export-tailwind` 스크립트로 생성 → diff 0인지 검증
15. [ ] 불가능하면 Phase 4 보류, 이번 스프린트 종료

### 11.3 Rollback

| 문제 | 롤백 |
|------|------|
| DESIGN.md 작성 후 lint 실패 반복 | 그대로 커밋하되 CI에서 `|| true` 처리 (non-blocking) |
| jways 제거 후 빌드 실패 | `git revert` Phase 2 커밋 |
| CLI 설치가 npm audit critical 유발 | `npm uninstall @google/design.md` + fallback 스크립트만 사용 |
| Phase 4 export 결과 시각 회귀 | 수작업 sync 유지, 자동화 생략 |

---

## 12. Design-level 추가 메모

### 12.1 선행 완료 작업 (Plan 보정 단계 직전 실행)

- ✅ `AccountManagerWidget`: `Charlie Lee / ch.lee@jways.co.kr` → `Jaehong Lim (임재홍) / jhlim725@gmail.com`
- ✅ `AccountManagerWidget.test.tsx`: 3개 assertion 업데이트 (텍스트 + mailto)
- ✅ `CustomerDashboard.test.tsx`: admin fixture `admin@jways.co.kr` → `admin@emax.co.kr`
- ✅ `npx vitest run` 19/19 통과 (대상 2 파일)
- ✅ 코드에서 `jways` 문자열 grep 0 hits (tailwind.config.cjs만 남음)

### 12.2 Tailwind ↔ DESIGN.md 초기 매핑표 (참조)

| Tailwind class | DESIGN.md raw | DESIGN.md semantic |
|----------------|---------------|--------------------|
| `bg-emax-600` | `emax-600` (#dc2626) | `primary` |
| `text-white` on primary | — | `on-primary` |
| `bg-emax-50` | `emax-50` (#fef2f2) | `primary-container` |
| `bg-accent-600` | `accent-600` (#0284c7) | `secondary` |
| `text-gray-500` | `gray-500` (#737373) | `tertiary` or `on-surface-muted` |
| `border-gray-300` | `gray-300` (#d4d4d4) | `outline` |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-25 | 초기 Design — front matter 초안(MD3 semantic + raw), CLI 0.1.1 전략, scripts/design-diff.mjs 자체 구현, 4-Phase 구현 순서. 담당자/테스트 fixture 선행 정리 완료 반영 | jaehong |
