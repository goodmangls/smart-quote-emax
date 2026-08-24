# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Quote System for **E-MAX Worldwide Express** - an internal logistics quoting tool that calculates international shipping costs across carriers (UPS, DHL, FedEx, EMAX, OCS). React frontend with a Rails API backend, sharing mirrored calculation logic. Includes customer dashboard with live exchange rates, weather, jet fuel prices, notices, and account manager widgets. Role-based access (Admin/Member) with Slack notifications and Sentry error tracking.

## Development Commands

### Frontend (React 19 + TypeScript 5.8 + Vite 6 + Node 22)

```bash
npm run dev          # Dev server on http://localhost:5173
npm run build        # tsc + vite build
npm run lint         # ESLint (--max-warnings 0)
npm run test         # Vitest in watch mode
npx vitest run       # Run tests once (34 files, 322 tests)
npx tsc --noEmit     # Type check only
```

### Backend (Rails 8 API-only - from smart-quote-api/)

```bash
bundle install           # Install gems
bin/rails db:prepare     # Create + migrate DB
bin/rails server         # API on http://localhost:3000
bundle exec rspec        # RSpec tests
bin/rubocop              # Ruby linting
```

### Running a single test

```bash
# Frontend
npx vitest run src/features/quote/services/calculationService.test.ts
# Backend
bundle exec rspec spec/requests/api/v1/quotes_spec.rb
```

## Architecture

### Monorepo Structure

```
/                              # Frontend
  src/
    api/                       # API clients
      apiClient.ts             # Centralized fetch client (auth token, 401 handling)
      quoteApi.ts              # Rails backend (fetch-based, VITE_API_URL)
      marginRuleApi.ts         # Margin rule CRUD + resolve API
      exchangeRateApi.ts       # open.er-api.com (KRW base, localStorage cache for previous rates)
      weatherApi.ts            # Open-Meteo API (47 global ports/airports)
      noticeApi.ts             # Company announcements
    types.ts                   # Core TypeScript types & enums (QuoteInput, QuoteResult, Incoterm, etc.)
    types/dashboard.ts         # Dashboard types (ExchangeRate, PortWeather, LogisticsNews, AccountManager)
    i18n/translations.ts       # 2-language dictionary (en/ko, ~800 keys)
    config/                    # Rate tables, business rules, UI constants
      ups_tariff.ts            # UPS Z1-Z10 rate tables (synced with backend, Eff. 01-Feb-26)
      dhl_tariff.ts            # DHL Z1-Z8 rate tables (synced with backend, 2026 정가)
      fedex_tariff.ts          # FedEx IP ZA-ZY rate tables (synced with backend, Eff. 2026.01.05)
      emax_tariff.ts           # EMAX per-country rate tables (CN, VN Hanoi-only)

      ocs_tariff.ts            # OCS rate tables and handling charges (TW/HK/SG/CN/JP)
      fsc-history.ts           # FSC historical rates with localStorage persistence (UPS/DHL/FedEx/OCS)
      rates.ts                 # KRW cost constants + FSC 폴백 상수 (매주 갱신 — 수치는 파일 참조)
      business-rules.ts        # Surge thresholds, packing weight buffer/addition
      options.ts               # Country options, carrier options, incoterm options
      addon-utils.ts           # Shared AddonRateLike/NormalizedRate types, calcAddonFee(), findRate()
      ups_zones.ts / dhl_zones.ts / fedex_zones.ts / ocs_zones.ts  # Config-driven zone mappings (Record<string, ZoneInfo>)
      ups_addons.ts            # UPS add-on rates (6) + Surge Fee config (Israel/ME)
      dhl_addons.ts            # DHL add-on rates (19) with auto-detect (OSP, OWT)
      ups_eas_lookup.ts        # EAS/RAS postal code lookup (binary search, lazy-load from public/data/)
    contexts/                  # React Context providers
      AuthContext.tsx           # JWT auth (user, session, login/logout)
      LanguageContext.tsx       # i18n (useLanguage hook, localStorage persistence)
      ThemeContext.tsx          # Dark/light mode (useTheme hook)
    features/
      quote/
        components/            # InputSection, ResultSection, SaveQuoteButton, CarrierComparisonCard
        components/widgets/    # ExchangeRateWidget, WeatherWidget, NoticeWidget, AccountManagerWidget, ExchangeRateCalculatorWidget
        services/              # calculationService.ts (orchestrator, 369 lines), dhlAddonCalculator.ts, upsAddonCalculator.ts
        hooks/                 # useSyncToInput (generic data sync hook)
        components/PackingTypeInfo.tsx  # Packing type info panel with live cost preview
      history/
        components/            # QuoteHistoryPage, QuoteHistoryTable, QuoteSearchBar, QuotePagination, QuoteDetailModal
        constants.ts           # Shared constants (STATUS_COLORS)
      admin/
        components/            # DiscountRulesWidget (formerly Margin), FscRateWidget, UserManagementWidget, CustomerManagement, AuditLogViewer, RateTableViewer
        components/surcharge/  # SurchargeManagementWidget, SurchargeForm, SurchargeTable, SurchargeCarrierLinks, SurchargeNotice
      dashboard/
        components/            # WelcomeBanner, QuoteHistoryCompact, AccountSettingsModal, WidgetError, WidgetSkeleton
        hooks/                 # useExchangeRates, usePortWeather, useLogisticsNews, useMarginRules, useResolvedMargin, useFscRates, useSurcharges, useAddonRates
    pages/                     # Route-level pages
      LandingPage.tsx          # Public landing (/)
      LoginPage.tsx            # Auth login (/login)
      SignUpPage.tsx           # Auth signup (/signup)
      CustomerDashboard.tsx    # Dashboard with widgets (/dashboard)
      QuoteCalculator.tsx      # Calculator + history (/quote, /admin)
      components/              # CalculatorActionBar, AdminWidgets, MobileStickyBottomBar
    components/
      layout/                  # Header, MobileLayout, NavigationTabs, Footer
      ui/CollapsibleSection.tsx # Reusable collapsible wrapper for admin widgets
      ProtectedRoute.tsx       # Auth guard (requireAdmin prop for /admin, /schedule)
      ErrorBoundary.tsx        # React error boundary with Sentry
      ChannelTalk.tsx          # ChannelTalk chat widget
    lib/
      format.ts                # Currency/number formatters (formatKRW, formatUSD, formatNum, formatUSDInt)
      pdfService.ts            # jsPDF-based PDF (packing details, carrier add-ons, surcharge info)
      packing-utils.ts         # applyPackingDimensions() shared utility (eliminates 6x duplication)
      fetchWithRetry.ts        # Generic fetch retry wrapper
      slackNotification.ts     # Slack notification for member quote saves
smart-quote-api/               # Backend (Rails 8 API-only, Ruby 3.4, PostgreSQL)
  app/models/
    margin_rule.rb             # Margin rule model (validations, scopes, soft delete)
    audit_log.rb               # Audit trail model
  app/services/
    quote_calculator.rb        # Main orchestrator
    quote_searcher.rb          # Search/filter chain for quotes
    quote_exporter.rb          # CSV export with 10K limit
    quote_serializer.rb        # Quote summary/detail serialization
    discount_rule_resolver.rb  # Priority-based discount resolution (first-match-wins)
    surcharge_resolver.rb      # System surcharge calculation (War Risk, PSS, EBS, etc.)
    addon_rate_resolver.rb     # Add-on rate lookup
    calculators/
      base_rate_lookup.rb      # Shared zone/weight rate lookup (exact -> range -> fallback)
      item_cost.rb             # Packing dimensions, volumetric weight, material/labor
      ups_cost.rb / ups_zone.rb
      ups_surge_fee.rb         # UPS Surge Fee auto-calc (Israel/Middle East)
      dhl_cost.rb / dhl_zone.rb
      fedex_cost.rb / fedex_zone.rb
      emax_cost.rb
      ocs_cost.rb / ocs_zone.rb
  app/controllers/api/v1/
    quotes_controller.rb       # Quote CRUD (uses QuoteSearcher, QuoteExporter, QuoteSerializer)
    margin_rules_controller.rb # CRUD + resolve endpoint (admin guard, audit log)
    surcharges_controller.rb   # Surcharge CRUD
    addon_rates_controller.rb  # Add-on rate management
    customers_controller.rb    # Customer CRUD
    users_controller.rb        # User management
    auth_controller.rb         # JWT login/register/password
    fsc_controller.rb          # FSC rate view/update
    audit_logs_controller.rb   # Audit log viewer
    chat_controller.rb         # AI chatbot (Claude API, role-aware, language auto-detect, markdown, preset questions)
    notifications_controller.rb # Slack webhook proxy
  db/seeds/addon_rates.rb      # DHL 19 + UPS 6 add-on rate seed data
  lib/constants/               # Tariff tables (ups_tariff.rb, dhl_tariff.rb, emax_tariff.rb, ocs_tariff.rb)
```

### Routing (src/App.tsx)

```
/              → LandingPage (public)
/login         → LoginPage (public)
/signup        → SignUpPage (public)
/dashboard     → CustomerDashboard (ProtectedRoute)
/quote         → QuoteCalculator isPublic=true (ProtectedRoute)
/admin         → QuoteCalculator isPublic=false (ProtectedRoute requireAdmin)
/guide         → UserGuidePage (public E-MAX Manual)
*              → redirect to /
```

Context providers wrap the app: `ThemeProvider > LanguageProvider > BrowserRouter > AuthProvider`

### Role-Based Access

| Feature | Admin | Member |
|---------|:-----:|:------:|
| Dashboard & widgets | O | O (limited) |
| Quote calculator | O | O |
| Carrier Comparison | O | O |
| Financial settings (Ex.Rate, FSC, Margin) | O | X |
| Special Packing options | O | X |
| Weather Widget | O | X |
| Exchange Rate / Calculator Widget | O | X |
| Jet Fuel Widget | O | O |
| Language toggle (i18n) | O | X |
| Currency toggle (KRW/USD) | O | X |
| Flight Schedule (/schedule) | O | X |
| Quote history | O | O |
| Admin widgets panel (collapsible) | O | X |
| Slack notification on save | X | O (auto) |

### Data Flow

1. User edits input -> frontend `calculateQuote()` runs instantly via `useMemo` (no debounce, pure function)
2. "Save Quote" -> `POST /api/v1/quotes` -> backend `QuoteCalculator.call(params)` recalculates + persists to PostgreSQL (ref: `SQ-YYYY-NNNN`)
3. Member save -> Slack notification via `POST /api/v1/notifications/slack` (best-effort, condition: `user.role === 'member' && !isDuplicate`)
4. History tab -> `GET /api/v1/quotes` with pagination/search/filter params

### Mirrored Calculation Logic

Frontend (`src/features/quote/services/calculationService.ts`) and backend (`smart-quote-api/app/services/`) implement **identical** calculation logic. The frontend runs calculations instantly for UI responsiveness; the Rails API is the source of truth for saved quotes.

### Calculation Pipeline

1. **Item Costs** - Packing dimensions (+10/+10/+15cm), volumetric weight (`L*W*H / 5000` for UPS/DHL/FedEx/OCS, `/6000` for EMAX), packing material/labor, manual surge charges (all carriers).
2. **Billable Weight** - Single box (Σqty=1): `max(Σ actual, Σ volumetric)` (legacy total model). Multi-box (2+ physical boxes): per-box billing — `Σᵢ roundToHalf(max(actualᵢ, volumetricᵢ))`, i.e. round each box's chargeable weight up to 0.5kg, then sum (E-MAX confirmed). Mirrored in `calculateItemCosts.totalBillableWeight` (frontend) and `ItemCost#total_billable_weight` (backend).
3. **Carrier Costs** - Zone lookup (country -> zone code), shared `lookupCarrierRate()` engine (exact table 0.5-20kg -> range table >20kg -> fallback), FSC% surcharge.
4. **Margin** - Dynamic margin via `MarginRuleResolver` (priority-based: P100 per-user flat > P90 per-user weight > P50 nationality > P0 default), `revenue = cost / (1 - margin%)`, rounded up to nearest KRW 100. Admin can manually override at any time.
5. **Warnings** - Low margin (<10%), high volumetric weight, surge charges, collect terms (EXW/FOB), EMAX/OCS country support.


### UPS Zone Mapping (Z1-Z10) — per UPS 2026 Service Guide

Z1: SG/TW/MO/CN, Z2: JP/VN, Z3: TH/PH, Z4: AU/IN, Z5: CA/US, Z6: ES/IT/GB/FR, Z7: DK/NO/SE/FI/DE/NL/BE/IE/CH/AT/PT/CZ/PL/HU/RO/BG, Z8: AR/BR/CL/CO/AE/TR/ZA/EG/BH/SA/PK/KW/QA, Z9: IL/JO/LB, Z10: HK+default

Zone mappings are config-driven (`src/config/ups_zones.ts`, `src/config/dhl_zones.ts`).

### UPS Surge Fee (2026-03-15~)

- Israel (IL): KRW 4,722/kg + FSC
- Middle East (AF/BH/BD/EG/IQ/JO/KW/LB/NP/OM/PK/QA/SA/LK/AE): KRW 2,004/kg + FSC
- Auto-detected in `ups_addons.ts` → applied as UPS Add-on (code: SGF)
- Backend: `calculators/ups_surge_fee.rb`

### EAS/RAS Auto-Detection

- 86 countries, 39,876 zip ranges in `public/data/ups_eas_data.json` (lazy-loaded)
- Binary search O(log n) in `src/config/ups_eas_lookup.ts`
- Detects EAS (Extended), RAS (Remote), DAS (Delivery) surcharges by postal code
- Shows auto-detect banner in UpsAddOnPanel with one-click apply


## Dashboard Widgets

### ExchangeRateWidget

- **API**: `open.er-api.com/v6/latest/KRW` (free tier, 1500 req/month, daily updates)
- **Currencies**: USD, EUR, JPY, CNY, GBP, SGD
- **Rate inversion**: API returns KRW→foreign (e.g., USD: 0.000701), code inverts to "1 USD = X KRW"
- **localStorage caching**: Previous rates stored under `exchange_rates_prev` key for real change calculation
- **Polling**: `useExchangeRates` hook - 5min interval, 6min stale threshold, 30s stale check tick
- **Auto-refresh**: `visibilitychange` + `online` event listeners trigger `refreshIfStale()`
- **Live indicator**: Green pulse (fresh) / gray dot (stale) in widget header

### ExchangeRateCalculatorWidget

- Quick currency conversion calculator on the dashboard sidebar

### WeatherWidget

- **API**: Open-Meteo (no API key required)
- **Coverage**: 47 global ports & airports
- **Hook**: `usePortWeather` with paginated carousel (8 ports per page)

### JetFuelWidget

- **API**: US Energy Information Administration (EIA), proxied through Rails `/api/v1/jet_fuel` (API key lives on the server)
- **Dashboard**: Real-time USGC Jet Fuel spot prices and trend chart

### NoticeWidget / AccountManagerWidget

- NoticeWidget dynamically fetches real-time logistics news via a Vite proxy / edge function pulling from RSS feeds.
- AccountManagerWidget displays static/mock contact information with a paginated carousel display

### Admin Widgets (visible at /admin only)

- **FscRateWidget**: Tracks live DHL/UPS/FedEx/OCS fuel surcharges with external verification links and manual override
- **DiscountRulesWidget**: DB-driven discount rule CRUD, priority-based grouping (P100/P90/P50/P0), inline add/edit, soft delete
- **SurchargeManagementWidget**: Carrier-specific surcharge CRUD (split into SurchargeForm, SurchargeTable, SurchargeCarrierLinks, SurchargeNotice sub-components)
- **CustomerManagement**: Customer CRUD with quote count badges
- **UserManagementWidget**: User role/account management
- **RateTableViewer**: Read-only carrier rate table viewer
- **AuditLogViewer**: All admin actions audit trail with search/filter

## External APIs

### Performance Guidelines

- **Lazy Loading**: Use `React.lazy()` for route-level components and heavy admin features (`AdminWidgets`, `QuoteHistoryPage`).
- **Dynamic Imports**: Use `await import()` for heavy libraries like `jspdf` inside event handlers to keep the initial JS chunk small.
- **Manual Chunking**: Maintain `vite.config.ts` manualChunks to isolate React core and larger dependencies.

### FedEx Add-on Services (2026, IPE/IP/IE)

Source: FedEx "추가 서비스 요금 및 기타 정보 — 대한민국" (KR_20251119_102313). Config `src/config/fedex_addons.ts` ↔ backend `Calculators::CarrierAddonCost::FEDEX_FALLBACK` — **동일 값 유지 필수**.

- **Highest-only** — 한 패키지가 비표준화물 기준(용적/중량/패키징 35,600 · 특대형 86,000 · 미허가 378,200) 2종 이상에 해당하면 **가장 높은 금액 하나만** 부과된다. 합산하면 최대 4배 과대견적.
- **최소 청구 중량 18kg** — 추가 취급 요금–용적 기준에 해당하는 패키지는 18kg 미만으로 청구되지 않는다. 부가요금이 정액이므로 이 규칙은 **base 요율 조회**에 작용한다(`getFedexMinChargeableWeight` / `CarrierAddonCost.fedex_min_chargeable_weight` → `billableWeight`).
- `calculate_fedex` 는 다른 캐리어와 달리 **반올림하지 않은 total** 을 반환한다 — 프론트(`fedexAddonCalculator.ts`)와 원 단위로 일치시키기 위함이다.

**범위 밖**: Freight(IPF/IEF), 계약 기반 프리미엄(M&I·Priority Alert·ODC), 지역 그룹 기반 OPA/ODA(그룹 A/B/C 국가 목록이 원문에 없음), 제3자 청구 2.5%(과금 기준이 총 운임이라 `calc_fee` 경로와 맞지 않음).

## Business Logic Rules

- **EMAX Vietnam**: All Vietnam quotes must use the **Hanoi-based** rate table and range rate (KRW 11,000/kg >20kg).
- **EMAX Weight Policy**: Apply **0.5kg step rounding** (round up to nearest 0.5kg) for all EMAX calculations to ensure consistency with carrier tariffs.
- **Incoterm Policy**: UPS/DHL/FedEx/EMAX/OCS express shipments → **DAP only** (no exceptions). AI chatbot enforces this in responses.
- **Volumetric Weight**: Use `L*W*H/5000` for all carriers except EMAX (`/6000`).
- **Billable Weight (per-box)**: For multi-box shipments (2+ physical boxes, counting quantity), round each box's chargeable weight `max(actual, volumetric)` up to 0.5kg **individually**, then sum: `Σᵢ roundToHalf(max(actualᵢ, volumetricᵢ))` (E-MAX confirmed). A single box (Σqty=1) keeps the legacy `max(Σ actual, Σ volumetric)` total model — unchanged. Identical logic mirrored in frontend (`calculationService.ts`) and backend (`item_cost.rb` / `quote_calculator.rb`).
- **Rounding Policy**: Margin-adjusted revenue is always rounded up to the nearest KRW 100.


| API             | Endpoint                                | Purpose                   |
| --------------- | --------------------------------------- | ------------------------- |
| Rails Backend   | `VITE_API_URL` (default localhost:3000) | Quote CRUD, persistence   |
| open.er-api.com | `/v6/latest/KRW`                        | Exchange rates (KRW base) |
| Open-Meteo      | `api.open-meteo.com/v1/forecast`        | Port/airport weather      |
| US EIA API      | `api.eia.gov/v2/petroleum/pri/spt/data` | USGC Jet Fuel prices      |
| Supabase        | `VITE_SUPABASE_URL`                     | Authentication            |
| Slack Webhook   | `/api/v1/notifications/slack`           | Member quote save alerts  |

## i18n System

- **Languages**: `en | ko` (defined in `src/i18n/translations.ts`)
- **Hook**: `useLanguage()` from `LanguageContext` returns `{ language, setLanguage, t }`
- **Persistence**: localStorage key `'language'`
- **Usage**: `t('key.name')` in all components

## API Endpoints

```
POST   /api/v1/quotes/calculate  # Stateless calculation
POST   /api/v1/quotes            # Calculate + save
GET    /api/v1/quotes            # List (page, per_page, q, destination_country, date_from, date_to, status)
GET    /api/v1/quotes/:id        # Detail
PATCH  /api/v1/quotes/:id        # Update status/notes/customer
DELETE /api/v1/quotes/:id        # Delete
GET    /api/v1/quotes/export     # CSV download

# Authentication
POST   /api/v1/auth/login        # JWT Login
POST   /api/v1/auth/register     # Account creation
PUT    /api/v1/auth/password     # Change Password

# Admin Configuration
GET    /api/v1/fsc/rates         # View Fuel Surcharges (DHL/UPS/FedEx/OCS)
POST   /api/v1/fsc/update        # Update global FSC% rates
GET    /api/v1/margin_rules          # List all rules
POST   /api/v1/margin_rules          # Create rule
PUT    /api/v1/margin_rules/:id      # Update rule
DELETE /api/v1/margin_rules/:id      # Soft delete rule
GET    /api/v1/margin_rules/resolve  # Resolve margin
CRUD   /api/v1/surcharges            # Surcharge management
CRUD   /api/v1/addon_rates           # Add-on rate management
CRUD   /api/v1/customers             # Customer management
GET    /api/v1/users                 # User list/management
GET    /api/v1/audit_logs            # Audit log viewer

# Notifications
POST   /api/v1/notifications/slack   # Slack webhook proxy
```

## Configuration

- **Design tokens**: `DESIGN.md` at the repo root is the **single source of truth** for colors, typography, spacing, rounding, and motion (Google DESIGN.md spec via `@google/design.md` CLI). `tailwind.config.cjs` is a consumer — when a token changes in `DESIGN.md`, mirror it in the Tailwind config and run `npm run design:diff` to verify. CI hard-fails on drift (`design:lint` is advisory while the CLI is alpha).
- **Path alias**: `@/` -> `src/` (both vite.config.ts and tsconfig.json)
- **Tailwind**: Custom `emax-*` (brand red) and `accent-*` (informational sky) palettes, class-based dark mode. See `DESIGN.md` for rationale and do/don't.
- **Environment**: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SENTRY_DSN`, `VITE_CHANNEL_TALK_PLUGIN_KEY`, `VITE_ENABLE_SENTRY`
- **ENV policy**: `VITE_*` keys are inlined into the client bundle at build time — use only for keys that are safe to expose to browsers (Supabase anon, public DSNs, public SDK keys with referrer/origin restrictions). Server-side secrets (Slack webhooks, EIA API key, admin tokens) MUST live only in the Rails API or Vercel serverless environment variables without the `VITE_` prefix. Slack alerts and EIA jet-fuel requests are already proxied through the Rails backend (`/api/v1/notifications/slack`, `/api/v1/jet_fuel`) — do not re-introduce `VITE_SLACK_WEBHOOK_URL` or `VITE_EIA_API_KEY`.
- **Tariff sync**: Frontend tariff files (`src/config/dhl_tariff.ts`, `ups_tariff.ts`, `fedex_tariff.ts`, `ocs_tariff.ts`) must stay in sync with backend `lib/constants/`. Source of truth: `storage/tariffs/*.pdf`. Backend already matches PDFs — update frontend to match backend when rates change.
- **Market defaults**: `DEFAULT_EXCHANGE_RATE` (하나은행 월요일 09시 송금환율) 과 캐리어별 `DEFAULT_FSC_PERCENT*` 는 `src/config/rates.ts` 에 있다. **현재 수치는 여기 옮겨 적지 않는다** — FSC 는 매주 바뀌어서 문서가 곧 stale 해진다(실제로 2026-07-20 값이 8월 말까지 남아 있었다). 값이 필요하면 파일을 볼 것.
- **FSC 출처**: 견적에 적용되는 요율은 **DB(`fsc_rates`) = Admin FSC 위젯**이다. 2026-08-24부터 프론트(`useCarrierFscDefault`)와 백엔드(`QuoteCalculator#default_fsc_for`)가 모두 DB 를 먼저 읽는다. 그 전에는 양쪽 다 상수만 읽어 **위젯에서 요율을 바꿔도 견적에 반영되지 않았다**(FscFetcher 가 컨트롤러에만 연결돼 있었음).
  - **평시 주간 갱신은 위젯만으로 끝난다 — 배포 불필요.**
  - 코드 상수(`src/config/rates.ts` + `smart-quote-api/lib/constants/rates.rb` + `src/config/fsc-history.ts`)는 **DB 조회 실패·요청 대기 중 폴백**이자 이력 차트 시드다. 세 파일은 항상 같은 값으로 함께 수정하며 `fsc-history.test.ts` 가 시드↔상수 정합을 강제한다(부분 갱신 시 RED).
  - ⚠️ **EMAX 는 per-kg FSC**(`EMAX_FSC_PER_KG`)라 별도 분기이며 DB 퍼센트를 절대 쓰지 않는다. OCS 는 ad-hoc 주기.
  - ⚠️ 사용자가 FSC 칸에 직접 입력한 값은 DB 응답이 늦게 와도 덮이지 않는다. 캐리어를 바꾸면 새 캐리어 기본값으로 초기화된다.
- **FSC history**: `src/config/fsc-history.ts` tracks weekly UPS/DHL/FedEx and ad-hoc OCS FSC rates. Update when rates change.
- **Exchange rate policy**: Live API 자동세팅 비활성화, 매주 월요일 수동 업데이트 (하나은행 기준)
- **Error tracking**: Sentry (`@sentry/browser`) integrated across all catch blocks
- **Node version**: v22.0.0+ required for Vercel production builds

## Testing

- **Frontend**: Vitest + @testing-library/react, jsdom environment, setup in `src/test/setup.ts`
  - Tests use `vitest/globals` (no imports needed for `describe`, `it`, `expect`)
  - 34 test files, 322 tests
- **Backend**: RSpec + FactoryBot + Shoulda Matchers, factories in `spec/factories/`

## Deployment

- **Frontend**: Vercel **goodman-jways** 팀 (production: `smart-quote-emax.vercel.app`) — `origin/main` push 시 **자동배포** (2026-06-13 검증: 정상 작동; sibling smart-quote-main과 달리 Git 재연결 불필요)
  - 수동 fallback: `vercel --prod --scope goodman-jways --yes`. ⚠️ Vercel **MCP(jlinsights 토큰)는 이 프로젝트 접근 불가** — `vercel` CLI(goodman-jways 스코프)로만. 배포 상태: `vercel ls smart-quote-emax --scope goodman-jways --prod`
- **Backend**: Render.com (Singapore region, PostgreSQL) — auto-redeploys from `origin/main` when `smart-quote-api/` changes (monorepo mode via `render.yaml` `rootDir: smart-quote-api`)
- **Config**: `render.yaml` (repo root) for backend infrastructure
- **Seed**: After backend deploy, run `rails runner db/seeds/addon_rates.rb` in Render Shell for new add-on rates

## User Guides

When adding, modifying, or removing user-facing features, **always update the corresponding User Guide**:

- **Admin Guide**: `docs/USER_GUIDE_ADMIN.md` — Admin-only features (margin rules, FSC, surcharges, user/customer management, audit log)
- **Member Guide**: `docs/USER_GUIDE_MEMBER.md` — Member features (dashboard, quote calculator, history, PDF)

Update the "Last Updated" date and version in the guide header when making changes.

## Commit Messages

Always record a one-line Korean description with emoji in `.commit_message.txt` after code changes.
