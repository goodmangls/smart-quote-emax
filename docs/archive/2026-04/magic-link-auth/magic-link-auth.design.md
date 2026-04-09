# Design: magic-link-auth

**Feature**: Magic Link Passwordless Email Authentication  
**Plan**: [magic-link-auth.plan.md](../../01-plan/features/magic-link-auth.plan.md)  
**Created**: 2026-04-09  
**Status**: Design

---

## 1. 개요 (Overview)

기존 이메일+비밀번호 로그인에 더해 **Magic Link** 기반 Passwordless 로그인을 추가한다.  
Rails JWT 인증 인프라(`JwtAuthenticatable`)를 그대로 재활용하며, 기존 `AuthContext.tsx` 패턴을 확장한다.

### 핵심 제약
- **기존 유저 전용**: `has_secure_password` 사용 중 → 비밀번호 없는 신규 가입 불가
- **이메일 열거 방지**: User 존재 여부와 무관하게 항상 동일 200 응답
- **토큰 보안**: DB에 SHA256 해시만 저장, 원문 미저장
- **일회성 + 15분 만료**: `used_at` + `expires_at` 이중 검증

---

## 2. 아키텍처 (Architecture)

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
│  LoginPage.tsx                                           │
│    └─ "이메일로 로그인 링크 받기" 섹션                     │
│         └─ AuthContext.requestMagicLink(email)           │
│              └─ POST /api/v1/auth/magic_link             │
│                                                          │
│  /auth/verify?token=RAW_TOKEN                            │
│    └─ MagicLinkVerifyPage.tsx                            │
│         └─ POST /api/v1/auth/magic_link/verify           │
│              └─ AuthContext.login (기존 패턴 재사용)      │
└──────────────────────────────────────────────────────────┘
                          ↕ HTTPS
┌──────────────────────────────────────────────────────────┐
│                  Rails API Backend                        │
│  AuthController#request_magic_link                       │
│    └─ MagicLinkToken.generate!(user)                     │
│    └─ AuthMailer.magic_link_email(user, raw_token)       │
│                                                          │
│  AuthController#verify_magic_link                        │
│    └─ MagicLinkToken.find_valid_token!(raw_token)        │
│    └─ token.consume!                                     │
│    └─ encode_token(user) + encode_refresh_token(user)    │
└──────────────────────────────────────────────────────────┘
                          ↕
┌──────────────────────────────────────────────────────────┐
│  PostgreSQL                                              │
│  magic_link_tokens table                                 │
└──────────────────────────────────────────────────────────┘
                          ↕
┌──────────────────────────────────────────────────────────┐
│  SendGrid (SMTP)                                         │
│  AuthMailer → magic_link_email.html.erb                  │
└──────────────────────────────────────────────────────────┘
```

---

## 3. 데이터 모델 (Data Model)

### 3-1. DB 마이그레이션

```ruby
# db/migrate/YYYYMMDD_create_magic_link_tokens.rb
class CreateMagicLinkTokens < ActiveRecord::Migration[8.0]
  def change
    create_table :magic_link_tokens do |t|
      t.references :user, null: false, foreign_key: true, index: true
      t.string     :token_digest, null: false   # SHA256(raw_token)
      t.datetime   :expires_at,   null: false
      t.datetime   :used_at                     # nil = 미사용

      t.timestamps
    end

    add_index :magic_link_tokens, :token_digest, unique: true
  end
end
```

### 3-2. Rails 모델: `MagicLinkToken`

```ruby
# app/models/magic_link_token.rb
class MagicLinkToken < ApplicationRecord
  belongs_to :user

  TOKEN_VALIDITY = 15.minutes

  validates :token_digest, presence: true, uniqueness: true
  validates :expires_at,   presence: true

  # 토큰 생성 — raw 반환, DB에는 SHA256 저장
  def self.generate!(user)
    raw_token  = SecureRandom.urlsafe_base64(32)
    digest     = Digest::SHA256.hexdigest(raw_token)

    create!(
      user:         user,
      token_digest: digest,
      expires_at:   TOKEN_VALIDITY.from_now
    )

    raw_token
  end

  # 유효한 토큰 검색 — 만료·사용 여부 검증
  def self.find_valid_token!(raw_token)
    digest = Digest::SHA256.hexdigest(raw_token)
    token  = find_by!(token_digest: digest)

    raise ActiveRecord::RecordNotFound if token.used_at.present?
    raise ActiveRecord::RecordNotFound if token.expires_at < Time.current

    token
  rescue ActiveRecord::RecordNotFound
    raise
  end

  # 토큰 소비 — used_at 설정
  def consume!
    touch(:used_at)
  end

  def expired?
    expires_at < Time.current
  end

  def used?
    used_at.present?
  end
end
```

### 3-3. TypeScript 타입 (Frontend)

```typescript
// src/types.ts 에 추가
export interface MagicLinkRequestResult {
  success: boolean;
  message?: string;
  error?: string;
}
```

---

## 4. API 명세 (API Specification)

### 4-1. `POST /api/v1/auth/magic_link`

**목적**: Magic Link 이메일 발송 요청

**Request**
```json
{
  "email": "user@example.com"
}
```

**Response (항상 200)**
```json
{
  "message": "Check your email"
}
```

> 보안 주의: User 존재 여부와 무관하게 동일 응답 반환 (이메일 열거 방지)

**에러 없음** — 이메일 발송 실패 시도 동일 200 응답 (로그만 기록)

---

### 4-2. `POST /api/v1/auth/magic_link/verify`

**목적**: Magic Link 토큰 검증 및 JWT 발급

**Request**
```json
{
  "token": "RAW_TOKEN_FROM_EMAIL"
}
```

**Response (200 성공)**
```json
{
  "token": "JWT_ACCESS_TOKEN",
  "refresh_token": "JWT_REFRESH_TOKEN",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "홍길동",
    "role": "member"
  }
}
```

**Response (401 실패)**
```json
{
  "error": "Invalid or expired magic link"
}
```

---

## 5. 컨트롤러 설계 (Controller Design)

```ruby
# app/controllers/api/v1/auth_controller.rb 에 추가

# POST /api/v1/auth/magic_link
def request_magic_link
  user = User.find_by(email: params[:email])

  # User 존재 시에만 토큰 생성 + 이메일 발송 (응답은 동일)
  if user
    raw_token = MagicLinkToken.generate!(user)
    AuthMailer.magic_link_email(user, raw_token).deliver_later
  end

  render json: { message: "Check your email" }, status: :ok
rescue => e
  Rails.logger.error "MagicLink request error: #{e.message}"
  render json: { message: "Check your email" }, status: :ok
end

# POST /api/v1/auth/magic_link/verify
def verify_magic_link
  token = MagicLinkToken.find_valid_token!(params[:token])
  user  = token.user

  token.consume!

  render json: {
    token:         encode_token(user),
    refresh_token: encode_refresh_token(user),
    user:          { id: user.id, email: user.email, name: user.name, role: user.role }
  }, status: :ok
rescue ActiveRecord::RecordNotFound
  render json: { error: "Invalid or expired magic link" }, status: :unauthorized
end
```

---

## 6. 라우트 (Routes)

```ruby
# config/routes.rb — 기존 auth 라우트에 추가
namespace :api do
  namespace :v1 do
    # 기존 라우트 ...
    post "auth/magic_link",        to: "auth#request_magic_link"
    post "auth/magic_link/verify", to: "auth#verify_magic_link"
  end
end
```

---

## 7. Mailer 설계

### 7-1. `AuthMailer`

```ruby
# app/mailers/auth_mailer.rb
class AuthMailer < ApplicationMailer
  def magic_link_email(user, raw_token)
    @user       = user
    @magic_url  = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:5173')}/auth/verify?token=#{raw_token}"
    @expires_in = "15분 (15 minutes)"

    mail(
      to:      user.email,
      subject: "[E-MAX] 로그인 링크 / Login Link"
    )
  end
end
```

### 7-2. HTML 이메일 템플릿

```erb
<%# app/views/auth_mailer/magic_link_email.html.erb %>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; }
    .container { max-width: 480px; margin: 40px auto; padding: 32px; }
    .btn {
      display: inline-block;
      background: #dc2626;
      color: white !important;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
    }
    .notice { font-size: 13px; color: #666; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>E-MAX Worldwide Express</h2>
    <p>안녕하세요, <strong><%= @user.name %></strong>님.</p>
    <p>아래 버튼을 클릭하면 즉시 로그인됩니다.<br>
       Click the button below to sign in instantly.</p>

    <%= link_to "로그인 / Sign In", @magic_url, class: "btn" %>

    <div class="notice">
      <p>⏱ 이 링크는 <strong><%= @expires_in %></strong> 동안 유효합니다.<br>
         This link is valid for <strong><%= @expires_in %></strong>.</p>
      <p>🔒 링크는 1회만 사용할 수 있습니다.<br>
         This link can only be used once.</p>
      <p>본인이 요청하지 않았다면 이 이메일을 무시하세요.<br>
         If you didn't request this, please ignore this email.</p>
    </div>
  </div>
</body>
</html>
```

### 7-3. 텍스트 이메일 템플릿

```erb
<%# app/views/auth_mailer/magic_link_email.text.erb %>
E-MAX Worldwide Express — 로그인 링크 / Login Link
=====================================================

안녕하세요, <%= @user.name %>님.
Hello, <%= @user.name %>.

아래 링크를 클릭하면 즉시 로그인됩니다.
Click the link below to sign in instantly.

<%= @magic_url %>

⏱ 유효 시간: <%= @expires_in %>
🔒 1회만 사용 가능 / One-time use only

본인이 요청하지 않았다면 이 이메일을 무시하세요.
If you didn't request this, please ignore this email.
```

---

## 8. Frontend 설계

### 8-1. `AuthContext.tsx` 확장

**추가할 인터페이스 변경**:
```typescript
// 기존 AuthContextType에 추가
interface AuthContextType {
  // ... 기존 필드 ...
  requestMagicLink: (email: string) => Promise<AuthResult>;
}
```

**구현 추가**:
```typescript
const requestMagicLink = async (email: string): Promise<AuthResult> => {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/magic_link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      return { success: false, error: 'Failed to send magic link' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
};
```

### 8-2. `MagicLinkVerifyPage.tsx` (신규)

**경로**: `src/pages/MagicLinkVerifyPage.tsx`

**상태 흐름**:
```
loading → (성공) → success → /dashboard 리다이렉트
        → (실패) → error   → 오류 메시지 + /login 링크
```

**구현**:
```typescript
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type VerifyState = 'loading' | 'success' | 'error';

export default function MagicLinkVerifyPage() {
  const [state, setState] = useState<VerifyState>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setState('error');
      setErrorMsg(t('auth.magicLink.invalidLink'));
      return;
    }

    const verify = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/api/v1/auth/magic_link/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const data = await res.json();
          setState('error');
          setErrorMsg(data.error || t('auth.magicLink.expired'));
          return;
        }

        const data = await res.json();
        // 기존 AuthContext의 login 성공 패턴과 동일하게 처리
        localStorage.setItem('access_token', data.token);
        localStorage.setItem('refresh_token', data.refresh_token);
        // AuthContext 상태 업데이트를 위해 페이지 이동 (앱 리마운트)
        setState('success');
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      } catch {
        setState('error');
        setErrorMsg(t('auth.magicLink.error'));
      }
    };

    verify();
  }, [searchParams, navigate, t]);

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-emax-red border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">{t('auth.magicLink.verifying')}</p>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-lg font-medium">{t('auth.magicLink.success')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-lg font-medium text-red-600 mb-4">{errorMsg}</p>
        <a href="/login" className="text-emax-red underline">
          {t('auth.magicLink.backToLogin')}
        </a>
      </div>
    </div>
  );
}
```

### 8-3. `LoginPage.tsx` UI 추가

**기존 이메일/비밀번호 폼 하단**에 구분선과 Magic Link 섹션 추가:

```tsx
{/* Magic Link 섹션 */}
<div className="mt-6">
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200 dark:border-gray-700" />
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="bg-white dark:bg-gray-900 px-3 text-gray-500">
        {t('auth.magicLink.orUseLink')}
      </span>
    </div>
  </div>

  {/* Magic Link 폼 */}
  {!magicLinkSent ? (
    <form onSubmit={handleMagicLinkSubmit} className="mt-4 space-y-3">
      <input
        type="email"
        value={magicEmail}
        onChange={(e) => setMagicEmail(e.target.value)}
        placeholder={t('auth.email')}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg ..."
        required
      />
      <button
        type="submit"
        disabled={magicLinkLoading}
        className="w-full py-2.5 border border-emax-red text-emax-red rounded-lg hover:bg-red-50 ..."
      >
        {magicLinkLoading ? t('auth.magicLink.sending') : t('auth.magicLink.sendLink')}
      </button>
    </form>
  ) : (
    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
      <p className="text-green-700 dark:text-green-400 text-sm">
        {t('auth.magicLink.checkEmail')}
      </p>
      <button
        onClick={() => { setMagicLinkSent(false); setMagicEmail(''); }}
        className="mt-2 text-sm text-gray-500 underline"
      >
        {t('auth.magicLink.resend')}
      </button>
    </div>
  )}
</div>
```

**LoginPage state 추가**:
```typescript
const [magicEmail, setMagicEmail] = useState('');
const [magicLinkLoading, setMagicLinkLoading] = useState(false);
const [magicLinkSent, setMagicLinkSent] = useState(false);

const handleMagicLinkSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setMagicLinkLoading(true);
  await requestMagicLink(magicEmail);
  setMagicLinkSent(true);
  setMagicLinkLoading(false);
};
```

### 8-4. `App.tsx` 라우트 추가

```typescript
import MagicLinkVerifyPage from '@/pages/MagicLinkVerifyPage';

// 기존 라우트에 추가 (public — 인증 불필요)
<Route path="/auth/verify" element={<MagicLinkVerifyPage />} />
```

---

## 9. i18n 번역 키 (en/ko)

> ⚠️ 실제 코드베이스의 `Language = 'en' | 'ko'` 기준 (cn/ja 없음)

```typescript
// src/i18n/translations.ts — auth 섹션에 추가

// 영어 (en)
auth: {
  // ... 기존 키 ...
  magicLink: {
    orUseLink:    'or sign in with a magic link',
    sendLink:     'Send me a login link',
    sending:      'Sending...',
    checkEmail:   'Check your email — a login link has been sent.',
    resend:       'Send again',
    verifying:    'Verifying your link...',
    success:      'Verified! Redirecting...',
    expired:      'This link has expired or already been used.',
    invalidLink:  'Invalid login link.',
    error:        'Something went wrong. Please try again.',
    backToLogin:  'Back to login',
  }
}

// 한국어 (ko)
auth: {
  // ... 기존 키 ...
  magicLink: {
    orUseLink:    '또는 이메일로 로그인 링크 받기',
    sendLink:     '로그인 링크 받기',
    sending:      '발송 중...',
    checkEmail:   '이메일을 확인하세요 — 로그인 링크를 보내드렸습니다.',
    resend:       '다시 보내기',
    verifying:    '링크 확인 중...',
    success:      '인증 완료! 이동 중...',
    expired:      '이 링크는 만료되었거나 이미 사용되었습니다.',
    invalidLink:  '유효하지 않은 로그인 링크입니다.',
    error:        '오류가 발생했습니다. 다시 시도해주세요.',
    backToLogin:  '로그인 페이지로 돌아가기',
  }
}
```

---

## 10. 오류 처리 (Error Handling)

| 상황 | 백엔드 응답 | 프론트엔드 처리 |
|------|------------|----------------|
| 이메일 존재하지 않음 | 200 `{ message: "Check your email" }` | 정상 처리 (보안) |
| 이메일 발송 실패 | 200 (로그만 기록) | 정상 처리 |
| 토큰 만료 | 401 `{ error: "..." }` | `expired` 메시지 표시 |
| 토큰 이미 사용됨 | 401 `{ error: "..." }` | `expired` 메시지 표시 |
| 토큰 없음/잘못됨 | 401 `{ error: "..." }` | `invalidLink` 메시지 표시 |
| URL에 token 파라미터 없음 | — | 즉시 `invalidLink` 표시 |
| 네트워크 오류 | — | `error` 메시지 표시 |

---

## 11. 보안 설계 (Security Design)

| 항목 | 구현 |
|------|------|
| 토큰 엔트로피 | `SecureRandom.urlsafe_base64(32)` → 256bit |
| DB 저장 방식 | SHA256 해시만 저장 (`token_digest`) |
| 유효기간 | 15분 (`expires_at`) |
| 일회성 | `used_at` 설정 후 재사용 차단 |
| 이메일 열거 방지 | User 존재 여부와 무관하게 동일 200 응답 |
| 토큰 전송 | HTTPS URL 파라미터 (이메일 전송) |
| 오래된 토큰 정리 | `MagicLinkToken.where("expires_at < ?", Time.current)` — 주기적 cleanup 권장 |

---

## 12. 테스트 계획 (Test Plan)

### 12-1. Backend (RSpec)

```ruby
# spec/models/magic_link_token_spec.rb
describe MagicLinkToken do
  describe '.generate!' do
    it 'returns a raw token string'
    it 'stores SHA256 digest in DB'
    it 'sets expires_at to 15 minutes from now'
    it 'leaves used_at nil'
  end

  describe '.find_valid_token!' do
    it 'finds token by SHA256 digest'
    it 'raises RecordNotFound for expired token'
    it 'raises RecordNotFound for used token'
    it 'raises RecordNotFound for unknown token'
  end

  describe '#consume!' do
    it 'sets used_at to current time'
  end
end

# spec/requests/api/v1/auth_magic_link_spec.rb
describe 'POST /api/v1/auth/magic_link' do
  it 'returns 200 for existing email and sends email'
  it 'returns 200 for non-existing email (no email sent)'
  it 'returns 200 on mailer error (graceful degradation)'
end

describe 'POST /api/v1/auth/magic_link/verify' do
  it 'returns JWT tokens for valid token'
  it 'returns 401 for expired token'
  it 'returns 401 for already-used token'
  it 'returns 401 for unknown token'
  it 'marks token as used after successful verify'
end
```

### 12-2. Frontend (Vitest)

```typescript
// src/pages/MagicLinkVerifyPage.test.tsx
describe('MagicLinkVerifyPage', () => {
  it('shows loading state initially')
  it('redirects to /dashboard on success')
  it('shows error message on 401')
  it('shows invalidLink when no token in URL')
})

// src/contexts/AuthContext.test.tsx (기존 파일에 추가)
describe('requestMagicLink', () => {
  it('calls POST /api/v1/auth/magic_link with email')
  it('returns success: true on 200')
  it('returns success: false on network error')
})
```

---

## 13. 구현 순서 (Implementation Order)

| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | DB 마이그레이션 생성 | `db/migrate/YYYYMMDD_create_magic_link_tokens.rb` |
| 2 | MagicLinkToken 모델 | `app/models/magic_link_token.rb` |
| 3 | AuthMailer + 이메일 뷰 | `app/mailers/auth_mailer.rb`, `views/auth_mailer/*.erb` |
| 4 | AuthController 액션 추가 | `app/controllers/api/v1/auth_controller.rb` |
| 5 | 라우트 추가 | `config/routes.rb` |
| 6 | AuthContext 확장 | `src/contexts/AuthContext.tsx` |
| 7 | MagicLinkVerifyPage 생성 | `src/pages/MagicLinkVerifyPage.tsx` |
| 8 | LoginPage UI 추가 | `src/pages/LoginPage.tsx` |
| 9 | App.tsx 라우트 등록 | `src/App.tsx` |
| 10 | i18n 번역 키 추가 | `src/i18n/translations.ts` |

---

## 14. 완료 기준 (Done Criteria)

- [ ] Magic Link 이메일 수신 확인
- [ ] 링크 클릭 → `/dashboard` 자동 로그인
- [ ] 만료 링크 클릭 → 명확한 오류 메시지
- [ ] 이미 사용된 링크 클릭 → 명확한 오류 메시지
- [ ] 기존 이메일+비밀번호 로그인 정상 동작 유지
- [ ] TypeScript 오류 0건 (`npx tsc --noEmit`)
- [ ] ESLint 경고 0건 (`npm run lint`)
- [ ] RSpec 테스트 통과
- [ ] Vitest 테스트 통과
