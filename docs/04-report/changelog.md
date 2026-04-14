# Changelog

모든 주요 변경사항과 PDCA 완료 이력을 기록합니다.

---

## [2026-04-14] - Magic Link 패스워드리스 인증 완성

### Added

- Magic Link 이메일 인증 기능
  - `MagicLinkToken` 모델 (SHA256 토큰 해싱, 일회성 + 15분 만료)
  - `POST /api/v1/auth/magic_link` — 인증 이메일 발송
  - `POST /api/v1/auth/magic_link/verify` — 토큰 검증 및 JWT 발급
  - Rate Limiting: 5회/5분/IP (Rack::Attack)
  
- Frontend 구성요소
  - `MagicLinkVerifyPage.tsx` — `/auth/verify?token=X` 토큰 검증 페이지
  - LoginPage에 Magic Link 모드 추가 (토글 UI)
  - AuthContext에 `requestMagicLink()`, `verifyMagicLink()` 함수 추가
  
- 다국어 지원
  - 영어/한국어 12개 i18n 키 추가
  - 이메일 템플릿 이중 언어 지원

### Changed

- AuthMailer: `deliver_later` → `deliver_now` (의도된 변경 — SMTP 오류 즉시 감지)
- LoginPage 리다이렉트: `/dashboard` → `/admin` (emax admin-first 앱 특화)

### Security

- SHA256 토큰 해싱으로 DB 유출 시에도 토큰 노출 방지
- 이메일 열거 공격 방어 (User 존재 여부와 무관 동일 응답)
- SMTP/ActiveRecord 오류 분리 처리로 정보 노출 최소화

### Infrastructure

- Render 환경변수 필요: `FRONTEND_URL=https://smart-quote-emax.vercel.app` (미설정 시 로컬 호스트로 fallback)

### Performance

- `MagicLinkToken.stale` scope + `cleanup_stale!` 추가로 만료 토큰 자동 정리 가능

### Quality Metrics

- **Match Rate**: 97% (설계 기준)
- **코드 갭**: 0건
- **운영 갭**: 1건 (FRONTEND_URL 환경변수 설정 필요)
- **TypeScript 오류**: 0건
- **빌드 상태**: ✅ 성공

### Documentation

- Plan 문서: `docs/archive/2026-04/magic-link-auth/magic-link-auth.plan.md`
- Design 문서: `docs/archive/2026-04/magic-link-auth/magic-link-auth.design.md`
- Gap Analysis: `docs/03-analysis/magic-link-emax.analysis.md`
- Completion Report: `docs/04-report/features/magic-link-emax.report.md`

---

## 템플릿 (다음 기능 추가 시)

```markdown
## [YYYY-MM-DD] - {Feature Name}

### Added
- {기능 설명}

### Changed
- {변경사항}

### Fixed
- {버그 수정}

### Removed
- {제거된 기능}

### Security
- {보안 개선}

### Performance
- {성능 최적화}

### Documentation
- {문서 업데이트}
```
