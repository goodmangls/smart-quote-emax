---
template: plan
version: 1.2
feature: emax-design-system
date: 2026-04-25
author: jaehong
project: emax-quote-system (smart-quote-emax)
version_project: 0.0.0
---

# emax-design-system Planning Document

> **Summary**: Google DESIGN.md spec 기반 E-MAX Worldwide Express 디자인 시스템을 단일 원본(Single Source of Truth)으로 도입. jways legacy palette 제거, `@google/design.md` CLI로 lint/diff/export 자동화
>
> **Project**: emax-quote-system (smart-quote-emax)
> **Version**: 0.0.0
> **Author**: jaehong
> **Date**: 2026-04-25
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

smart-quote-emax는 현재 `tailwind.config.cjs`에 컬러 팔레트(`gray`, `emax`, `accent`, `jways`)만 나열돼 있고, typography/spacing/motion 토큰은 없다. design 의도(왜 이 색, 왜 이 rounding)를 기록하는 문서도 없다. 또한 `jways`는 과거 브랜드 잔재 팔레트로 현재 코드에서 Tailwind 클래스 사용 0건(dead). Google DESIGN.md spec을 도입해 (1) 토큰을 기계 판독 가능 YAML로, (2) rationale을 markdown prose로 동시에 기록하고, (3) CLI(`@google/design.md`)로 검증/내보내기를 자동화한다.

### 1.2 Background

- 최근 `security-perf-hardening` 사이클(2026-04-24)에서 `jways` palette 제거가 논의만 되고 미완
- E-MAX Worldwide Express 브랜드는 적색 계열(`emax-*` Tailwind scale)이 핵심 identity
- `tailwind.config.cjs` 변경 시 의도/가이드 없이 색만 수정하면 일관성 유지 어려움
- Google이 2026년 공개한 DESIGN.md spec은 coding agents(Claude/Cursor 등)가 visual identity를 구조적으로 이해하게 하는 표준. 여기에 올라타면 이 repo뿐 아니라 BridgeLogis/ASCA 등 향후 sibling 프로젝트에도 일관된 방식을 재사용할 수 있다.

### 1.3 Related Documents

- 레퍼런스: <https://github.com/google-labs-code/design.md>
- Tailwind config: `tailwind.config.cjs`
- 상위 PDCA: `docs/archive/2026-04/security-perf-hardening/` (동일 스프린트 연장선)
- 메모리: `reference_google_design_md_spec.md`, `project_smart_quote_design_system.md`

---

## 2. Scope

### 2.1 In Scope

- [ ] `DESIGN.md` v0.1 신규 작성 (프로젝트 루트) — YAML front matter(colors/typography/spacing/rounded/motion) + Markdown prose(rationale, usage, do/don't)
- [ ] `jways` Tailwind palette 제거 (`tailwind.config.cjs:29`) — 사용처 전수조사 결과 Tailwind 클래스 사용 0건 확인됨
- [ ] `@google/design.md` CLI 설치 (`devDependencies`) + `npm scripts`:
  - `design:lint` — DESIGN.md front matter 유효성 검사
  - `design:diff` — DESIGN.md와 Tailwind config 불일치 감지
  - `design:export-tailwind` (선택) — DESIGN.md → Tailwind theme.extend 자동 생성 (Phase 4)
- [ ] `.github/workflows/ci.yml`에 `npm run design:lint` step 추가
- [ ] `CLAUDE.md`에 DESIGN.md가 단일 원본임을 명시하는 2-3줄 policy

### 2.2 Out of Scope

- `emax`, `accent`, `gray` palette 색상 값 **변경** — 현재 값 그대로 DESIGN.md로 이전만
- 다른 sibling 프로젝트(ASCA/BridgeLogis) 통합 — 이번 스프린트는 smart-quote-emax 단독
- 다크 모드 재설계 — 기존 `darkMode: 'class'` 그대로
- Typography 자산 실제 교체(Inter 유지) — 토큰만 정의
- Phase 4(export CLI로 Tailwind 자동 생성)는 선택 항목 — CLI 기능 확인 후 결정

### 2.3 Plan 보정 (2026-04-25, Design 단계 직전)

사용자 추가 지시에 따라 다음 항목을 In Scope에 편입:

- AccountManagerWidget 담당자 정보: `Charlie Lee / ch.lee@jways.co.kr` → **`Jaehong Lim (임재홍) / jhlim725@gmail.com`**
- 테스트 fixture `admin@jways.co.kr` → `admin@emax.co.kr` (현 브랜드 반영)
- 코드 내 `jways` 문자열 검색 결과 **0건** (팔레트 + 이메일 + 테스트 fixture 전부 정리됨)

→ 기존 Out of Scope 항목이었던 "jways.co.kr 이메일 도메인 데이터 유지"는 철회됨.

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 프로젝트 루트에 `DESIGN.md` 존재, Google spec v1 문법으로 유효 | High | Pending |
| FR-02 | YAML front matter에 colors(emax, accent, gray, semantic roles), typography(h1/h2/h3/body/caption), spacing scale, rounded, motion 토큰 포함 | High | Pending |
| FR-03 | Markdown prose로 브랜드 voice, 사용 가이드, do/don't 최소 5개 원칙 | High | Pending |
| FR-04 | `jways` Tailwind palette 제거, 빌드/타입/테스트 회귀 0건 | High | Pending |
| FR-05 | `@google/design.md` CLI 설치, `npm run design:lint` 통과 | High | Pending |
| FR-06 | `npm run design:diff`가 DESIGN.md ↔ tailwind.config.cjs 일치 확인 | High | Pending |
| FR-07 | GitHub Actions CI에 `design:lint` step 추가, main push 시 자동 실행 | Medium | Pending |
| FR-08 | (선택) `design:export-tailwind`로 Tailwind theme.extend 자동 생성, 결과가 현행 config와 diff 0 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Maintainability | 디자인 토큰 변경 시 `DESIGN.md` 1곳만 수정 → Tailwind 자동 반영(Phase 4) | 토큰 1건 수정 후 grep으로 사용처 확인 |
| Documentation | prose 읽는 데 5분 이내, 신규 기여자가 컬러 선택 규칙 파악 가능 | 동료 리뷰 또는 본인 재검수 |
| Build | DESIGN.md 도입으로 번들 크기 변화 0 (빌드 타임 순수 문서) | `npm run build` 전후 dist 비교 |
| Compatibility | 기존 `emax-*`, `accent-*`, `gray-*` Tailwind 클래스 전부 그대로 동작 | 빌드 성공 + 시각 회귀 없음 |
| Tooling | CLI 실행 시간 < 3초 | `time npm run design:lint` |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `DESIGN.md` 프로젝트 루트에 존재, front matter + prose 모두 충족
- [ ] `jways` palette 제거, `tailwind.config.cjs` 클린
- [ ] `npm run design:lint` 0 에러
- [ ] `npm run design:diff` 0 에러 (DESIGN.md ↔ Tailwind 일치)
- [ ] `npm run lint` / `npm run type-check` / `npm run build` / Vitest 회귀 0건
- [ ] CI에 design:lint step 추가 완료
- [ ] `CLAUDE.md`에 DESIGN.md policy 반영
- [ ] `.commit_message.txt` 기록

### 4.2 Quality Criteria

- [ ] DESIGN.md prose가 사람이 읽기 좋은 수준 (최소 80줄 이상, 단 간결)
- [ ] YAML front matter 토큰과 Tailwind config 값이 100% 일치
- [ ] CI 추가가 기존 workflow 부서지지 않음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `@google/design.md` CLI가 아직 alpha/beta라 불안정 | Medium | High | Phase 3에서 CLI 탐색 먼저, 불가 판단 시 scripts/design-lint.js 자체 구현으로 대체. 기능 퇴행 없이 Phase 1~2만 배포 가능 |
| DESIGN.md front matter ↔ Tailwind 수작업 동기화 드리프트 | Medium | Medium | Phase 4 export 자동화 + CI diff step로 조기 감지 |
| Phase 4 export 결과가 현행 Tailwind와 미묘하게 달라 시각 회귀 | High | Low | diff가 0 아니면 Phase 4 보류, 수작업 sync 유지 |
| CLI 설치 시 의존성 충돌 (npm audit 추가 취약점) | Low | Medium | 설치 후 `npm audit`으로 신규 high/critical 확인, 발생 시 Phase 3 보류 |
| jways 제거 후 숨겨진 사용처 발견 | Low | Low | 이미 grep 0건 확인했으나, Do 단계에서 `npm run build` + 시각 검수로 최종 확인 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | 선택 |
|-------|:----:|
| Starter | ☐ |
| **Dynamic** | ☑ |
| Enterprise | ☐ |

→ 기존 Dynamic 구조 유지. DESIGN.md는 루트에 배치되는 메타 문서로 layer 무관.

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 토큰 원본 위치 | `tailwind.config.cjs` / `DESIGN.md` / 별도 `tokens.json` | **DESIGN.md (front matter)** | Google spec 준수 + coding agent 친화 + prose 동행 |
| CLI 도입 | `@google/design.md` / 자체 스크립트 / 도입 안 함 | **@google/design.md 시도 → 실패 시 자체** | 공식 spec 생태계 우선, 안전 장치로 self-hosted fallback |
| Tailwind 연결 방식 | 수작업 동기화 / CLI export / AST 변환 | **Phase 1~3: 수작업 + CI diff**, **Phase 4: CLI export** | 점진 도입, 리스크 낮음 |
| jways 제거 시점 | 이번 스프린트 / 별도 PR | **이번 스프린트에 포함** | 사용자 명시 요청, dead code 확인됨 |
| CI 통합 | PR check / main push / 둘 다 | **둘 다** (기존 ci.yml 포맷 따름) | 기존 워크플로 확장 |

### 6.3 Clean Architecture Approach

```
영향 받는 위치:
┌──────────────────────────────────────────┐
/
├── DESIGN.md                    (NEW)     ← Single source of truth
├── tailwind.config.cjs          (MOD)     ← jways 제거, 나머지 유지
├── package.json                 (MOD)     ← devDep + scripts
├── .github/workflows/ci.yml     (MOD)     ← design:lint step 추가
├── CLAUDE.md                    (MOD)     ← 2-3줄 policy
└── scripts/ (선택)                        ← CLI 실패 시 fallback
```

레이어 위반/신규 디렉토리 없음.

---

## 7. Convention Prerequisites

### 7.1 Existing Conventions

- [x] `CLAUDE.md`, `.eslintrc.cjs`, `.prettierrc`, `tsconfig.json` 모두 존재
- [ ] 디자인 토큰 네이밍 convention 문서 없음 → DESIGN.md prose에서 정립

### 7.2 Conventions to Define

| Category | 현재 | 정의할 것 |
|----------|------|----------|
| 컬러 역할 이름 | palette만 있음 | `semantic.primary`, `semantic.surface`, `semantic.text`, `semantic.danger` 등 DESIGN.md에서 매핑 |
| Typography scale | 없음 | `display`, `h1`~`h4`, `body`, `caption`, `code` — rem 기반 clamp() |
| Spacing | Tailwind 기본 | 그대로 유지, DESIGN.md에 rationale만 |
| Motion | 없음 | `duration-fast/normal/slow`, `ease-out-expo` 기본값 정의 |
| Rounded | 없음 | `none/sm/md/lg/full` 기본값 정의 |

### 7.3 Environment Variables

없음 (DESIGN.md는 런타임 환경변수와 무관).

### 7.4 Pipeline Integration

| Phase | Status | 비고 |
|-------|:------:|------|
| Phase 1 (Schema) | N/A | DB 변경 없음 |
| Phase 5 (Design System) | ✅ 해당 | 이 Plan이 Phase 5에 정확히 매핑 |

---

## 8. Next Steps

1. [ ] 본 Plan 승인
2. [ ] `/pdca design emax-design-system` — Design 문서에 DESIGN.md 초안 scaffold + CLI 설치 계획 상세
3. [ ] `/pdca do emax-design-system` — 4단계 순차 구현 (Phase 1 → Phase 2 → Phase 3 → 선택 Phase 4)
4. [ ] `/pdca analyze` → report → archive

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-25 | 초기 드래프트 — Google DESIGN.md spec 기반 4-Phase 계획, jways dead code 제거 포함 | jaehong |
