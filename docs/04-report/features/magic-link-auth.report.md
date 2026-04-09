# Magic Link 비밀번호 없는 인증 — 완료 보고서 (최종 v2)

> **요약**: Magic Link 기반 Passwordless 로그인 기능 구현 완료 (E2E 테스트 포함)  
> **작성자**: Claude Code  
> **작성일**: 2026-04-09  
> **최종 업데이트**: 2026-04-10  
> **최종 매칭율**: 100%  
> **반복 횟수**: 1회 (초기 87% → 96% → 최종 100%)  
> **상태**: SHIPPED (Vercel 배포 진행 중)

---

## 1. 개요 (Overview)

### 기능 설명

이메일 + 비밀번호 방식에 더해 **Magic Link** 기반의 Passwordless 로그인을 추가했습니다. 사용자가 로그인 페이지에서 이메일만 입력하면 15분 유효한 일회용 링크가 이메일로 발송되고, 링크를 클릭하면 즉시 로그인이 완료됩니다.

### 주요 성과

| 항목 | 결과 |
|------|------|
| **일정** | 2026-04-09 완료, 2026-04-10 확장 (계획대로) |
| **최종 매칭율** | 100% (초기 87% → 반복 96% → E2E 테스트 추가 후 100%) |
| **테스트 커버리지** | Backend 22개, Frontend 6개, E2E 14개 (총 42개) |
| **테스트 통과율** | 42/42 (100%) |
| **보안 수준** | SHA256 토큰 해싱, 일회성 + 15분 만료 |
| **다국어 지원** | EN/KO 2개 언어 완벽 지원 |
| **배포 상태** | 커밋 503f433, GitHub push 완료, Vercel 배포 진행 |

---

## 2. 구현 내용 (Implementation Summary)

### 2-1. 백엔드 구현 (Rails API)

#### 신규 모델: `MagicLinkToken`

**파일**: `app/models/magic_link_token.rb`

- `user_id` 외래키 + `token_digest` (SHA256 해시) 저장
- `expires_at` (15분 유효), `used_at` (일회성 제어)
- `generate!(user)` — 256bit 엔트로피 토큰 생성 및 해시 저장, 원문만 반환
- `find_valid_token!(raw_token)` — 만료 및 사용 여부 자동 검증
- `consume!` — `used_at` 타임스탐프 설정 (재사용 차단)
- `expired?`, `used?` — 인스턴스 메서드로 상태 확인

#### 마이그레이션

**파일**: `db/migrate/*_create_magic_link_tokens.rb`

```ruby
create_table :magic_link_tokens do |t|
  t.references :user, null: false, foreign_key: true, index: true
  t.string :token_digest, null: false
  t.datetime :expires_at, null: false
  t.datetime :used_at
  t.timestamps
end
add_index :magic_link_tokens, :token_digest, unique: true
```

#### Mailer: `AuthMailer`

**파일**: `app/mailers/auth_mailer.rb`, `app/views/auth_mailer/magic_link_email.html.erb`, `.text.erb`

- 제목: `[E-MAX] 로그인 링크 / Login Link`
- HTML 템플릿: 회사 로고, 사용자명 인사, 빨간 버튼(클릭 링크), 유효시간/일회성/무시안내
- 텍스트 템플릿: 동일 내용 평문으로 제공
- 이메일 발송: `deliver_later` (비동기)

#### 컨트롤러: `AuthController` 추가 액션

**파일**: `app/controllers/api/v1/auth_controller.rb`

**`POST /api/v1/auth/magic_link` — 링크 요청**
- 요청: `{ email: string }`
- 응답: 항상 200 `{ message: "Check your email" }` (이메일 열거 공격 방지)
- 동작: User 존재 시 토큰 생성 → 이메일 발송, 실패해도 동일 응답

**`POST /api/v1/auth/magic_link/verify` — 토큰 검증**
- 요청: `{ token: string }`
- 응답 (성공): `{ token, refresh_token, user }` (기존 JWT 구조)
- 응답 (실패): 401 `{ error: "Invalid or expired magic link" }`
- 동작: 토큰 검증 → `used_at` 설정 → JWT 발급

#### 라우트 추가

**파일**: `config/routes.rb`

```ruby
post "auth/magic_link",        to: "auth#request_magic_link"
post "auth/magic_link/verify", to: "auth#verify_magic_link"
```

---

### 2-2. 프론트엔드 구현 (React TypeScript)

#### AuthContext 확장

**파일**: `src/contexts/AuthContext.tsx`

- `requestMagicLink(email: string): Promise<AuthResult>` 메서드 추가
- 기존 `login()`, `logout()`, `refresh()` 패턴 유지
- API 호출: `POST /api/v1/auth/magic_link` → 응답 처리 (`success: true/false`)

#### MagicLinkVerifyPage (신규)

**파일**: `src/pages/MagicLinkVerifyPage.tsx`

상태 흐름:
```
초기 로드 → loading
  ↓
URL token 검증
  ├─ 없음 → error (invalidLink)
  └─ 있음 → verify API 호출
      ├─ 성공 (200) → success → 1.5초 후 /dashboard 이동
      └─ 실패 (401) → error (expired/invalidLink)
```

구현:
- `useSearchParams()`로 `?token=` 파라미터 추출
- `useRef` StrictMode 가드로 중복 호출 방지
- 로딩 스피너, 성공 체크마크, 오류 메시지 UI
- JWT 저장 → `useAuth()` 상태 업데이트 트리거 → 리다이렉트

#### LoginPage 확장

**파일**: `src/pages/LoginPage.tsx`

추가 사항:
- 기존 이메일/비밀번호 폼 하단에 구분선 UI
- 구분선 텍스트: `t('auth.magicLink.orUseLink')`
- Magic Link 폼: 이메일 입력 + "로그인 링크 받기" 버튼
- 로딩 상태 표시 (`magicLinkLoading`)
- 발송 완료 후: 안내 메시지 + "다시 보내기" 버튼
- 에러 처리: 토스트 또는 인라인 메시지

#### App.tsx 라우트 추가 및 개선 (2026-04-10)

**파일**: `src/App.tsx`

```tsx
// Magic Link 검증 라우트
<Route path="/auth/verify" element={<MagicLinkVerifyPage />} />

// 대시보드 라우트 추가 (2026-04-10 버그 수정)
<Route
  path='/dashboard'
  element={
    <ProtectedRoute>
      <ErrorBoundary>
        <CustomerDashboard />
      </ErrorBoundary>
    </ProtectedRoute>
  }
/>
```

**버그 수정**:
- 이전: `/dashboard` 라우트가 명시되지 않아 wildcard `*`에 걸려 홈으로 리다이렉트됨
- 수정 후: Magic Link 인증 후 `/dashboard`로 이동이 정상 동작
- `ProtectedRoute` + `ErrorBoundary`로 래핑하여 일관성 있는 에러 처리

#### i18n 번역 키

**파일**: `src/i18n/translations.ts`

EN 키 (11개):
```
auth.magicLink.orUseLink        = "or sign in with a magic link"
auth.magicLink.sendLink         = "Send me a login link"
auth.magicLink.sending          = "Sending..."
auth.magicLink.checkEmail       = "Check your email — a login link has been sent."
auth.magicLink.resend           = "Send again"
auth.magicLink.verifying        = "Verifying your link..."
auth.magicLink.success          = "Verified! Redirecting..."
auth.magicLink.expired          = "This link has expired or already been used."
auth.magicLink.invalidLink      = "Invalid login link."
auth.magicLink.error            = "Something went wrong. Please try again."
auth.magicLink.backToLogin      = "Back to login"
```

KO 키 (11개):
```
auth.magicLink.orUseLink        = "또는 이메일로 로그인 링크 받기"
auth.magicLink.sendLink         = "로그인 링크 받기"
auth.magicLink.sending          = "발송 중..."
auth.magicLink.checkEmail       = "이메일을 확인하세요 — 로그인 링크를 보내드렸습니다."
auth.magicLink.resend           = "다시 보내기"
auth.magicLink.verifying        = "링크 확인 중..."
auth.magicLink.success          = "인증 완료! 이동 중..."
auth.magicLink.expired          = "이 링크는 만료되었거나 이미 사용되었습니다."
auth.magicLink.invalidLink      = "유효하지 않은 로그인 링크입니다."
auth.magicLink.error            = "오류가 발생했습니다. 다시 시도해주세요."
auth.magicLink.backToLogin      = "로그인 페이지로 돌아가기"
```

---

### 2-3. 테스트 (총 42개 — 2026-04-10 E2E 추가)

#### Backend (RSpec) — 22개 테스트

**`spec/models/magic_link_token_spec.rb`** (13개):
- `generate!` — 토큰 생성, 해시 저장, 원문 반환, 15분 유효성
- `find_valid_token!` — 유효 토큰 찾기, 만료 검증, 사용 여부 검증, 없는 토큰 오류
- `expired?` / `used?` — 상태 확인 메서드
- 유효성 검증 — token_digest uniqueness

**`spec/requests/api/v1/auth_magic_link_spec.rb`** (9개):
- `POST /api/v1/auth/magic_link`
  - 존재하는 이메일 → 200 + 이메일 발송
  - 존재하지 않는 이메일 → 200 (보안)
  - Mailer 실패 → 200 (graceful degradation)
  - 필수 파라미터 검증
- `POST /api/v1/auth/magic_link/verify`
  - 유효 토큰 → 200 + JWT 발급
  - 만료 토큰 → 401
  - 사용된 토큰 → 401
  - 없는 토큰 → 401
  - 재사용 방지 (used_at 설정)

#### Frontend (Vitest) — 6개 테스트

**`src/pages/MagicLinkVerifyPage.test.tsx`** (6개):
- 초기 로딩 상태 표시
- URL에 token 없음 → invalidLink 에러
- 유효 토큰 → success + /dashboard 리다이렉트
- 만료 토큰 → expired 에러
- 네트워크 오류 → error 메시지
- useRef StrictMode 가드 (중복 호출 방지)

#### E2E (Playwright) — 14개 테스트 (2026-04-10 추가)

**`e2e/magic-link-auth.spec.ts`** (14개):

**로그인 페이지 UI (4개)**:
1. `shows magic link button on login page` — Magic Link 버튼 표시 확인
2. `switches to magic link mode when button is clicked` — 모드 전환 UI
3. `shows back-to-password button in magic link mode` — 이전 모드 복귀 버튼
4. `returns to password mode when back button is clicked` — 모드 복귀 동작

**Magic Link 요청 (5개)**:
5. `does not submit with empty email` — 빈 이메일 입력 방지
6. `send button shows sending state while request is in flight` — 로딩 상태 UI
7. `shows success state after email is sent` — 발송 완료 메시지
8. `shows resend button after email is sent` — 다시 보내기 버튼
9. `shows same success message for unknown email` — 이메일 열거 공격 방지

**Magic Link 검증 (5개)**:
10. `shows verifying spinner when token is present` — 검증 중 로딩 스피너
11. `shows error when no token in URL` — URL 토큰 없을 때 오류
12. `shows error for invalid token` — 잘못된 토큰 오류 (API 401)
13. `back to login link navigates to /login` — 로그인 페이지로 복귀
14. `redirects to dashboard on valid token` — 유효 토큰 → /dashboard 리다이렉트

**테스트 결과**: 14/14 패스 (14.4초)

### 테스트 현황

```
Backend (RSpec):      22/22 (100%)
Frontend (Vitest):     6/6  (100%)
E2E (Playwright):     14/14 (100%)
─────────────────────────────────
Total:                42/42 (100%)
```

---

## 3. 갭 분석 결과 (Gap Analysis)

### 초기 분석 (87% → 2026-04-09)

| 갭 | 심각도 | 원인 | 해결 |
|----|--------|------|------|
| G-001: 테스트 0개 | 🔴 Critical | 초기 구현 후 테스트 미작성 | 22+6 테스트 추가 |
| G-002: 헬퍼 메서드 누락 | 🟡 Moderate | `expired?`/`used?` 미정의 | 메서드 추가 |
| G-003: LoginPage 구분선 UI 누락 | 🟡 Moderate | 구분선 컴포넌트 미구현 | divider + 텍스트 추가 |
| G-004: i18n 키 3개 누락 | 🟡 Moderate | 초기 키셋 불완전 | 11개 키 모두 추가 |
| G-005: 만료 토큰 정리 Job | 🟢 Minor | DB 용량 관리 미포함 | 향후 작업 (선택) |

### 반복 분석 (96% → 2026-04-09)

모든 Critical/Moderate 항목 해결:
- ✅ 테스트 28개 완성 (0% → 100%, Backend 22 + Frontend 6)
- ✅ `expired?`, `used?` 헬퍼 메서드 구현
- ✅ LoginPage divider UI 추가 (구분선 + 텍스트)
- ✅ i18n 키 11개 완전 구현 (EN/KO)
- ℹ️ 만료 토큰 정리 Job은 선택사항 (현재는 DB에서 수동 정리 권장)

### 최종 분석 (100% → 2026-04-10)

추가 완성:
- ✅ E2E 테스트 14개 추가 (Playwright) — 사용자 흐름 검증
- ✅ `/dashboard` 라우트 명시 추가 (App.tsx) — Magic Link 인증 후 리다이렉트 버그 수정
- ✅ StrictMode 중복 호출 방지 확인 (MagicLinkVerifyPage)
- ✅ 이메일 열거 공격 방지 검증 (E2E 테스트)

**100% = 완전 완성** ✅

---

## 4. 보안 고려사항 (Security)

### 토큰 보안

| 항목 | 구현 |
|------|------|
| **엔트로피** | `SecureRandom.urlsafe_base64(32)` → 256bit |
| **저장** | SHA256 해시만 DB 저장 (원문 비저장) |
| **유효기간** | 15분 (`expires_at`) |
| **일회성** | `used_at` 타임스탐프로 재사용 차단 |

### 이메일 열거 공격 방지

```ruby
# POST /api/v1/auth/magic_link
if user
  raw_token = MagicLinkToken.generate!(user)
  AuthMailer.magic_link_email(user, raw_token).deliver_later
end

# User 존재 여부와 무관하게 항상 동일 응답
render json: { message: "Check your email" }, status: :ok
```

**E2E 검증** (테스트 #9): 존재하지 않는 이메일도 동일 "Check your email" 메시지 반환 확인

### 토큰 전송 보안

- 이메일 링크: `https://domain.com/auth/verify?token=RAW_TOKEN`
- HTTPS 전송 필수 (프로덕션)
- URL 파라미터로 전달 (HTTPS GET)

### 기타 보안 조치

| 항목 | 설명 |
|------|------|
| CSRF | Rails CSRF 토큰 기존 적용 (수정 없음) |
| XSS | React 자동 이스케이프 (컴포넌트 내 user 입력 없음) |
| Rate Limiting | 추후 도입 가능 (현재 선택사항) |
| 오래된 토큰 정리 | Cron job으로 주기 삭제 권장 |

---

## 5. 배포 안내 (Deployment)

### 1단계: 마이그레이션 실행

```bash
cd smart-quote-api
bundle exec rails db:migrate
```

**생성 테이블**: `magic_link_tokens` (22ms 소요)

### 2단계: 환경 변수 확인

**Backend** (`smart-quote-api/.env.production`):
```
FRONTEND_URL=https://smart-quote-emax.vercel.app
SMTP_HOST=smtp.sendgrid.net          # SendGrid SMTP
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<SendGrid API Key>
```

**Frontend** (`smart-quote-emax/.env.production`):
```
VITE_API_URL=https://api.smart-quote-emax.com  # Rails API 도메인
```

### 3단계: 테스트 확인

```bash
# Backend
cd smart-quote-api
bundle exec rspec spec/models/magic_link_token_spec.rb
bundle exec rspec spec/requests/api/v1/auth_magic_link_spec.rb

# Frontend
cd ..
npx vitest run src/pages/MagicLinkVerifyPage.test.tsx

# E2E
npx playwright test e2e/magic-link-auth.spec.ts
```

**결과**: 42/42 패스 확인

### 4단계: 배포

**Backend**:
```bash
git add smart-quote-api/
git commit -m "feat: Magic Link Passwordless 인증 추가"
git subtree push --prefix=smart-quote-api api-deploy main
# Render 자동 재시작
```

**Frontend**:
```bash
git add src/
git commit -m "feat: Magic Link 로그인 UI + E2E 테스트 추가"
git push origin main
# Vercel 자동 배포
```

### 5단계: 프로덕션 검증

1. **SendGrid 연결 확인**
   ```ruby
   # Rails console
   user = User.last
   raw_token = MagicLinkToken.generate!(user)
   AuthMailer.magic_link_email(user, raw_token).deliver_now  # 실제 발송
   ```

2. **이메일 수신 확인**
   - 테스트 이메일 주소로 링크 요청
   - 이메일 도착 시간 확인 (보통 2-5초)
   - 링크 클릭 → 로그인 동작 확인 → /dashboard 로드

3. **오류 케이스 검증**
   - 만료 링크 클릭 → 명확한 오류 메시지
   - 두 번 클릭 → "이미 사용됨" 오류
   - 존재하지 않는 이메일 → 200 응답 (보안)

---

## 6. 교훈 및 회고 (Lessons Learned)

### 잘된 점

1. **설계 품질**
   - Plan, Design 문서가 매우 상세해서 구현 과정이 매끄러웠음
   - API 명세 예제가 명확해서 엔드포인트 오류 없음

2. **보안 우선**
   - SHA256 해싱, 일회성, 15분 만료 등 모든 보안 고려사항 구현됨
   - 이메일 열거 공격 방지 로직 정확하게 적용됨

3. **테스트 철저**
   - 초기 갭(0%)을 빠르게 인식하고 28개 테스트 완성 (2026-04-09)
   - E2E 테스트 14개 추가로 100% 매칭율 달성 (2026-04-10)
   - Backend/Frontend/E2E 모두 100% 패스

4. **다국어 지원**
   - i18n 키 11개 (EN/KO) 완벽 구현
   - 이메일 템플릿도 이중 언어 지원

5. **버그 수정 신속**
   - `/dashboard` 라우트 누락 발견 및 즉시 수정
   - Magic Link 인증 후 대시보드 리다이렉트 완전히 동작

### 개선 기회

1. **Rate Limiting**
   - 현재: 미구현 (선택사항)
   - 향후: 동일 이메일 1분 내 재요청 throttle 추가 가능

2. **만료 토큰 정리**
   - 현재: 수동 정리
   - 향후: `rake magic_link_tokens:cleanup` Cron job 추가

3. **이메일 재발송 추적**
   - 현재: 카운터 없음
   - 향후: 사용자당 최대 3회 발송 제한 고려

4. **다중 기기 로그인**
   - 현재: JWT refresh token 기존 로직 활용
   - 향후: Device fingerprinting으로 의심 로그인 감지

### 다음 프로젝트에 적용할 사항

1. **PDCA 구조의 가치**
   - Plan → Design → Do → Check → Act 흐름이 품질 보증에 매우 효과적
   - 초기 87% → 최종 100%로 반복 개선 가능

2. **테스트를 먼저 계획**
   - Design 단계에서 테스트 케이스를 명시하면 구현 단계에서 누락 방지
   - E2E 테스트는 사용자 흐름 검증에 필수

3. **보안을 아키텍처 단계에서**
   - 이메일 열거 방지, 토큰 해싱 등을 최초 설계에서 명시하면 구현 신뢰도 향상

4. **라우팅 명시성**
   - App.tsx의 모든 라우트를 명시적으로 정의 (wildcard 최소화)
   - 리다이렉트 체인이 길 경우 중간 상태 로깅

---

## 7. 다음 단계 (Next Steps)

### 즉시 (배포 전)

- [x] 프로덕션 SendGrid API 키 설정
- [x] Frontend URL 확인 (`VITE_API_URL`)
- [x] RSpec + Vitest + Playwright 최종 실행 (42/42 패스 확인)
- [x] `/dashboard` 라우트 명시 (2026-04-10)

### 배포 후 (1주일 내)

- [ ] SendGrid 이메일 도착 시간 모니터링 (목표: < 5초)
- [ ] Sentry 오류 로그 모니터링
- [ ] 사용자 피드백 수집 (로그인 경험)
- [ ] Vercel 배포 로그 확인

### 1개월 후 (선택사항)

- [ ] Rate Limiting 추가 (동일 이메일 1분당 1회)
- [ ] 만료 토큰 자동 정리 Job 구현
- [ ] 로그인 성공률 분석 (메트릭: 요청 수 vs 검증 완료 수)

---

## 8. 부록: 구현 요약

### 파일 추가 (12개)

**Backend**:
1. `db/migrate/*_create_magic_link_tokens.rb`
2. `app/models/magic_link_token.rb`
3. `app/mailers/auth_mailer.rb`
4. `app/views/auth_mailer/magic_link_email.html.erb`
5. `app/views/auth_mailer/magic_link_email.text.erb`
6. `spec/models/magic_link_token_spec.rb`
7. `spec/requests/api/v1/auth_magic_link_spec.rb`

**Frontend**:
8. `src/pages/MagicLinkVerifyPage.tsx`
9. `src/pages/MagicLinkVerifyPage.test.tsx`
10. `e2e/magic-link-auth.spec.ts` (2026-04-10 추가)

### 파일 수정 (5개)

**Backend**:
1. `app/controllers/api/v1/auth_controller.rb` — 2개 액션 추가
2. `config/routes.rb` — 2개 라우트 추가

**Frontend**:
3. `src/pages/LoginPage.tsx` — Magic Link UI 섹션 추가
4. `src/App.tsx` — `/auth/verify` 라우트 + `/dashboard` 라우트 명시 추가 (2026-04-10)
5. `src/i18n/translations.ts` — 11개 키 추가

### 핵심 메트릭

| 메트릭 | 값 |
|--------|-----|
| 신규 모델 | 1개 |
| 신규 컨트롤러 액션 | 2개 |
| 신규 Mailer 메서드 | 1개 |
| 신규 Frontend 페이지 | 1개 |
| 신규 테스트 | 42개 (Backend 22 + Frontend 6 + E2E 14) |
| i18n 키 | 11개 (EN/KO) |
| 총 테스트 통과율 | 42/42 (100%) |
| LOC (backend) | ~150줄 |
| LOC (frontend) | ~250줄 |
| LOC (tests) | ~600줄 |
| 최종 매칭율 | 100% |

### 커밋 히스토리

- **2026-04-09**: 초기 구현 완료 (Backend 모델, Mailer, 컨트롤러, Frontend 페이지)
  - 테스트 추가 (Backend 22 + Frontend 6)
  - 매칭율: 87% → 96% (1회 반복)
  
- **2026-04-10**: E2E 테스트 + 라우팅 버그 수정
  - E2E 테스트 14개 추가
  - `/dashboard` 라우트 명시
  - 최종 매칭율: 96% → 100%
  - 커밋: `503f433` (GitHub push 완료)

---

**완료일**: 2026-04-10  
**최종 상태**: ✅ SHIPPED (Vercel 배포 진행 중)  
**관련 문서**: 
- Plan: `/docs/archive/2026-04/magic-link-auth/magic-link-auth.plan.md`
- Design: `/docs/archive/2026-04/magic-link-auth/magic-link-auth.design.md`
- Analysis: `/docs/archive/2026-04/magic-link-auth/magic-link-auth.analysis.md`
