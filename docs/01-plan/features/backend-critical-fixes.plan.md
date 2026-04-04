# Plan: backend-critical-fixes

> Backend 코드 분석 Critical 2건 + High 5건 수정

## 1. 수정 대상

### Critical (2건)

#### C-1. Customer 모델 SQL Injection
- **파일**: `smart-quote-api/app/models/customer.rb:10`
- **문제**: `"%#{q}%"` — `sanitize_sql_like` 미사용
- **수정**: `"%#{sanitize_sql_like(q)}%"`

#### C-2. QuoteSerializer 잘못된 키워드 인자
- **파일**: `smart-quote-api/app/services/quote_serializer.rb:71`
- **문제**: `SurchargeResolver.resolve(country_code: country)` — 실제 시그니처는 `country:`
- **수정**: `country_code:` → `country:`

### High (5건)

#### H-1. AuditLog ACTIONS 화이트리스트 불완전
- **파일**: `smart-quote-api/app/models/audit_log.rb:4-8`
- **수정**: 누락된 action 추가 (fsc, surcharge, addon_rate, customer, user)

#### H-2. require_admin! 5회 중복
- **파일**: 5개 컨트롤러
- **수정**: `jwt_authenticatable.rb` concern에 통합

#### H-3. UsersController N+1 쿼리
- **파일**: `smart-quote-api/app/controllers/api/v1/users_controller.rb`
- **수정**: `includes` 또는 `counter_cache` 적용

#### H-4. 에러 메시지 내부 정보 노출
- **파일**: `chat_controller.rb:37-39`, `fsc_controller.rb:50`
- **수정**: `e.message` → 일반화된 메시지, 상세는 로그만

#### H-5. refresh 에러 포맷 비일관
- **파일**: `auth_controller.rb:48`
- **수정**: `{ error: "string" }` → `{ error: { code:, message: } }`

## 2. 구현 순서

```
1. C-1 (SQL Injection) ← 가장 위험
2. C-2 (키워드 인자 버그)
3. H-1 (AuditLog ACTIONS)
4. H-2 (require_admin! 통합)
5. H-3 (N+1 쿼리)
6. H-4 (에러 메시지)
7. H-5 (에러 포맷)
```

---

**작성일**: 2026-03-29
