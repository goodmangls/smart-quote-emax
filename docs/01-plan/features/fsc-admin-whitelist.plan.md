# Plan: fsc-admin-whitelist

> 백엔드 FSC 화이트리스트·시드·fallback에서 FEDEX/OCS 누락 정리 (pre-existing drift)

## 1. 개요

| 항목 | 내용 |
|------|------|
| Feature | fsc-admin-whitelist |
| 우선순위 | Medium (관리자 기능 정상화, 사용자 견적 계산에는 영향 없음) |
| 예상 영향 범위 | Backend 4개 파일 |
| 의존성 | OCS carrier 통합(245626e + 본 세션) 완료 후 |

### 배경

OCS carrier가 추가됐고(`245626e` + 본 세션의 OCS 통합), FscRateWidget UI도 4개 carrier(UPS/DHL/FEDEX/OCS)를 표시하지만, 백엔드 FSC 관리 인프라는 여전히 **UPS/DHL 2개만 인지**하는 상태로 남아 있음. 이는 OCS 추가 누락이 아니라 FedEx 추가(`c91d4cd`) 시점부터 누적된 **pre-existing drift**.

현재 상태에서 Admin이 FscRateWidget에서 FEDEX/OCS rate 업데이트 시도하면 `INVALID_CARRIER` 에러로 거부됨. 견적 계산 자체에는 영향 없음(계산은 `Constants::Rates::DEFAULT_FSC_PERCENT_*` 상수 사용).

## 2. 누락 지점 4개 (모두 backend)

| # | 파일 | 라인 | 현 상태 | 영향 |
|---|------|------|---------|------|
| 1 | `app/models/fsc_rate.rb:2` | inclusion validation `%w[UPS DHL]` | FEDEX/OCS row 생성 시 ActiveRecord ValidationError | DB write 차단 |
| 2 | `app/models/fsc_rate.rb:7-12` | `ensure_defaults!` UPS=38.5/36.5, DHL=30.5/28.5만 seed | FEDEX/OCS 첫 조회 시 row 부재 | 표시 누락 가능 |
| 3 | `app/controllers/api/v1/fsc_controller.rb:27` | `unless %w[UPS DHL].include?(carrier)` | FEDEX/OCS update 시도 → `INVALID_CARRIER` | Admin 기능 차단 |
| 4 | `app/services/fsc_fetcher.rb:3-6` | `DEFAULT_RATES` UPS/DHL만 정의 | DB read 실패 시 FEDEX/OCS fallback 부재 | DR 시나리오에서 누락 |

### 추가 발견 (정렬 필요)

`FscRate.ensure_defaults!`의 하드코딩 시드값:
- UPS: `38.5/36.5` (현재 `Constants::Rates::DEFAULT_FSC_PERCENT = 45.5`)
- DHL: `30.5/28.5` (현재 `Constants::Rates::DEFAULT_FSC_PERCENT_DHL = 48.0`)

→ 이미 stale. 본 사이클에서 같이 정렬.

`FscFetcher::DEFAULT_RATES` 하드코딩값도 동일 stale (UPS=38.5/36.5, DHL=30.5/28.5). 같이 정렬.

## 3. 결정 사항 (확정 — 2026-04-30)

| Q | 결정 | 근거 |
|---|------|------|
| Q1. seed/fallback 값 source | **상수 참조** (`Constants::Rates::DEFAULT_FSC_PERCENT*`) | 단일 source. 이후 FSC 정책 변경 시 `rates.rb`만 수정 |
| Q2. FEDEX/OCS domestic 값 | **international = domestic** | Frontend `FscRateWidget` 기본값 패턴과 일치. UPS/DHL도 실운영 동일값 |
| Q3. 기존 production DB | **`ensure_defaults!` 보강** (carrier별 idempotent) | 기존 UPS/DHL row 보존. 첫 조회 시 누락 carrier만 자동 생성. data migration 불필요 |

## 4. 구현 범위

```
Backend only:
- app/models/fsc_rate.rb           : inclusion 화이트리스트 + ensure_defaults! 4-carrier 시드
- app/controllers/api/v1/fsc_controller.rb : update_rates 화이트리스트
- app/services/fsc_fetcher.rb      : DEFAULT_RATES 보강
- spec/                            : 모델·컨트롤러·서비스 테스트 추가/갱신

Frontend: 변경 없음 (이미 4-carrier 지원)
DB Migration: 변경 없음 (DB 제약 없음, 모델 validation만 사용)
```

## 5. 구현 순서

```
1. fsc_rate.rb         — inclusion에 FEDEX/OCS 추가 + ensure_defaults! 4-carrier
2. fsc_controller.rb   — update_rates 화이트리스트 4-carrier
3. fsc_fetcher.rb      — DEFAULT_RATES 4-carrier
4. RSpec spec 갱신/추가 (있는 경우)
5. 검증: rubocop + RSpec (가능한 환경)
6. .commit_message.txt 갱신
```

## 6. 비-목표 (out of scope)

- Frontend 변경: 이미 OCS 통합 commit에서 처리됨
- DB 마이그레이션: 현재 스키마는 carrier에 check 제약 없음 (string + unique index)
- carrier 자체 추가: 본 사이클은 화이트리스트 정렬만, 신규 carrier 도입 별도

## 7. 검증 기준 (Acceptance)

- [ ] `FscRate.create!(carrier: "FEDEX", international: 43.5, domestic: 43.5)` 성공
- [ ] `FscRate.create!(carrier: "OCS", international: 10.0, domestic: 10.0)` 성공
- [ ] `FscRate.create!(carrier: "INVALID")` 여전히 실패
- [ ] `POST /api/v1/fsc/update {carrier: "FEDEX", ...}` 200 응답
- [ ] `POST /api/v1/fsc/update {carrier: "INVALID", ...}` 422 응답
- [ ] `FscFetcher.current_rates`가 DB 실패 시 4-carrier fallback 반환
- [ ] 견적 계산 회귀 없음 (frontend 310 tests 그대로 통과)

## 8. 리스크

- **운영 DB drift**: 기존 production에 FEDEX/OCS row가 없을 가능성 높음. `ensure_defaults!`는 `exists?` 체크로 idempotent하므로 한 번이라도 UPS/DHL이 있으면 신규 carrier seed가 안 됨 → **수정 필요** (`exists?(carrier: 'FEDEX')` 단위로 분리). Design 단계에서 처리.
- **기존 RSpec drift**: `ensure_defaults!` 동작 검증 spec이 있으면 4-carrier 시드 후 통과하도록 보강.
