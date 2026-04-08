# Gap Analysis: auth-system-recovery

> 인증 시스템 긴급 복구 — Gap 분석 결과

## Analysis Overview
- **Date**: 2026-04-08
- **Match Rate**: 97% -> 100% (cleanup 후)
- **Items Checked**: 9

## Results

| # | Requirement | Score | Status |
|---|------------|:-----:|:------:|
| 1 | API URL 일관성 (emax suffix) | 100% | PASS |
| 2 | JWT Secret 안정화 (ENV 우선) | 100% | PASS |
| 3 | Thruster 제거 + bin/thrust 삭제 | 100% | PASS |
| 4 | Docker Entrypoint (무조건 DB migrate) | 100% | PASS |
| 5 | Users networks 컬럼 추가 | 100% | PASS |
| 6 | CORS (CORS_ORIGINS 환경변수 사용) | 100% | PASS |
| 7 | Render 설정 (render.yaml) | 100% | PASS |
| 8 | 프론트엔드 Auth Flow | 100% | PASS |
| 9 | Dockerfile CMD (Puma 직접) | 100% | PASS |

## Root Causes Identified

1. **Render Free Tier PostgreSQL 90일 만료** -> DB 재생성 시 사용자 데이터 소실
2. **schema.rb에 networks 컬럼 누락** -> Users API 500 에러
3. **API URL 불일치** (smart-quote-api vs smart-quote-api-emax)
4. **JWT secret 불안정** (credentials vs ENV 우선순위)
5. **Thruster CORS 헤더 드랍** (Rails 8 기본 포함)

## Changes Made

- `production.rb`: APP_HOST 기본값 수정
- `jwt_authenticatable.rb`: ENV["SECRET_KEY_BASE"] 우선
- `Gemfile`: thruster 제거
- `bin/docker-entrypoint`: 무조건 db:prepare + db:migrate
- `db/schema.rb` + 새 마이그레이션: networks 컬럼 보장
- `cors.rb`: CORS_ORIGINS 환경변수 사용
- `bin/thrust`: 삭제
- `ResultSection.test.tsx`: i18n 모킹 수정
