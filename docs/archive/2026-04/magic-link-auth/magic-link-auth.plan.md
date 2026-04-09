# Plan: magic-link-auth

**Feature**: Magic Link Passwordless Email Authentication  
**Created**: 2026-04-09  
**Status**: Plan

---

## 1. 목적 (Objective)

이메일 + 비밀번호 방식에 더해 **Magic Link** 기반 Passwordless 로그인을 추가한다.  
사용자가 이메일만 입력하면 로그인 링크를 수신하고, 링크 클릭 한 번으로 인증을 완료한다.  
기존 JWT 인증 인프라(Rails + `has_secure_password`)를 최대한 재활용한다.

---

## 2. 현재 상태 (Current State)

- **인증 방식**: Rails 커스텀 JWT (`access_token` 15분 + `refresh_token` rotation)
- **Backend**: `Api::V1::AuthController` — login/register/refresh/password
- **Frontend**: `AuthContext.tsx` — JWT 저장, 자동 갱신, 세션 복원
- **이메일 인프라**: SendGrid 이미 구성됨 (`production.rb` SMTP), `ApplicationMailer` 존재
- **Passwordless 없음**: 현재 비밀번호 없이는 로그인 불가

---

## 3. 요구사항 (Requirements)

### Functional
1. 로그인 페이지에서 "이메일로 로그인 링크 받기" 옵션 제공
2. 이메일 입력 → 링크 발송 → 클릭 → 즉시 로그인 완료
3. 토큰은 **15분** 유효, 1회만 사용 가능 (일회성)
4. 만료·사용된 토큰 클릭 시 명확한 오류 메시지
5. 로그인 링크 이메일은 한국어/영어 지원
6. 기존 비밀번호 로그인은 그대로 유지 (병존)
7. 회원 미존재 이메일로 요청 시 → 보안상 동일 응답 반환 (이메일 존재 여부 노출 금지)

### Non-Functional
- 토큰은 `SecureRandom.urlsafe_base64(32)` — 256bit 충분한 엔트로피
- DB에는 토큰 원문이 아닌 **SHA256 해시** 저장 (DB 유출 시 토큰 사용 불가)
- 토큰 만료 후 자동 정리 (또는 사용 시 expired 레코드 삭제)

---

## 4. 기술 설계 요약 (Technical Summary)

### 4-1. 인증 플로우

```
[Frontend LoginPage]
  → 이메일 입력 + "링크로 로그인" 클릭
  → POST /api/v1/auth/magic_link { email }
  → 응답: { message: "Check your email" } (항상 200)

[Rails Backend]
  → User 조회 (없어도 동일 응답)
  → MagicLinkToken 생성 (raw token 생성, SHA256 저장, 15분 만료)
  → AuthMailer 발송 (링크: {FRONTEND_URL}/auth/verify?token=RAW_TOKEN)

[사용자 이메일 클릭]
  → /auth/verify?token=RAW_TOKEN 페이지 로드
  → POST /api/v1/auth/magic_link/verify { token: RAW_TOKEN }
  → Rails: SHA256(token) 조회, 만료/사용 확인
  → 성공: { token, refresh_token, user } 반환 (기존 JWT 구조 동일)
  → 실패: 401 + 오류 메시지

[Frontend /auth/verify]
  → JWT 저장 → user 설정 → /dashboard 리다이렉트
```

### 4-2. 신규 Backend 파일

| 파일 | 변경 |
|------|------|
| `db/migrate/YYYYMMDD_create_magic_link_tokens.rb` | 신규 마이그레이션 |
| `app/models/magic_link_token.rb` | 신규 모델 |
| `app/mailers/auth_mailer.rb` | 신규 Mailer (magic_link_email 메서드) |
| `app/views/auth_mailer/magic_link_email.html.erb` | 신규 이메일 템플릿 |
| `app/views/auth_mailer/magic_link_email.text.erb` | 신규 텍스트 이메일 |
| `app/controllers/api/v1/auth_controller.rb` | 2개 액션 추가 |
| `config/routes.rb` | 2개 라우트 추가 |

### 4-3. 신규 Frontend 파일

| 파일 | 변경 |
|------|------|
| `src/contexts/AuthContext.tsx` | `requestMagicLink()` 함수 추가 |
| `src/pages/LoginPage.tsx` | Magic Link 탭/섹션 추가 |
| `src/pages/MagicLinkVerifyPage.tsx` | 신규 — token 검증 + 로그인 처리 |
| `src/App.tsx` | `/auth/verify` 라우트 추가 |
| `src/i18n/translations.ts` | magic link 관련 키 추가 (en/ko/cn/ja) |

---

## 5. DB 스키마

```ruby
create_table :magic_link_tokens do |t|
  t.references :user, null: false, foreign_key: true, index: true
  t.string :token_digest, null: false  # SHA256(raw_token)
  t.datetime :expires_at, null: false
  t.datetime :used_at                  # nil = 미사용
  t.timestamps
end
add_index :magic_link_tokens, :token_digest, unique: true
```

---

## 6. 구현 순서 (Implementation Order)

1. **Backend 마이그레이션** — `MagicLinkToken` 테이블 생성
2. **Backend 모델** — `MagicLinkToken` (생성, 검증, 만료 체크)
3. **Backend Mailer** — `AuthMailer#magic_link_email` + 이메일 뷰
4. **Backend 컨트롤러** — `request_magic_link`, `verify_magic_link` 액션
5. **Backend 라우트** — 2개 라우트 추가
6. **Frontend AuthContext** — `requestMagicLink()` 추가
7. **Frontend MagicLinkVerifyPage** — token 처리 페이지
8. **Frontend LoginPage** — Magic Link UI 추가
9. **Frontend 라우트** — `/auth/verify` 등록
10. **i18n** — 번역 키 4개 언어 추가

---

## 7. 테스트 계획 (Test Plan)

### Backend (RSpec)
- `MagicLinkToken` 모델 유효성 검증
- `POST /api/v1/auth/magic_link` — 이메일 발송, 존재하지 않는 이메일 처리
- `POST /api/v1/auth/magic_link/verify` — 성공, 만료, 이미 사용된 토큰, 잘못된 토큰

### Frontend (Vitest)
- `MagicLinkVerifyPage` — 로딩/성공/실패 상태
- `AuthContext.requestMagicLink` — API 호출, 에러 처리

---

## 8. 위험 요소 (Risks)

| 위험 | 대응 |
|------|------|
| SendGrid 미설정 개발환경 | 개발: letter_opener or log delivery |
| 토큰 재사용 공격 | `used_at` 설정 후 재사용 차단 |
| 이메일 스팸/레이트리밋 | 동일 이메일 1분 내 재요청 throttle (추후 대응) |
| `password_required?` 충돌 | `has_secure_password`는 존재하므로 password 없는 유저는 없음 — 신규 유저는 magic link로만 가입 불가 (기존 유저 전용) |

---

## 9. 완료 기준 (Done Criteria)

- [ ] Magic Link 이메일 수신 확인
- [ ] 링크 클릭 → 대시보드 자동 로그인
- [ ] 만료 링크 → 오류 메시지 표시
- [ ] 이미 사용된 링크 → 오류 메시지 표시
- [ ] 기존 비밀번호 로그인 정상 동작 유지
- [ ] TypeScript 오류 0건
- [ ] 빌드 성공
