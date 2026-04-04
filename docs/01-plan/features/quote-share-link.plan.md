# Plan: quote-share-link

> 견적 공유 링크 기능 — 핵심 견적 정보를 URL로 공유

## 1. 개요

| 항목 | 내용 |
|------|------|
| Feature | quote-share-link |
| 우선순위 | High |
| 예상 영향 범위 | Frontend 4개 파일 신규/수정 |

### 배경

견적을 외부 파트너에게 공유할 때 PDF 다운로드 외에 **링크 공유** 방식이 필요.
인증 없이 핵심 정보만 표시하는 공개 페이지를 통해 빠른 공유가 가능.

## 2. 기존 구현 현황

### Backend (이미 완료)

| 구성요소 | 상태 | 파일 |
|----------|:----:|------|
| DB 마이그레이션 (share_token, share_expires_at) | ✅ | `db/migrate/20260315100001_add_share_fields_to_quotes.rb` |
| Share 생성 API (`POST /quotes/:id/share`) | ✅ | `quote_shares_controller.rb#create` |
| Share 조회 API (`GET /shared/:token`) | ✅ | `quote_shares_controller.rb#show` |
| 라우트 | ✅ | `routes.rb:65-66` |
| 토큰 만료 검증 (7일) | ✅ | `quote_shares_controller.rb:32` |

### Frontend (미구현)

| 구성요소 | 상태 |
|----------|:----:|
| Share API 클라이언트 | ❌ |
| Share 버튼 (SaveQuoteButton 옆) | ❌ |
| 공유 페이지 (`/q/:token`) | ❌ |
| App.tsx 라우트 | ❌ |

## 3. 구현 범위 (Frontend만)

### 3-1. `src/api/shareApi.ts` (신규)
- `createShareLink(quoteId: number)` → POST `/api/v1/quotes/:id/share`
- `getSharedQuote(token: string)` → GET `/api/v1/shared/:token`

### 3-2. Share 버튼 (QuoteHistoryTable 또는 QuoteDetailModal)
- 저장된 견적에 "Share Link" 버튼 추가
- 클릭 → `createShareLink()` 호출 → 클립보드에 URL 복사
- Toast: "Share link copied!"

### 3-3. `src/pages/SharedQuotePage.tsx` (신규)
- 공개 페이지 (인증 불필요)
- 핵심 정보만 표시:
  - Reference No, Date
  - Route: Origin → Destination
  - Carrier, Zone, Transit Time
  - Total Quote (USD 또는 KRW, 국가 기반)
  - Valid until
- [Download PDF] 버튼 (선택)
- 만료 시 "This link has expired" 메시지

### 3-4. `src/App.tsx` 라우트 추가
- `/q/:token` → `SharedQuotePage` (공개, ProtectedRoute 밖)

## 4. 보안

- share_token: UUID v4 기반 urlsafe_base64 (추측 불가)
- 민감 정보 미노출: 마진율, 원가, 내부 메모, 고객 정보
- 7일 자동 만료
- Rate limiting: rack_attack 일반 API throttle 적용

## 5. 구현 순서

```
1. shareApi.ts — API 클라이언트
2. SharedQuotePage.tsx — 공개 견적 페이지
3. App.tsx — /q/:token 라우트
4. QuoteDetailModal/QuoteHistoryTable — Share 버튼 추가
5. 테스트 + 검증
```

---

**작성일**: 2026-03-31
