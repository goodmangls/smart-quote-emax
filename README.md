# Smart Quote System

<div align="center">
  <img src="/public/goodman-gls-logo.png" alt="Goodman GLS Logo" height="60" />
</div>

<br />

The **Smart Quote System** is a full-stack logistics quoting application for **Goodman GLS** and **J-Ways**. It calculates international shipping costs across multiple carriers (UPS, DHL), including export packing, surcharges, and margin analysis. React frontend with a Rails API backend and mirrored calculation logic.

**Live URL**: [https://bridgelogis.com](https://bridgelogis.com) / [https://smart-quote-main.vercel.app](https://smart-quote-main.vercel.app)

---

## Key Features

### Multi-Carrier Quoting (UPS, DHL)

- **Zone-based pricing**: Config-driven country-to-zone mapping (Z1-Z10 for UPS, Z1-Z8 for DHL) with exact rate tables (0.5-20kg in 0.5kg steps) and range rates (>20kg per-kg)
- **Shared rate lookup**: Common `lookupCarrierRate()` engine for UPS/DHL (exact table -> range table -> fallback)
- **UPS Surge Fee**: Auto-detected for Middle East (KRW 2,004/kg) and Israel (KRW 4,722/kg) destinations, FSC applicable
- **EAS/RAS Auto-Detection**: Postal code-based Extended/Remote Area Surcharge lookup (86 countries, 39,876 zip ranges, binary search O(log n), lazy-loaded)
- **Surcharges**: FSC% fuel surcharge, DB-driven surcharges, manual surge fees, carrier-specific add-ons (UPS: 6 types, DHL: 19 types)
- **Carrier comparison**: Side-by-side cost comparison across all carriers
- **Incoterm Policy**: UPS/DHL/EMAX express shipments use DAP exclusively

### Calculation Pipeline

1. **Item Costs** - Packing dimensions via `applyPackingDimensions()` utility (+10/+10/+15cm), volumetric weight (L x W x H / 5000 for UPS & DHL, /6000 for EMAX), packing material/labor, Special Packing info panel (WOODEN_BOX/SKID/VACUUM with live cost preview)
2. **Carrier Costs** - Config-driven zone lookup -> `lookupCarrierRate()` -> FSC -> UPS Surge Fee (auto) -> EAS/RAS (auto)
3. **Add-on Services** - Auto-detected (AHS, OSP, OWT, DDP, Surge Fee, EAS/RAS) + user-selectable (19 DHL / 6 UPS add-ons)
4. **Margin** - Dynamic margin resolution via `MarginRuleResolver` (priority-based first-match-wins algorithm with 5min cache), admin CRUD management, hardcoded fallback if API unavailable. Revenue = cost / (1 - margin%), rounded up to nearest KRW 100
5. **Warnings** - Low margin (<10%), high volumetric weight, surge charges, collect terms (EXW/FOB), EMAX country support
6. **PDF Output** - Branded PDF with packing type/cost breakdown, carrier add-on details, surcharge info

### Role-Based Access

| Feature | Admin | Member |
|---------|:-----:|:------:|
| Customer Dashboard | O | O |
| Quote Calculator | O | O |
| Carrier Comparison | O | O |
| Margin breakdown visible | O | X |
| Financial settings (Exchange Rate, FSC) | O | X |
| Special Packing options | O | X |
| Weather Widget | O | X |
| Exchange Rate / Calculator Widget | O | X |
| Jet Fuel Widget | O | O |
| Language toggle (i18n) | O | X |
| Currency toggle (KRW/USD) | O | X |
| Flight Schedule | O | X |
| Quote History | O | O |
| PDF Export | O | O |
| Admin Management Panel (collapsible) | O | X |
| Slack notification on save | X | O (auto) |

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
| **Target Margin Rules** | DB-driven margin rule CRUD with priority tiers (P100/P90/P50/P0) |
| **FSC Rate Management** | Track/update DHL & UPS fuel surcharge percentages |
| **Surcharge Management** | Carrier-specific surcharge CRUD |
| **Customer Management** | Customer records with quote count badges |
| **User Management** | Role assignment, company, nationality, network access |
| **Rate Table Viewer** | Read-only carrier rate table reference |
| **Audit Log** | Full audit trail of all admin actions |

### Slack Notifications

When a **Member** saves a quote, a Slack notification is automatically sent to the admin channel with reference number, carrier, destination, billable weight, total quote amount, and margin percentage.

### Internationalization (i18n)

- 4 languages: English, Korean, Chinese, Japanese
- Context-based language switching with localStorage persistence
- 390+ translation keys covering all UI strings

### Quote History & Management

- Save quotes with auto-generated reference numbers (`SQ-YYYY-NNNN`), duplicate detection
- Search, filter by country/date/status, paginated list
- Detail modal with status tracking (Draft -> Sent -> Accepted), CSV export, email, deletion

### Professional Output

- **PDF Generator**: Branded PDF with route, cargo manifest, packing type/cost breakdown, carrier add-on details, surcharge info, compliance warnings, optional reference number

### AI Chat Assistant

- **Smart Quote Assistant**: In-app chatbot powered by Claude API for system usage help and logistics Q&A
- **Logistics knowledge**: Incoterms, customs, HS codes, ULD, common industry terms
- **DAP policy enforcement**: Automatically informs users that UPS/DHL/EMAX shipments require DAP incoterm
- **Rich Interactions**: Markdown rendering support and randomly suggested quick-questions per session
- **Smart Localization**: Auto-detects optimal language (Nationality → System → Timezone → Browser)
- **Role-aware**: Different guides for Admin vs Member users

### Quote Validity Management

- **Validity tracking**: Color-coded expiry indicators (green: >3 days, yellow: 1-3 days, red: expired)
- **Configurable**: `validityDays` field for default quote validity period

### Error Tracking

- **Sentry** integration across all error boundaries and catch blocks for production monitoring

## Tech Stack

| Layer        | Stack                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| **Frontend** | React 19, TypeScript 5.8, Vite 6, Tailwind CSS                               |
| **Backend**  | Rails 8 API-only, Ruby 3.4, PostgreSQL                                       |
| **Testing**  | Vitest + Testing Library (32 files, 1,193 tests), RSpec + FactoryBot (backend) |
| **Deploy**   | Vercel (frontend), Render.com (backend, Docker, Singapore)                   |
| **APIs**     | open.er-api.com (exchange rates), Open-Meteo (weather), Supabase (auth)      |
| **Other**    | jsPDF, Sentry, Lucide React, React Router v7, ChannelTalk                    |

## Project Structure

```
/                              # Frontend
  src/
    api/                       # API clients (apiClient, quoteApi, marginRuleApi, exchangeRateApi, weatherApi, noticeApi)
    types.ts                   # Core TypeScript types & enums
    i18n/translations.ts       # 4-language translation dictionary (en/ko/cn/ja)
    config/                    # Rate tables, business rules, shared utilities
      ups_zones.ts / dhl_zones.ts  # Config-driven zone mappings
      addon-utils.ts             # Shared add-on types, normalizers, fee calculators
      ups_addons.ts / dhl_addons.ts  # Carrier add-on rates + surge fee config
      ups_eas_lookup.ts          # EAS/RAS postal code lookup (binary search, lazy-load)
    contexts/                  # AuthContext, LanguageContext, ThemeContext
    features/
      quote/
        components/            # InputSection, ResultSection, SaveQuoteButton, CarrierComparisonCard
        components/widgets/    # ExchangeRateWidget, WeatherWidget, NoticeWidget, AccountManagerWidget, ExchangeRateCalculatorWidget
        services/              # calculationService.ts, dhlAddonCalculator.ts, upsAddonCalculator.ts
        hooks/                 # useSyncToInput (generic data sync hook)
      history/
        components/            # QuoteHistoryPage, QuoteHistoryTable, QuoteSearchBar, QuotePagination, QuoteDetailModal
      admin/
        components/            # TargetMarginRulesWidget, FscRateWidget, UserManagementWidget, CustomerManagement, AuditLogViewer, RateTableViewer
        components/surcharge/  # SurchargeManagementWidget, SurchargeForm, SurchargeTable
      dashboard/
        components/            # WelcomeBanner, QuoteHistoryCompact, AccountSettingsModal
        hooks/                 # useExchangeRates, usePortWeather, useLogisticsNews, useMarginRules, useResolvedMargin, useFscRates, useSurcharges, useAddonRates
    pages/                     # LandingPage, LoginPage, SignUpPage, CustomerDashboard, QuoteCalculator
      components/              # CalculatorActionBar, AdminWidgets, MobileStickyBottomBar
    components/                # Header, ProtectedRoute, ErrorBoundary, ChannelTalk
    lib/                       # format.ts, pdfService.ts, packing-utils.ts, slackNotification.ts, fetchWithRetry.ts
  public/data/                 # ups_eas_data.json (86 countries, 39,876 zip ranges, lazy-loaded)
smart-quote-api/               # Backend (Rails 8 API)
  app/models/                  # MarginRule, AuditLog, Quote, User, Customer, Surcharge, AddonRate
  app/services/                # QuoteCalculator, QuoteSearcher, QuoteExporter, QuoteSerializer, MarginRuleResolver
    calculators/               # ItemCost, SurgeCost, UpsCost, DhlCost, EmaxCost, DomesticCost, UpsSurgeFee
  app/controllers/api/v1/      # Quotes, MarginRules, Surcharges, AddonRates, Customers, Users, Auth, Fsc, AuditLogs, Notifications, Chat
  lib/constants/               # Tariff tables (synced with frontend)
```

## Getting Started

### Prerequisites

- Node.js (v18+), npm
- Ruby 3.4+, Bundler, PostgreSQL (for backend)

### Frontend

```bash
npm install
npm run dev          # Dev server on http://localhost:5173
npm run build        # Production build (tsc + vite)
npm run lint         # ESLint (--max-warnings 0)
npx vitest run       # Run tests once (32 files, 1,193 tests)
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
| `/dashboard` | CustomerDashboard                | Protected  |
| `/quote`     | QuoteCalculator (isPublic=true)  | Protected  |
| `/admin`     | QuoteCalculator (isPublic=false) | Admin only |
| `/schedule`  | FlightSchedulePage               | Admin only |
| `/guide`     | UserGuidePage                    | Public     |

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

# Authentication
POST   /api/v1/auth/login        # JWT Login
POST   /api/v1/auth/register     # Account creation
PUT    /api/v1/auth/password     # Change Password

# Admin Configuration
GET    /api/v1/fsc/rates         # View Fuel Surcharges
POST   /api/v1/fsc/update        # Update FSC rates
CRUD   /api/v1/margin_rules      # Margin rule management + GET resolve
CRUD   /api/v1/surcharges        # Surcharge management
CRUD   /api/v1/addon_rates       # Add-on rate management
CRUD   /api/v1/customers         # Customer management
GET    /api/v1/users             # User management
GET    /api/v1/audit_logs        # Audit log viewer

# Notifications
POST   /api/v1/notifications/slack  # Slack webhook proxy
```

## Environment Variables

| Variable                 | Purpose              | Default                 |
| ------------------------ | -------------------- | ----------------------- |
| `VITE_API_URL`           | Backend API base URL | `http://localhost:3000` |
| `VITE_SUPABASE_URL`      | Supabase project URL | -                       |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key    | -                       |
| `VITE_EIA_API_KEY`       | US EIA API key       | -                       |

## Documentation

| Document | Description |
|----------|-------------|
| [Admin User Guide](docs/USER_GUIDE_ADMIN.md) | Complete guide for Admin users |
| [Member User Guide](docs/USER_GUIDE_MEMBER.md) | Complete guide for Member users |
| [CLAUDE.md](CLAUDE.md) | AI assistant project context |

---

## Internal Use Only

This system contains proprietary rate tables and logic for Goodman GLS / J-Ways internal operations.
