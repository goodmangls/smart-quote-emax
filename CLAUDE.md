# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Quote System for **Goodman GLS & J-Ways** - an internal logistics quoting tool that calculates international shipping costs across carriers (UPS, DHL, EMAX). React frontend with a Rails API backend, sharing mirrored calculation logic. Includes customer dashboard with live exchange rates, weather, jet fuel prices, notices, and account manager widgets. Role-based access (Admin/Member) with Slack notifications and Sentry error tracking.

## Development Commands

### Frontend (React 19 + TypeScript 5.8 + Vite 6)

```bash
npm run dev          # Dev server on http://localhost:5173
npm run build        # tsc + vite build
npm run lint         # ESLint (--max-warnings 0)
npm run test         # Vitest in watch mode
npx vitest run       # Run tests once (32 files, 1193 tests)
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
    i18n/translations.ts       # 4-language dictionary (en/ko/cn/ja, 390+ keys)
    config/                    # Rate tables, business rules, UI constants
      ups_tariff.ts            # UPS Z1-Z10 rate tables (synced with backend)
      dhl_tariff.ts            # DHL Z1-Z8 rate tables (synced with backend)
      emax_tariff.ts           # EMAX per-country rate tables (CN, VN only)
      rates.ts                 # KRW cost constants, DEFAULT_EXCHANGE_RATE=1450, DEFAULT_FSC_PERCENT=41.75
      business-rules.ts        # Surge thresholds, packing weight buffer/addition
      options.ts               # Country options, carrier options, incoterm options
      addon-utils.ts           # Shared AddonRateLike/NormalizedRate types, calcAddonFee(), findRate()
      ups_zones.ts / dhl_zones.ts  # Config-driven zone mappings (Record<string, ZoneInfo>)
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
        components/            # TargetMarginRulesWidget, FscRateWidget, UserManagementWidget, CustomerManagement, AuditLogViewer, RateTableViewer
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
    margin_rule_resolver.rb    # Priority-based margin resolution (5min cache, first-match-wins)
    calculators/
      item_cost.rb             # Packing dimensions, volumetric weight, material/labor
      surge_cost.rb            # Surcharge logic
      ups_cost.rb / ups_zone.rb
      ups_surge_fee.rb         # UPS Surge Fee auto-calc (Israel/Middle East)
      dhl_cost.rb / dhl_zone.rb
      emax_cost.rb
      domestic_cost.rb         # Domestic pickup cost
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
  lib/constants/               # Tariff tables (ups_tariff.rb, dhl_tariff.rb, emax_tariff.rb)
```

### Routing (src/App.tsx)

```
/              → LandingPage (public)
/login         → LoginPage (public)
/signup        → SignUpPage (public)
/dashboard     → CustomerDashboard (ProtectedRoute)
/quote         → QuoteCalculator isPublic=true (ProtectedRoute)
/admin         → QuoteCalculator isPublic=false (ProtectedRoute requireAdmin)
/schedule      → FlightSchedulePage (ProtectedRoute requireAdmin)
/guide         → UserGuidePage (public)
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

1. **Item Costs** - Packing dimensions (+10/+10/+15cm), volumetric weight (L*W*H / 5000 for UPS & DHL, /6000 for EMAX), packing material/labor, manual surge charges (all carriers)
2. **Carrier Costs** - Zone lookup (country -> zone code), shared `lookupCarrierRate()` engine (exact table 0.5-20kg -> range table >20kg -> fallback), FSC% surcharge
3. **Margin** - Dynamic margin via `MarginRuleResolver` (priority-based: P100 per-user flat > P90 per-user weight > P50 nationality > P0 default), `revenue = cost / (1 - margin%)`, rounded up to nearest KRW 100. Admin can manually override at any time.
4. **Warnings** - Low margin (<10%), high volumetric weight, surge charges, collect terms (EXW/FOB), EMAX country support

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

### Incoterm Policy

UPS/DHL/EMAX express shipments → **DAP only** (no exceptions). AI chatbot enforces this in responses.

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

- **API**: US Energy Information Administration (EIA) via `VITE_EIA_API_KEY`
- **Dashboard**: Real-time USGC Jet Fuel spot prices and trend chart

### NoticeWidget / AccountManagerWidget

- NoticeWidget dynamically fetches real-time logistics news via a Vite proxy / edge function pulling from RSS feeds.
- AccountManagerWidget displays static/mock contact information with a paginated carousel display

### Admin Widgets (visible at /admin only)

- **FscRateWidget**: Tracks live DHL/UPS fuel surcharges with external verification links and manual override
- **TargetMarginRulesWidget**: DB-driven margin rule CRUD, priority-based grouping (P100/P90/P50/P0), inline add/edit, soft delete
- **SurchargeManagementWidget**: Carrier-specific surcharge CRUD (split into SurchargeForm, SurchargeTable, SurchargeCarrierLinks, SurchargeNotice sub-components)
- **CustomerManagement**: Customer CRUD with quote count badges
- **UserManagementWidget**: User role/company/nationality/network management
- **RateTableViewer**: Read-only carrier rate table viewer
- **AuditLogViewer**: All admin actions audit trail with search/filter

## External APIs

| API             | Endpoint                                | Purpose                   |
| --------------- | --------------------------------------- | ------------------------- |
| Rails Backend   | `VITE_API_URL` (default localhost:3000) | Quote CRUD, persistence   |
| open.er-api.com | `/v6/latest/KRW`                        | Exchange rates (KRW base) |
| Open-Meteo      | `api.open-meteo.com/v1/forecast`        | Port/airport weather      |
| US EIA API      | `api.eia.gov/v2/petroleum/pri/spt/data` | USGC Jet Fuel prices      |
| Supabase        | `VITE_SUPABASE_URL`                     | Authentication            |
| Slack Webhook   | `/api/v1/notifications/slack`           | Member quote save alerts  |

## i18n System

- **Languages**: `en | ko | cn | ja` (defined in `src/i18n/translations.ts`)
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
GET    /api/v1/fsc/rates         # View Fuel Surcharges (DHL/UPS)
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

- **Path alias**: `@/` -> `src/` (both vite.config.ts and tsconfig.json)
- **Tailwind**: Custom `jways-*` color palette (blue theme), class-based dark mode
- **Environment**: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_EIA_API_KEY`
- **Tariff sync**: Frontend tariff files in `src/config/` must stay in sync with backend `lib/constants/`
- **Market defaults**: `DEFAULT_EXCHANGE_RATE=1450` (하나은행 월요일 09시 송금환율), `DEFAULT_FSC_PERCENT=41.75` (UPS 2026-03-23) in `src/config/rates.ts`
- **Exchange rate policy**: Live API 자동세팅 비활성화, 매주 월요일 수동 업데이트 (하나은행 기준)
- **Error tracking**: Sentry (`@sentry/browser`) integrated across all catch blocks

## Testing

- **Frontend**: Vitest + @testing-library/react, jsdom environment, setup in `src/test/setup.ts`
  - Tests use `vitest/globals` (no imports needed for `describe`, `it`, `expect`)
  - 32 test files, 1193 tests
- **Backend**: RSpec + FactoryBot + Shoulda Matchers, factories in `spec/factories/`

## Deployment

- **Frontend**: Vercel (production: `bridgelogis.com` / `smart-quote-main.vercel.app`) — auto-deploy on push to `origin/main`
- **Backend**: Render.com (Docker, Singapore region, PostgreSQL) — deploys from separate `smart-quote-api.git` repo
- **Config**: `render.yaml` for backend infrastructure
- **Backend push**: `git subtree push --prefix=smart-quote-api api-deploy main` (required for backend changes)
- **Seed**: After backend deploy, run `rails runner db/seeds/addon_rates.rb` in Render Shell for new add-on rates

## User Guides

When adding, modifying, or removing user-facing features, **always update the corresponding User Guide**:

- **Admin Guide**: `docs/USER_GUIDE_ADMIN.md` — Admin-only features (margin rules, FSC, surcharges, user/customer management, audit log)
- **Member Guide**: `docs/USER_GUIDE_MEMBER.md` — Member features (dashboard, quote calculator, history, PDF)

Update the "Last Updated" date and version in the guide header when making changes.

## Commit Messages

Always record a one-line Korean description with emoji in `.commit_message.txt` after code changes.
