# Archive Index — 2026-06

| Feature | Match Rate | Date | Documents |
|---------|:----------:|------|-----------|
| box-level-rounding | 100% | 2026-06-05 | [report](box-level-rounding/box-level-rounding.report.md) |
| smart-quote-emax-e2e-landing-debt | 100% | 2026-06-05 | [plan](smart-quote-emax-e2e-landing-debt/smart-quote-emax-e2e-landing-debt.plan.md), [report](smart-quote-emax-e2e-landing-debt/smart-quote-emax-e2e-landing-debt.report.md) |

> **box-level-rounding** — 멀티박스(2+) 박스별 청구중량 0.5kg 올림(A안). FE+BE 미러, FE TDD 4 + BE rspec 5 통과, parity snapshot 2건 갱신, 단일박스 회귀 0. PR #1 admin squash merge `0f69e08`. 직접-TDD 사이클(plan/design/analysis 생략 — E-MAX 사전 확정 규칙).
>
> **smart-quote-emax-e2e-landing-debt** — stale e2e 셀렉터 정상화로 수 주째 만성 CI red 해소. 원인=ko 기본 언어인데 영문 텍스트·구 디자인 가정 셀렉터(앱 정상). landing+login+accessibility 3파일 href/id/type 기반 전환, 앱 코드 0 변경, 로컬 e2e 23/23. PR #2 admin squash merge `c0a34d8`, main CI 전 job green 확정.
