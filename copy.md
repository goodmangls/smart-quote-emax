# Smart Quote System — Copywriting Guide

> BridgeLogis 카피라이팅 가이드 및 텍스트 인벤토리

**Last Updated**: 2026-03-30

---

## 1. Brand Identity

### Official Brand Names

| Context | Text | Usage |
|---------|------|-------|
| **Primary Brand** | BridgeLogis | 외부 노출, SEO, 도메인 (bridgelogis.com) |
| **Product Name** | Smart Quote | 시스템/앱 이름, 로그인 화면 |
| **Tagline** | Bridging Your Cargo to the World. | Footer, 마케팅 |

### Brand Name Usage Rules

- Landing Page: "BridgeLogis" (primary brand)
- Login/Signup: "Smart Quote System" (product name)
- Footer: "BridgeLogis. Bridging Your Cargo to the World."
- Document Title: "BridgeLogis — Global Express Freight Quoting Platform"
- AI Chatbot: "Smart Quote Assistant" / "Smart Quote 어시스턴트"

---

## 2. Landing Page Copy

### Hero Section

| Key | Korean | English |
|-----|--------|---------|
| `landing.badge.networks` | Global Freight Networks | Global Freight Networks |
| `landing.title.main` | 190개국 국제 운임, | International freight to 190 countries, |
| `landing.title.sub` | 1초 만에 견적 완료. | quoted in 1 second. |
| `landing.subtitle` | UPS, DHL, EMAX 3사 캐리어 실시간 비교... | Compare UPS, DHL, EMAX carriers in real-time... |

### Stats

| Key | Korean | English |
|-----|--------|---------|
| `landing.stat.carriers` | 3개 캐리어 | 3 Carriers |
| `landing.stat.countries` | 190개국 | 190 Countries |
| `landing.stat.calculation` | 즉시 계산 | Instant Calc |
| `landing.stat.available` | 24/7 | 24/7 |

### Feature Cards

| Key | Korean | English |
|-----|--------|---------|
| `landing.instantQuotes` | 즉시 견적 | Instant Quotes |
| `landing.accurateBreakdown` | 정확한 비용 분석 | Accurate Breakdown |
| `landing.verifiedCarriers` | 검증된 캐리어 | Verified Carriers |

### CTA

| Key | Korean | English |
|-----|--------|---------|
| `landing.getStarted` | 견적 시작하기 | Get Started |
| `nav.login` | 로그인 | Login |

---

## 3. Authentication Copy

### Login Page

| Key | Korean | English |
|-----|--------|---------|
| (hardcoded) | Smart Quote System | Smart Quote System |
| `auth.signinTitle` | 로그인 | Sign In |
| `auth.email` | 이메일 | Email |
| `auth.password` | 비밀번호 | Password |
| `auth.signin` | 로그인 | Sign In |
| `auth.noAccount` | 계정이 없으신가요? | Don't have an account? |
| `auth.backHome` | 홈으로 | Back to Home |

### Sign Up Page

| Key | Korean | English |
|-----|--------|---------|
| `auth.signupTitle` | 회원가입 | Sign Up |
| `auth.company` | 회사명 | Company |
| `auth.name` | 이름 | Name |
| `auth.nationality` | 국적 | Nationality |
| `auth.networks` | 물류 네트워크 | Freight Networks |
| `auth.networksHint` | 소속 네트워크를 선택하세요 (복수 선택) | Select your networks (multiple) |
| `auth.confirmPassword` | 비밀번호 확인 | Confirm Password |
| `auth.signup` | 회원가입 | Sign Up |
| `auth.haveAccount` | 이미 계정이 있으신가요? | Already have an account? |

### Auth Error Messages

| Key | Korean | English |
|-----|--------|---------|
| `auth.invalidCredentials` | 이메일 또는 비밀번호가 올바르지 않습니다 | Invalid email or password |
| `auth.fillAll` | 모든 필드를 입력해주세요 | Please fill in all fields |
| `auth.emailExists` | 이미 등록된 이메일입니다 | Email already exists |
| `auth.passwordsNotMatch` | 비밀번호가 일치하지 않습니다 | Passwords do not match |

---

## 4. Navigation Copy

| Key | Korean | English |
|-----|--------|---------|
| `nav.smartQuote` | Smart Quote | Smart Quote |
| `nav.admin` | 관리자 | Admin |
| `nav.schedule` | 스케줄 | Schedule |
| `nav.dashboard` | 대시보드 | Dashboard |
| `nav.guide` | 사용 가이드 | Guide |
| `nav.logout` | 로그아웃 | Logout |
| `nav.login` | 로그인 | Login |
| `nav.signup` | 회원가입 | Sign Up |

---

## 5. Calculator UI Copy

### Section Labels

| Key | Korean | English |
|-----|--------|---------|
| `calc.shipmentConfig` | 배송 설정 | Shipment Configuration |
| `calc.shipmentConfigDesc` | 출발지, 도착지, 화물 정보를 입력하세요 | Enter origin, destination, and cargo details |
| `calc.resetTitle` | 견적 초기화 | Reset Quote |
| `calc.resetMessage` | 모든 입력값이 초기화됩니다 | All input values will be reset |
| `calc.resetQuote` | 초기화 | Reset |

### Cost Breakdown (hardcoded in text.ts — needs i18n)

| Field | Current Text (Korean+English mixed) |
|-------|--------------------------------------|
| Title | 비용 산출 기준 (Calculation Basis) |
| Material | 자재비 (Material): 화물 표면적(m²) x 15,000원 |
| Labor | 인건비 (Labor): 박스당 50,000원 (진공포장 시 1.5배) |
| Fumigation | 훈증비 (Fumigation): 30,000원 (Packing 시 고정) |
| Handling | 핸들링 (Handling): 35,000원 (수출통관/서류) |
| Disclaimer | Prices include all estimated surcharges. (English only) |

### CostBreakdownCard Labels (hardcoded in component)

| Label | Language | File |
|-------|----------|------|
| "Freight Cost" | EN only | CostBreakdownCard.tsx |
| "Base Rate" | EN only | CostBreakdownCard.tsx |
| "Add-ons" | EN only | CostBreakdownCard.tsx |
| "Manual Surge" | EN only | CostBreakdownCard.tsx |
| "Freight Total" | EN only | CostBreakdownCard.tsx |

### Route/Pickup Guidance (hardcoded in text.ts)

| Field | Text | Language |
|-------|------|----------|
| Same Day | 당일혼적: 14시 이전 픽업건은 당일 18시까지 입고 | KO only |
| Next Day | 익일혼적: 14시 이후 픽업건은 익일 10시까지 입고 | KO only |
| Remote Warning | 별도 협의 필요 | KO only |
| Jeju Label | Jeju / Remote Island | EN only |
| Jeju Sub | Additional Surcharge Applies | EN only |

---

## 6. AI Chatbot Copy

### Welcome Messages (4 languages, in AiChatWidget.tsx)

| Language | Welcome Text |
|----------|-------------|
| EN | Hi {name}! How can I help you with your shipping quote today? |
| KO | 안녕하세요 {name}님! 배송 견적에 대해 도움이 필요하신가요? |
| CN | 你好 {name}！需要关于运费报价的帮助吗？ |
| JA | こんにちは {name}さん！配送見積もりについてお手伝いしますか？ |

### Preset Questions (Korean, 9+ questions)

- 견적 계산기는 어떻게 사용하나요?
- UPS와 DHL 요금 차이가 궁금합니다
- 포장 옵션별 비용 차이를 알려주세요
- 유류할증료(FSC)란 무엇인가요?
- 용적중량은 어떻게 계산되나요?
- 견적서 PDF는 어떻게 다운로드하나요?
- 인코텀즈 DAP는 무엇인가요?
- 외곽 지역 추가 요금은 어떻게 확인하나요?
- 견적 이력은 어디서 확인하나요?

---

## 7. Footer Copy

| Context | Text |
|---------|------|
| Copyright | (c) {year} BridgeLogis. Bridging Your Cargo to the World. All rights reserved. |

**Note**: Footer.tsx → `t('landing.footer')` 사용 (translations.ts 참조).

---

## 8. Error Messages

| Key | Korean | English |
|-----|--------|---------|
| `error.somethingWrong` | 문제가 발생했습니다 | Something went wrong |
| `error.tryAgain` | 다시 시도 | Try Again |
| `error.reloadPage` | 페이지 새로고침 | Reload Page |

### API Error Messages (apiClient.ts — English only)

| Status | Message |
|--------|---------|
| 401 | Session expired |
| 403 | Access denied |
| 404 | Not found |
| 500+ | Server error |
| Default | Request failed |

---

## 9. Consistency Issues & Action Items

### Issue 1: Brand Name 혼재 (HIGH)

| Location | Current | Should Be |
|----------|---------|-----------|
| LoginPage.tsx:88 | "Smart Quote System" (hardcoded) | `t('auth.systemName')` |
| SignUpPage.tsx:93 | "Smart Quote System" (hardcoded) | `t('auth.systemName')` |
| Footer.tsx:7 | Hardcoded full text | `t('landing.footer')` (already exists) |
| LandingPage.tsx:19 | Hardcoded document.title | Consider `t('landing.documentTitle')` |

### Issue 2: 언어 혼용 (HIGH)

| File | Problem |
|------|---------|
| `text.ts` COST_BREAKDOWN | "비용 산출 기준 (Calculation Basis)" — KO+EN mixed |
| `text.ts` ROUTE | "→ 결과 화면의 'Domestic Cost'를 직접 입력해주세요." — KO+EN mixed |
| `text.ts` JEJU | "Jeju / Remote Island" — EN only in KO context |
| CostBreakdownCard.tsx | "Freight Cost", "Add-ons" — EN only labels |

### Issue 3: 번역 누락 (MEDIUM)

| Item | Current | Recommendation |
|------|---------|---------------|
| Country names (options.ts) | English only (190+) | 내부 도구이므로 EN 유지 가능 |
| text.ts 전체 | Hardcoded KO+EN mix | translations.ts로 이전 |
| SignUpPage placeholders | "Optional", "Select" hardcoded | 번역 키로 변경 |
| Header aria-label | "Select language" EN only | 번역 키로 변경 |

### Issue 4: 톤앤매너 가이드

| Context | Tone | Example |
|---------|------|---------|
| Landing/Marketing | Professional, Confident | "190개국 국제 운임, 1초 만에 견적 완료." |
| Calculator UI | Clear, Functional | "배송 설정", "화물 정보를 입력하세요" |
| Error Messages | Empathetic, Helpful | "문제가 발생했습니다. 다시 시도해주세요." |
| Admin Interface | Technical, Precise | "Target Margin Rules", "Audit Log" |
| Chatbot | Friendly, Conversational | "안녕하세요! 배송 견적에 대해 도움이 필요하신가요?" |

---

## 10. Translation Coverage Summary

| Area | translations.ts | Hardcoded | Coverage |
|------|:--------------:|:---------:|:--------:|
| Landing Page | 15+ keys | 1 | 95% |
| Login/Signup | 15+ keys | 3 | 85% |
| Navigation | 10+ keys | 0 | 100% |
| Calculator | 20+ keys | 10+ | 65% |
| Dashboard | 10+ keys | 2 | 85% |
| Admin | 20+ keys | 5+ | 80% |
| Schedule | 15+ keys | 0 | 100% |
| AI Chat | Inline 4-lang | 0 | 100% |
| Footer | Key exists | Uses hardcode | 0% (duplicate) |
| Error | 3 keys | 5+ API msgs | 40% |
| Config (text.ts) | 0 | 10+ | 0% |
| **Overall** | **390+ keys** | **~35 items** | **~90%** |

---

## 11. GSSA Group Labels

| Group | English | Korean | Badge Color |
|-------|---------|--------|-------------|
| goodman | Goodman GLS | Goodman GLS | Blue (jways) |
| gac | Globe Air Cargo (ECS) | Globe Air Cargo (ECS) | Purple |
| extrans | Extrans Air | Extrans Air | Orange |
| daejoo | Daejoo Air Agencies | 대주항공 | Indigo |
| apex | Apexlogistics | 에이펙스로지스틱스 | Emerald |

---

## 12. Carrier Names

| Code | English | Korean | Usage |
|------|---------|--------|-------|
| UPS | UPS Express Saver | UPS 익스프레스 세이버 | Calculator, Rate Tables |
| DHL | DHL Express Worldwide | DHL 익스프레스 월드와이드 | Calculator, Rate Tables |
| EMAX | EMAX (E-MAX) | EMAX (이맥스) | Calculator, Rate Tables |
