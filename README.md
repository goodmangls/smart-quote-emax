# E-MAX Smart Quote

<div align="center">
  <img src="/public/icon.svg" alt="E-MAX Logo" height="80" />
</div>

<br />

The **E-MAX Smart Quote** system is a full-stack logistics quoting application for **E-MAX Worldwide Express**. It calculates international shipping costs across multiple carriers (UPS, DHL, FedEx, EMAX, OCS), including export packing, surcharges, and discount analysis. React frontend with a Rails API backend and mirrored calculation logic.

**Live URL**: [https://smart-quote-emax.vercel.app](https://smart-quote-emax.vercel.app)

---

## Key Features

### Multi-Carrier Quoting (UPS, DHL, FedEx, EMAX, OCS)

- **Zone-based pricing**: Config-driven country-to-zone mapping (Z1-Z10 for UPS, Z1-Z8 for DHL, ZA-ZY for FedEx) with exact rate tables (0.5-20.5kg) and range rates (per-kg)
- **Shared rate lookup**: Common `lookupCarrierRate()` engine for all carriers (exact table → range table → fallback)
- **UPS Surge Fee**: Auto-detected for Middle East (KRW 2,004/kg) and Israel (KRW 4,722/kg) destinations, FSC applicable
- **EAS/RAS Auto-Detection**: Postal code-based Extended/Remote Area Surcharge lookup (86 countries, 39,876 zip ranges, binary search O(log n), lazy-loaded)
- **Surcharges**: FSC% fuel surcharge, DB-driven surcharges, manual surge fees, carrier-specific add-ons (UPS: 6 types, DHL: 19 types)
- **Carrier comparison**: Side-by-side cost comparison across all carriers — each column priced with that carrier's own DB FSC, surcharges and add-ons
- **Quote Comparison Page**: Dedicated comparison interface to test 3 different carrier/discount combinations (`/compare`) simultaneously with detailed breakdown tables
- **Incoterm Policy**: UPS/DHL/FedEx/EMAX/OCS express shipments use DAP exclusively
- **E-MAX Vietnam Pricing**: Unified Hanoi-based pricing for all Vietnam routes (KRW 11,000/kg for >20kg)
- **Fair Weight Rounding**: 0.5kg step rounding policy for E-MAX to prevent overcharging


### Calculation Pipeline

1. **Item Costs** - Packing dimensions via `applyPackingDimensions()` utility (+10/+10/+15cm), volumetric weight (L x W x H / 5000 for UPS, DHL, FedEx, OCS, /6000 for EMAX), packing material/labor, Special Packing info panel (WOODEN_BOX/SKID/VACUUM with live cost preview)
2. **Carrier Costs** - Config-driven zone lookup -> `lookupCarrierRate()` -> FSC -> UPS Surge Fee (auto) -> EAS/RAS (auto)
3. **Add-on Services** - Auto-detected (AHS, OSP, OWT, DDP, Surge Fee, EAS/RAS) + user-selectable (19 DHL / 6 UPS add-ons)
4. **Discount** - E-MAX discounts *from the published rate* (it does not add a margin). `DiscountRuleResolver` (priority-based, first-match-wins, default 0% = list price) picks the discount: discounted base = base × (1 − discount%), FSC applies to the discounted base, add-ons are added undiscounted, and the total is rounded up to the nearest KRW 100
5. **Warnings** - High volumetric weight, FedEx minimum chargeable weight, document-rate weight limits, collect terms (EXW/FOB), EMAX/OCS country support
6. **PDF Output** - Branded PDF with packing type/cost breakdown, carrier add-on details, surcharge info, and E-MAX Worldwide Express disclaimers

### Role-Based Access

| Feature | Admin | Member |
|---------|:-----:|:------:|
| Customer Dashboard | O | O |
| Quote Calculator | O | O |
| Carrier Comparison | O | O |
| Financial settings (Exchange Rate, FSC, Discount) | O | X |
| Special Packing options | O | X |
| Weather Widget | O | X |
| Exchange Rate / Calculator Widget | O | X |
| Jet Fuel Widget | O | O |
| Language toggle (i18n) | O | X |
| Currency toggle (KRW/USD) | O | X |
| Quote History | O | O |
| PDF Export | O | O |
| Admin Management Panel (collapsible) | O | X |

### Dashboard & Widgets

- **Customer Dashboard**: Landing page after login with welcome banner, recent quotes, and live widgets
- **Jet Fuel Price Widget**: Real-time USGC Jet Fuel spot prices and trend chart via US EIA API
- **Exchange Rate Widget**: Real-time KRW rates for 6 currencies (USD, EUR, JPY, CNY, GBP, SGD) via open.er-api.com with localStorage caching, stale detection, and live indicator
- **Currency Calculator Widget**: Quick currency conversion tool
- **Weather Widget**: 47 global port & airport weather conditions via Open-Meteo API with paginated carousel and delay alerts
- **Global Header**: Dark mode toggle, account settings modal (i18n toggle: Admin only)
- **Collapsible Admin Widgets**: All 7 admin panels default collapsed with toggle

### Admin Management Panel (Admin only)

| Widget | Purpose |
|--------|---------|
| **Discount Rules** | DB-driven discount rule CRUD with priority tiers (P100/P90/P50/P0) |
| **FSC Rate Management** | Track/update DHL, UPS, FedEx & OCS fuel surcharge percentages |
| **Surcharge Management** | Carrier-specific surcharge CRUD |
| **Customer Management** | Customer records with quote count badges |
| **User Management** | Role assignment and account management |
| **Rate Table Viewer** | Read-only carrier rate table reference |
| **Audit Log** | Full audit trail of all admin actions |

### Internationalization (i18n)

- 4 languages: English, Korean, Chinese, Japanese
- Context-based language switching with localStorage persistence
- Translation dictionary covering all UI strings (`src/i18n/translations.ts`)

### Quote History & Management

- Save quotes with auto-generated reference numbers (`SQ-YYYY-NNNN`); a reference-number collision is retried up to 3 times
- Search, filter by country/date/status, paginated list
- Detail modal with status tracking (Draft -> Sent -> Accepted), CSV export, email, deletion
- **Share links**: Public read-only quote page at `/q/:token`; its fields are pinned by `shared/test-fixtures/shared-quote-contract.json` (checked by both FE and BE tests)

### Professional Output

- **PDF Generator**: Branded PDF with route, cargo manifest, packing type/cost breakdown, carrier add-on details, surcharge info, compliance warnings, optional reference number

### Quote Validity Management

- **Validity tracking**: Color-coded expiry indicators (green: >3 days, yellow: 1-3 days, red: expired)
- **Configurable**: `validityDays` field for default quote validity period

### Security

- **Passwordless login**: Magic-link sign-in (`/auth/verify`); verify is throttled to 20 requests/min per IP
- **Logout revokes the refresh token server-side** — one token id per user, so logging out signs out every device
- **Customer ownership**: Attaching a customer to a quote requires it to be the user's own customer (`422 INVALID_CUSTOMER` otherwise)
- **Security headers** in `vercel.json` (HSTS, nosniff, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy). No CSP yet

### Performance Optimization

- **Code Splitting**: Heavy features like `AdminWidgets` and `QuoteHistoryPage` are split into lazy-loaded chunks using `React.lazy`.
- **On-Demand Loading**: Large libraries (e.g., `jspdf`, `html2canvas`) are loaded via dynamic `import()` only when needed (e.g., clicking "Download PDF").
- **Asset Optimization**: Efficient manual chunking strategy in Vite to balance cache-ability and initial load time.

## Tech Stack

| Layer        | Stack                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| **Frontend** | React 19, TypeScript 5.8, Vite 6, Tailwind CSS (E-MAX Theme)        |
| **Backend**  | Rails 8 API-only, Ruby 3.4, PostgreSQL                                       |
| **Testing**  | Vitest + Testing Library, RSpec + FactoryBot (backend)                       |
| **Deploy**   | Vercel (frontend, auto-deploy on push to `main`), Render.com (backend, Docker, Singapore) |
| **APIs**     | open.er-api.com (exchange rates), Open-Meteo (weather), US EIA (jet fuel, proxied by Rails), Supabase (auth) |
| **Other**    | jsPDF, Sentry, Lucide React, React Router v7, ChannelTalk                    |

## Project Structure

```
/                              # Frontend
  src/
    api/                       # API clients (apiClient, quoteApi, discountRuleApi, shareApi, fscApi, surchargeApi, addonRateApi, customerApi, userApi, auditLogApi, exchangeRateApi, eiaApi, weatherApi, noticeApi)
    types.ts                   # Core TypeScript types & enums
    i18n/translations.ts       # 4-language translation dictionary (en/ko/cn/ja)
    config/                    # Rate tables, business rules, shared utilities
      ups_tariff.ts / dhl_tariff.ts / fedex_tariff.ts / emax_tariff.ts / ocs_tariff.ts  # Carrier rate tables (synced with backend & PDF originals)
      rates.ts                   # Fallback FSC/exchange-rate constants (live FSC comes from the DB)
      fsc-history.ts             # FSC historical rates (chart seed)
      carrier-badge.ts           # Single carrier badge-colour table
      ups_zones.ts / dhl_zones.ts / fedex_zones.ts / ocs_zones.ts  # Config-driven zone mappings
      addon-utils.ts             # Shared add-on types, normalizers, fee calculators
      ups_addons.ts / dhl_addons.ts  # Carrier add-on rates + surge fee config
      ups_eas_lookup.ts          # EAS/RAS postal code lookup (binary search, lazy-load)
    contexts/                  # AuthContext, LanguageContext, ThemeContext
    features/
      quote/
        components/            # InputSection, ResultSection, SaveQuoteButton, CarrierComparisonCard, *AddOnPanel, WarningAlerts
        components/widgets/    # ExchangeRateWidget, WeatherWidget, NoticeWidget, AccountManagerWidget, ExchangeRateCalculatorWidget
        services/              # calculationService.ts, dhlAddonCalculator.ts, upsAddonCalculator.ts
        hooks/                 # useSyncToInput (generic data sync hook)
      history/
        components/            # QuoteHistoryPage, QuoteHistoryTable, QuoteSearchBar, QuotePagination, QuoteDetailModal
      admin/
        components/            # TargetDiscountRulesWidget, FscRateWidget, UserManagementWidget, CustomerManagement, AuditLogViewer, RateTableViewer
        components/surcharge/  # SurchargeManagementWidget, SurchargeForm, SurchargeTable
      dashboard/
        components/            # WelcomeBanner, QuoteHistoryCompact, AccountSettingsModal
        hooks/                 # useExchangeRates, usePortWeather, useLogisticsNews, useJetFuelPrices, useDiscountRules, useResolvedDiscount, useFscRates, useSurcharges, useAddonRates
    pages/                     # LandingPage, LoginPage, SignUpPage, MagicLinkVerifyPage, CustomerDashboard, QuoteCalculator, QuoteComparison, SharedQuotePage, UserGuidePage
      components/              # CalculatorActionBar, AdminWidgets, MobileStickyBottomBar
    components/                # Header, ProtectedRoute, ErrorBoundary, ChannelTalk
    lib/                       # format.ts, pdfService.ts, packing-utils.ts, fetchWithRetry.ts
  public/data/                 # ups_eas_data.json (86 countries, 39,876 zip ranges, lazy-loaded)
smart-quote-api/               # Backend (Rails 8 API)
  app/models/                  # DiscountRule, AuditLog, Quote, User, Customer, Surcharge, AddonRate, FscRate, MagicLinkToken
  app/services/                # QuoteCalculator, QuoteSearcher, QuoteExporter, QuoteSerializer, DiscountRuleResolver
    calculators/               # ItemCost, SurgeCost, UpsCost, DhlCost, EmaxCost, DomesticCost, UpsSurgeFee, OcsCost
  app/controllers/api/v1/      # Quotes, QuoteShares, DiscountRules, Surcharges, AddonRates, Customers, Users, Auth, Fsc, AuditLogs, ExchangeRates, JetFuel, Notices
  lib/constants/               # Tariff tables (synced with frontend src/config/)
                               # Source of truth: storage/tariffs/*.pdf
```

## Getting Started

### Prerequisites

- Node.js (v22.0.0+), npm
- Ruby 3.4+, Bundler, PostgreSQL (for backend)

### Frontend

```bash
npm install
npm run dev          # Dev server on http://localhost:5173
npm run build        # Production build (tsc + vite)
npm run lint         # ESLint (--max-warnings 0)
npx vitest run       # Run tests once
```

### Backend (from `smart-quote-api/`)

```bash
bundle install
bin/rails db:prepare
bin/rails server     # API on http://localhost:3000
bundle exec rspec    # RSpec tests
bin/rubocop          # Ruby linting
```

### Routes

| Route        | Component                        | Access     |
| ------------ | -------------------------------- | ---------- |
| `/`          | LandingPage                      | Public     |
| `/login`     | LoginPage                        | Public     |
| `/signup`    | SignUpPage                       | Public     |
| `/auth/verify` | MagicLinkVerifyPage            | Public     |
| `/dashboard` | CustomerDashboard                | Protected  |
| `/quote`     | QuoteCalculator (isPublic=true)  | Protected  |
| `/admin`     | QuoteCalculator (isPublic=false) | Admin only |
| `/compare`   | QuoteComparison                  | Protected  |
| `/q/:token`  | SharedQuotePage                  | Public     |
| `/guide`     | UserGuidePage (E-MAX Manual)     | Public     |

### API Endpoints

```
# Quotes
POST   /api/v1/quotes/calculate  # Stateless calculation
POST   /api/v1/quotes            # Calculate + save
GET    /api/v1/quotes            # List (page, per_page, q, destination_country, date_from, date_to, status)
GET    /api/v1/quotes/:id        # Detail
PATCH  /api/v1/quotes/:id        # Update status/notes/customer
DELETE /api/v1/quotes/:id        # Delete
GET    /api/v1/quotes/export     # CSV download
POST   /api/v1/quotes/:id/send_email # Email quote
POST   /api/v1/quotes/:quote_id/share # Create share link
GET    /api/v1/shared/:token     # Public shared quote (no auth, fields pinned by contract fixture)

# Authentication
POST   /api/v1/auth/login        # JWT Login
POST   /api/v1/auth/register     # Account creation
GET    /api/v1/auth/me           # Current user
POST   /api/v1/auth/refresh      # Rotate access token (refresh cookie)
POST   /api/v1/auth/logout       # Revoke refresh jti + clear cookie (signs out all devices)
PUT    /api/v1/auth/password     # Change Password
POST   /api/v1/auth/promote      # Promote user role
POST   /api/v1/auth/magic_link        # Request magic link email
POST   /api/v1/auth/magic_link/verify # Verify magic link (20/min/IP throttle)

# Admin Configuration
GET    /api/v1/fsc/rates         # View Fuel Surcharges (DHL/UPS/FedEx/OCS)
POST   /api/v1/fsc/update        # Update global FSC% rates
GET    /api/v1/discount_rules          # List all rules
POST   /api/v1/discount_rules          # Create rule
PUT    /api/v1/discount_rules/:id      # Update rule
DELETE /api/v1/discount_rules/:id      # Soft delete rule
POST   /api/v1/discount_rules/resolve  # Resolve discount (preferred — PII in body)
GET    /api/v1/discount_rules/resolve  # deprecated, kept for compatibility
CRUD   /api/v1/surcharges            # Surcharge management (+ GET resolve)
CRUD   /api/v1/addon_rates           # Add-on rate management (+ GET resolve)
CRUD   /api/v1/customers             # Customer management
GET    /api/v1/users                 # User list/management (+ PATCH/DELETE)
GET    /api/v1/audit_logs            # Audit log viewer

# Dashboard proxies
GET    /api/v1/exchange_rates · /api/v1/jet_fuel · /api/v1/notices/news
```

## Environment Variables

| Variable                 | Purpose              | Default                 |
| ------------------------ | -------------------- | ----------------------- |
| `VITE_API_URL`           | Backend API base URL | `http://localhost:3000` |
| `VITE_SUPABASE_URL`      | Supabase project URL | -                       |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key    | -                       |
| `VITE_SENTRY_DSN` / `VITE_ENABLE_SENTRY` | Sentry error reporting | - |
| `VITE_CHANNEL_TALK_PLUGIN_KEY` | ChannelTalk widget | - |

`VITE_*` values are inlined into the browser bundle — keep server secrets (e.g. the EIA API key) in the Rails API environment only.

## Documentation

| Document | Description |
|----------|-------------|
| [Admin User Guide](docs/USER_GUIDE_ADMIN.md) | Complete guide for Admin users |
| [Member User Guide](docs/USER_GUIDE_MEMBER.md) | Complete guide for Member users |
| [CLAUDE.md](CLAUDE.md) | AI assistant project context |

---

## Internal Use Only

This system contains proprietary rate tables and logic for E-MAX Worldwide Express internal operations.
