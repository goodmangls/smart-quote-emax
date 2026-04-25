---
template: analysis
feature: emax-design-system
date: 2026-04-25
author: jaehong (via bkit:gap-detector)
matchRate: 98
---

# emax-design-system — Gap Analysis Report

> **Summary**: Match Rate 98%. 코드 갭 0건, 허용 편차 1건(Phase 4 export 의도적 보류), 추가 수정 1건(react-dom 19.2.4→19.2.5). DESIGN.md 작성/jways 제거/CLI+CI 통합 전부 완료.
>
> **Planning**: [emax-design-system.plan.md](../01-plan/features/emax-design-system.plan.md)
> **Design**: [emax-design-system.design.md](../02-design/features/emax-design-system.design.md)

---

## 1. 종합 점수

| 카테고리 | 점수 | 상태 |
|---------|:----:|:----:|
| 코드 구현 완성도 | 100% | ✅ Phase 1~3 전부 |
| Design-Implementation 매칭 | 98% | ✅ Phase 4 의도적 보류 |
| DoD 충족도 | 100% | ✅ 9/9 모두 |
| Test 회귀 | 0건 | ✅ 33 files / 298 tests |
| **전체 Match Rate** | **98%** | ✅ ≥90% → Report 진입 가능 |

---

## 2. Phase별 구현 결과

### Phase 1 — DESIGN.md 신규 작성 ✅

- `/DESIGN.md` (158 LOC) 프로젝트 루트 생성
- YAML front matter: **56 color tokens** (raw emax/accent/gray 33 + MD3 semantic 23), 8 typography, 8 rounded, 3 spacing, 5 motion
- Prose 7개 섹션: Brand Voice, Color Rationale(표 포함), Typography, Spacing, Motion, Rounded, Do/Don't 6원칙, Governance, References
- Google DESIGN.md spec v1 준수 (`npx design.md lint` 0 errors)

### Phase 2 — jways palette 제거 ✅

- `tailwind.config.cjs` 라인 29–41 `jways: {...}` 블록 삭제
- "Tailwind = DESIGN.md consumer" 주석 추가
- `grep -rn "jways"` 결과: **0 hits** (src/ + tailwind.config.cjs + DESIGN.md 전부)

### Phase 3 — CLI + CI 통합 ✅

- devDep 설치: `@google/design.md@0.1.1`, `yaml@^2.8.3`
- `scripts/design-diff.mjs` (68 LOC): YAML 파싱 + tailwind 값 양방향 대조 + exit 1
- `package.json` scripts: `design:lint`, `design:diff`
- `.github/workflows/ci.yml` check job에 2 step 추가:
  - `npm run design:lint || true` (CLI alpha 대비 advisory)
  - `npm run design:diff` (hard fail)
- `CLAUDE.md` Configuration 블록 업데이트 (DESIGN.md = SSoT policy 명시)

### Phase 4 (선택) — Tailwind auto-export 🚫 의도적 보류

- `npx design.md export --format tailwind` 기능 **동작 확인 완료**
- 단, output이 **flat keys** (`"emax-50": "#..."`)인 반면 현재 config는 **nested** (`emax: { 50: "..." }`)
- 자동 교체 시 시각 회귀 가능성 → Design §11.2 정책("불가능하면 Phase 4 보류")에 따라 스프린트 범위에서 제외, 별도 PR로 분리

---

## 3. DoD 체크리스트

| DoD 항목 | 결과 |
|---------|------|
| DESIGN.md 존재 (front matter + prose) | ✅ |
| jways palette 제거, tailwind.config.cjs clean | ✅ |
| `npm run design:lint` 0 에러 | ✅ 0 errors / 0 warnings |
| `npm run design:diff` 0 에러 | ✅ 56 color tokens in sync |
| `npm run lint` / `type-check` / `build` 회귀 0건 | ✅ |
| Vitest 298 tests 전부 통과 | ✅ 33 files / 298 tests |
| CI에 `design:lint` step 추가 | ✅ (+ design:diff 추가) |
| `CLAUDE.md`에 DESIGN.md policy 반영 | ✅ |
| `.commit_message.txt` 기록 | ✅ |

**DoD 9/9 전부 충족.**

---

## 4. Gap 분류

### 4.1 코드 갭 — **0건** ✅

Design 섹션 11.1 파일 변경 목록, 섹션 11.2 구현 순서 전부 구현됨.

### 4.2 허용 편차 — 1건

| 항목 | 사유 | 영향 |
|-----|------|------|
| Phase 4 Tailwind auto-export | export output이 flat keys vs 현재 nested — Design §11.2 정책 "불가능하면 Phase 4 보류"에 해당 | 없음 — `design:diff` script로 수작업 sync drift 방지 가능 |

### 4.3 추가 수정 — 1건 (Plan 보정 외 돌발)

| 항목 | 원인 | 조치 |
|-----|------|------|
| `react-dom@19.2.4 → 19.2.5` | `@google/design.md`의 `ink/react` deps가 `react@19.2.5`를 hoist하면서 react-dom 버전만 뒤처짐 → 21 test files Error: "react/react-dom version mismatch" | `npm i react-dom@19.2.5` 적용, `package.json`이 `^19.2.5`로 자동 반영, 298 tests 복구 |

### 4.4 운영 갭 — **0건**

외부 작업(GCP/Vercel 등) 의존 항목 없음. CI 통합은 코드 레벨에서 완결.

---

## 5. 정량 영향

### 5.1 파일 변화

```
NEW  DESIGN.md                               (158 LOC)
NEW  scripts/design-diff.mjs                  (68 LOC)
MOD  tailwind.config.cjs                     (-13 / +5)  jways 삭제 + consumer 주석
MOD  package.json                            (+2 devDeps, +2 scripts, react-dom bump)
MOD  package-lock.json                       (lock 재생성)
MOD  .github/workflows/ci.yml                (+2 steps)
MOD  CLAUDE.md                               (+3 lines, design policy 블록)
MOD  src/features/.../AccountManagerWidget.tsx (담당자 본인 정보)
MOD  src/features/.../AccountManagerWidget.test.tsx (3 assertion)
MOD  src/pages/__tests__/CustomerDashboard.test.tsx (admin fixture)
```

### 5.2 Token 현황

| 카테고리 | DESIGN.md | Tailwind 소비 | 비고 |
|---------|----------:|-------------:|------|
| `emax-*` raw palette | 11 | 11 | 1:1 일치 |
| `accent-*` raw palette | 11 | 11 | 1:1 일치 |
| `gray-*` raw palette | 11 | 11 | 1:1 일치 |
| MD3 semantic roles | 23 | 참조용 주석 | prose 매핑 표로 안내 |
| **합계 colors** | **56** | **33** | design:diff 56 tokens verified |
| typography | 8 | 런타임 미소비(Tailwind 기본 Inter) | prose 가이드 |
| rounded / spacing / motion | 8 / 3 / 5 | Tailwind 기본 | prose 가이드 |

### 5.3 검증

| 검증 | 결과 |
|------|------|
| `npm run lint` | ✅ 0 errors |
| `npm run type-check` | ✅ 0 errors |
| `npm run build` | ✅ 6.33s 성공 |
| `npx vitest run` | ✅ 33 files / 298 tests |
| `npm run design:lint` | ✅ 0 errors / 0 warnings |
| `npm run design:diff` | ✅ 56 color tokens in sync |
| `grep -rn "jways"` | ✅ 0 hits |

---

## 6. 결론

- **Match Rate 98%** → iteration 불필요 (≥90%)
- **코드 갭 0건**, 허용 편차 1건(Design 정책 부합), 운영 갭 0건
- **돌발 이슈 1건**(react-dom mismatch) 즉시 해결, 테스트 298/298 통과
- Vercel/GCP 등 외부 작업 **없음** — 코드 레벨에서 완결된 스프린트

---

## 7. 권장 후속

1. **즉시**: `/pdca report emax-design-system` → `/pdca archive`
2. **별도 PR** (차기 스프린트):
   - Phase 4 `design.md export` 래퍼 작성 — flat → nested 변환 후 `tailwind.generated.cjs` 출력, diff=0 검증 후 교체
   - Sibling 프로젝트(ASCA, smart-quote-main) DESIGN.md 적용 — 이 사이클의 결과물을 템플릿으로 활용
3. **점진 확장**: DESIGN.md prose에 component-level spec(`SurchargeTable`, `QuoteCalculator` 레이아웃 규칙) 필요 시 추가 — 지금은 토큰 레벨만

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-25 | 초기 Gap 분석 (98%, bkit:gap-detector) |
