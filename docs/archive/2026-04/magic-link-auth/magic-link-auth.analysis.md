# Gap Analysis: magic-link-auth

**Feature:** Magic Link 비밀번호 없는 인증  
**Phase:** Check  
**Date:** 2026-04-09  
**Match Rate: 87%**

---

## 요약

| 카테고리 | 점수 |
|----------|------|
| Backend Controller/Logic | 100% |
| Route Configuration | 100% |
| API Specification | 95% |
| Email Template | 90% |
| Frontend Components | 90% |
| Data Model | 85% |
| Security | 90% |
| i18n Keys | 75% |
| Test Coverage | 0% ❌ |

**전체 평균: 87%** — ⚠️ 90% 미만 → iterate 필요

---

## 갭 목록

### 🔴 Critical

#### G-001: 테스트 파일 전혀 없음 (0% 커버리지)
- **Design Section 12** — 12개 이상의 테스트 케이스 명시
- 누락된 파일:
  - `spec/models/magic_link_token_spec.rb`
  - `spec/requests/api/v1/auth_magic_link_spec.rb`
  - `src/pages/MagicLinkVerifyPage.test.tsx`
- **영향:** 배포 전 필수 조건

---

### 🟡 Moderate

#### G-002: MagicLinkToken 모델 헬퍼 메서드 누락
- **Design Section 3 (Data Model)** — `expired?` 및 `used?` 인스턴스 메서드 명시
- 현재: `find_valid_token!`에서 인라인 검증만 수행
- 누락: `def expired? = expires_at < Time.current`, `def used? = used_at.present?`

#### G-003: LoginPage 구분선(divider) UI 누락
- **Design Section 7 (LoginPage)** — 비밀번호 폼과 매직 링크 버튼 사이 구분선 명시
- `t('auth.magicLink.orUseLink')` 텍스트 포함 구분선 필요
- 현재: 구분선 없이 버튼이 바로 배치됨

#### G-004: i18n 키 3개 누락
- **Design Section 9** 명시 키:
  - `auth.magicLink.orUseLink` — ko: "또는 이메일 링크로 로그인", en: "or sign in with email link"
  - `auth.magicLink.resend` — ko: "다시 보내기", en: "Send again"
  - `auth.magicLink.sending` — ko: "발송 중...", en: "Sending..."

---

### 🟢 Minor

#### G-005: 만료 토큰 정리 Job 없음
- **Design Section 10** — 만료된 토큰을 정기 삭제하는 background job 언급
- 프로덕션 필수는 아니나 DB 용량 관리 차원에서 권장

---

## 수정 계획

| 우선순위 | 항목 | 예상 작업 |
|---------|------|-----------|
| P0 | 테스트 파일 3개 추가 | 40분 |
| P1 | `expired?`/`used?` 헬퍼 추가 | 5분 |
| P1 | 누락 i18n 키 추가 (en/ko) | 5분 |
| P1 | LoginPage 구분선 UI 추가 | 10분 |
| P2 | 만료 토큰 정리 Job | 15분 |

---

## 결론

백엔드 핵심 로직과 라우팅은 100% 완성. 프론트엔드 컴포넌트도 90% 수준.  
테스트 부재가 가장 큰 갭. Moderate 항목 수정 후 재분석 시 92~95% 예상.
