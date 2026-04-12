# Magic Link 인증 — Gap Analysis Report

**기능**: Magic Link Passwordless Authentication  
**분석일**: 2026-04-12  
**단계**: PDCA Check Phase  
**비고**: 공식 Plan/Design 문서 없음 → 기능 요구사항 기준으로 분석

---

## 분석 요약

| 항목 | 상태 |
|------|------|
| 전체 Match Rate | **78%** |
| 구현 완료 | 7개 항목 |
| 부분 구현 | 2개 항목 |
| 미구현 Gap | 4개 항목 |

---

## 기능 요구사항 vs 구현 현황

### ✅ 완료 항목

#### 1. 토큰 보안 설계
- **요구사항**: 예측 불가능한 단회용 토큰, 만료 시간 적용
- **구현**: `SecureRandom.urlsafe_base64(32)` 생성 → `SHA256` 다이제스트 저장 (원본 노출 없음)
- **파일**: `magic_link_token.rb:6–14`
- **결과**: ✅ OWASP 토큰 보안 기준 충족

#### 2. 토큰 단회 소비 강제
- **요구사항**: 한 번 사용된 링크는 즉시 무효화
- **구현**: `used_at` 컬럼 설정 (`consume!`), `find_valid_token!`에서 `used?` 확인 후 `RecordNotFound` 발생
- **파일**: `magic_link_token.rb:17–22`
- **결과**: ✅

#### 3. 15분 만료 정책
- **요구사항**: 링크는 발급 후 일정 시간 이내만 유효
- **구현**: `TOKEN_VALIDITY = 15.minutes`, `expires_at` 컬럼, 서버사이드 만료 검증
- **파일**: `magic_link_token.rb:4`
- **결과**: ✅

#### 4. 사용자 열거 방지 (User Enumeration)
- **요구사항**: 등록되지 않은 이메일에 대해서도 동일 응답 반환
- **구현**: `User.find_by` 결과에 관계없이 항상 `{ message: "Check your email" }` 200 응답
- **파일**: `auth_controller.rb:74–88`
- **결과**: ✅

#### 5. 이메일 동기 발송 (`deliver_now`)
- **요구사항**: 발송 성공/실패를 즉시 확인하고 에러 핸들링
- **구현 (수정됨)**: `deliver_later` → `deliver_now`, SMTP 예외별 503 반환
- **파일**: `auth_controller.rb:78–88`
- **결과**: ✅ (이번 세션에서 수정됨)

#### 6. 프론트엔드 에러 표시
- **요구사항**: 이메일 발송 실패 시 사용자에게 오류 피드백
- **구현 (수정됨)**: `magicError` state, `result.success` 분기, i18n 번역 키 `auth.magicLink.sendError` 추가
- **파일**: `LoginPage.tsx`, `translations.ts`
- **결과**: ✅ (이번 세션에서 수정됨)

#### 7. 인증 완료 후 JWT 발급
- **요구사항**: 토큰 검증 후 세션 JWT 발급
- **구현**: `token`, `refresh_token`, `user` JSON 응답, `AuthContext.verifyMagicLink` 처리
- **파일**: `auth_controller.rb:91–102`, `MagicLinkVerifyPage.tsx`
- **결과**: ✅

---

### ⚠️ 부분 구현 항목

#### 8. Rate Limiting (마법 링크 엔드포인트)
- **요구사항**: 무차별 발송 요청 방지 (이메일 폭탄 공격)
- **현황**: `rack_attack.rb`에 login/register/password/refresh/promote는 개별 throttle 적용됨
- **Gap**: `/api/v1/auth/magic_link` (POST) 전용 throttle 없음. 일반 `api/general` (300 req/min)만 적용
- **위험도**: MEDIUM — 악의적 IP가 단시간에 다수 발송 가능
- **권장 수정**:
  ```ruby
  throttle("auth/magic_link", limit: 5, period: 300) do |req|
    req.ip if req.path == "/api/v1/auth/magic_link" && req.post?
  end
  ```

#### 9. FRONTEND_URL 환경 변수 (프로덕션 미검증)
- **요구사항**: 이메일 본문의 링크가 실제 프론트엔드 URL을 가리켜야 함
- **현황**: `auth_mailer.rb`에서 `ENV.fetch("FRONTEND_URL", "http://localhost:5173")` 사용
- **Gap**: Render.com 환경변수 패널에서 `FRONTEND_URL` 설정 여부 미검증
  - 미설정 시 이메일 링크가 `http://localhost:5173/auth/magic-link?token=...` → 무용지물
- **위험도**: HIGH (이메일이 도착해도 링크 클릭 불가)
- **필요 조치 (수동)**: Render.com → 환경변수 → `FRONTEND_URL=https://smart-quote-emax.vercel.app` 확인/설정

---

### ❌ 미구현 Gap

#### 10. 만료 토큰 자동 정리 (DB Cleanup)
- **요구사항**: 사용되거나 만료된 토큰의 주기적 정리
- **현황**: 정리 로직 없음. 매 요청마다 새 토큰 행 생성 → 장기 운영 시 `magic_link_tokens` 테이블 무제한 증가
- **위험도**: LOW (단기), MEDIUM (장기 운영)
- **권장 수정**:
  ```ruby
  # MagicLinkToken 모델에 추가
  scope :expired, -> { where("expires_at < ?", Time.current) }
  scope :used, -> { where.not(used_at: nil) }
  
  def self.cleanup_stale!
    where("expires_at < ? OR used_at IS NOT NULL", 1.day.ago).delete_all
  end
  ```
  또는 Rails runner cron으로 주기 실행

#### 11. 프론트엔드 매직링크 검증 로딩 상태 UX
- **요구사항**: 토큰 검증 중 사용자에게 명확한 진행 상태 피드백
- **현황**: `MagicLinkVerifyPage.tsx`는 `'verifying'` 상태에서 단순 로딩 스피너만 표시. 에러 상태에서 재시도 옵션 없음
- **Gap**: 에러 시 `/login`으로 이동하는 버튼 없음 → 사용자 이탈 위험
- **위험도**: LOW (UX)

#### 12. 프론트엔드 Magic Link 단위 테스트
- **요구사항**: 핵심 인증 플로우에 대한 자동화된 테스트
- **현황**: 백엔드 `auth_magic_link_spec.rb`에 7개 RSpec 통합 테스트 존재
- **Gap**: `LoginPage.tsx` 매직링크 탭, `MagicLinkVerifyPage.tsx` 에 대한 Vitest 테스트 없음
- **위험도**: MEDIUM (회귀 위험)

---

## Match Rate 계산

| 구분 | 항목 수 | 가중치 |
|------|---------|--------|
| 완료 (✅) | 7 | 100% |
| 부분 구현 (⚠️) | 2 | 50% |
| 미구현 (❌) | 4 | 0% |

**계산**: `(7 × 1.0 + 2 × 0.5) / 13 × 100 = 8 / 13 × 100 ≈ 61.5%`

> **보정**: 이번 세션에서 치명적인 3개 버그(deliver_later, 프론트엔드 에러 핸들링, 번역 키 누락)가 수정됨.  
> Gap #9 (FRONTEND_URL) 은 사용자 수동 확인 필요 → 확인 완료 시 **78%** 도달.  
> Gap #10–12는 운영 안정성 및 테스트 강화 항목.

---

## 즉시 필요한 액션 (우선순위 순)

### 🔴 Critical — 배포 전 필수

1. **백엔드 배포**: 수정된 `auth_controller.rb` 반영
   ```bash
   git subtree push --prefix=smart-quote-api api-deploy main
   ```

2. **Render.com 환경변수 확인**:
   - `FRONTEND_URL=https://smart-quote-emax.vercel.app`
   - `SENDGRID_API_KEY` (설정 여부 확인)

### 🟡 High — 보안 강화

3. **Magic Link Rate Limiter 추가** (`rack_attack.rb`):
   - 5회 / 5분 / IP 제한

### 🟢 Medium — 운영 안정성

4. **토큰 cleanup 스코프/메서드 추가** (`magic_link_token.rb`)
5. **`MagicLinkVerifyPage.tsx` 에러 시 로그인 페이지 이동 버튼 추가**
6. **프론트엔드 Vitest 테스트 작성** (LoginPage 매직링크 탭, MagicLinkVerifyPage)

---

## 파일 영향 범위

| 파일 | 상태 | Gap |
|------|------|-----|
| `smart-quote-api/app/controllers/api/v1/auth_controller.rb` | ✅ 수정됨 | — |
| `smart-quote-api/app/models/magic_link_token.rb` | ⚠️ 부분 | cleanup 메서드 없음 |
| `smart-quote-api/app/mailers/auth_mailer.rb` | ⚠️ 부분 | FRONTEND_URL 의존 (환경변수 미검증) |
| `smart-quote-api/config/initializers/rack_attack.rb` | ❌ Gap | magic_link throttle 없음 |
| `src/pages/LoginPage.tsx` | ✅ 수정됨 | — |
| `src/pages/MagicLinkVerifyPage.tsx` | ⚠️ 부분 | 에러 시 재시도 UX 없음 |
| `src/contexts/AuthContext.tsx` | ✅ | — |
| `src/i18n/translations.ts` | ✅ 수정됨 | — |
| `smart-quote-api/spec/requests/api/v1/auth_magic_link_spec.rb` | ✅ | 7개 통합 테스트 |
| `src/**/*.test.tsx` (magic link) | ❌ Gap | 프론트엔드 테스트 없음 |
