# Quote History & DB Persistence Design Document

> **Summary**: Detailed technical design for saving, listing, searching, and exporting quote calculations
>
> **Project**: Smart Quote System (j-ways-smart-quote-system)
> **Version**: 0.0.0
> **Author**: jaehong
> **Date**: 2026-02-14
> **Status**: Draft
> **Planning Doc**: [quote-history.plan.md](../../01-plan/features/quote-history.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- Add persistence layer to existing stateless calculation API
- Minimal disruption to existing `/api/v1/quotes/calculate` endpoint
- Frontend quote history browsing with search/filter
- CSV export capability for management reporting

### 1.2 Design Principles

- **Backward Compatibility**: Existing calculate endpoint continues to work without saving
- **Separation of Concerns**: Persistence logic separate from calculation logic
- **JSONB for Flexibility**: Store cargo items and breakdown as JSONB to avoid schema rigidity
- **camelCase API**: Maintain existing camelCase JSON response convention

---

## 2. Architecture

### 2.1 Component Diagram

```
┌──────────────────┐     ┌────────────────────────┐     ┌──────────────┐
│   React Frontend │────▶│   Rails 8 API          │────▶│  PostgreSQL  │
│   (Vercel)       │     │   (Render, Singapore)  │     │  (Render)    │
│                  │     │                        │     │              │
│  - QuoteForm     │     │  - QuotesController    │     │  - quotes    │
│  - HistoryPage   │     │  - QuoteCalculator     │     │              │
│  - SearchBar     │     │  - Quote (Model)       │     │              │
└──────────────────┘     └────────────────────────┘     └──────────────┘
```

### 2.2 Data Flow

```
[Calculate Flow - Existing]
  User Input → POST /api/v1/quotes/calculate → QuoteCalculator → JSON Response

[Save Flow - New]
  User clicks "Save" → POST /api/v1/quotes → QuoteCalculator + Quote.create → Saved Quote

[History Flow - New]
  User opens History → GET /api/v1/quotes?page=1&search=US → Quote.search → JSON List

[Re-calculate Flow - New]
  User clicks "Re-quote" → GET /api/v1/quotes/:id → Load input → Pre-fill form
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Quote Model | PostgreSQL | Data persistence |
| QuotesController#create | QuoteCalculator | Calculate before saving |
| QuotesController#index | Quote model | Query and paginate |
| Frontend HistoryPage | quoteApi.ts | Fetch quote list |
| Frontend QuoteForm | quoteApi.ts | Save quote action |

---

## 3. Data Model

### 3.1 Entity Definition

```ruby
# app/models/quote.rb
class Quote < ApplicationRecord
  # Validations
  validates :reference_no, presence: true, uniqueness: true
  validates :destination_country, presence: true
  validates :incoterm, presence: true, inclusion: { in: %w[EXW FOB C&F CIF DAP DDP] }
  validates :packing_type, presence: true, inclusion: { in: %w[NONE WOODEN_BOX SKID VACUUM] }
  validates :margin_percent, presence: true, numericality: { greater_than_or_equal_to: 0, less_than: 100 }
  validates :total_quote_amount, presence: true
  validates :items, presence: true

  # Scopes
  scope :by_destination, ->(country) { where(destination_country: country) if country.present? }
  scope :by_date_range, ->(from, to) { where(created_at: from..to) if from.present? && to.present? }
  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :recent, -> { order(created_at: :desc) }
  scope :search_text, ->(q) { where("reference_no ILIKE ? OR destination_country ILIKE ?", "%#{q}%", "%#{q}%") if q.present? }

  # Reference number generation
  before_validation :generate_reference_no, on: :create

  private

  def generate_reference_no
    return if reference_no.present?
    year = Time.current.year
    last = Quote.where("reference_no LIKE ?", "SQ-#{year}-%").order(:reference_no).last
    seq = last ? last.reference_no.split('-').last.to_i + 1 : 1
    self.reference_no = "SQ-#{year}-#{seq.to_s.rjust(4, '0')}"
  end
end
```

### 3.2 TypeScript Types (Frontend)

```typescript
// src/types/history.ts
export interface QuoteSummary {
  id: number;
  referenceNo: string;
  destinationCountry: string;
  totalQuoteAmount: number;
  totalQuoteAmountUsd: number;
  profitMargin: number;
  billableWeight: number;
  domesticTruckType: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface QuoteListResponse {
  quotes: QuoteSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    perPage: number;
  };
}

export interface QuoteSearchParams {
  page?: number;
  perPage?: number;
  query?: string;
  destinationCountry?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}
```

### 3.3 Database Schema

```sql
CREATE TABLE quotes (
  id            BIGSERIAL PRIMARY KEY,
  reference_no  VARCHAR(20) NOT NULL UNIQUE,

  -- Input Parameters
  origin_country        VARCHAR(3)    NOT NULL DEFAULT 'KR',
  destination_country   VARCHAR(3)    NOT NULL,
  destination_zip       VARCHAR(20),
  domestic_region_code  CHAR(1)       NOT NULL DEFAULT 'A',
  is_jeju_pickup        BOOLEAN       DEFAULT FALSE,
  incoterm              VARCHAR(5)    NOT NULL,
  packing_type          VARCHAR(20)   NOT NULL DEFAULT 'NONE',
  margin_percent        DECIMAL(5,2)  NOT NULL,
  duty_tax_estimate     DECIMAL(12,0) DEFAULT 0,
  exchange_rate         DECIMAL(10,2) NOT NULL,
  fsc_percent           DECIMAL(5,2)  NOT NULL,
  manual_domestic_cost  DECIMAL(12,0),
  manual_packing_cost   DECIMAL(12,0),

  -- Cargo Items (JSONB)
  items                 JSONB NOT NULL,

  -- Result Summary
  total_quote_amount      DECIMAL(15,0) NOT NULL,
  total_quote_amount_usd  DECIMAL(12,2) NOT NULL,
  total_cost_amount       DECIMAL(15,0) NOT NULL,
  profit_amount           DECIMAL(15,0) NOT NULL,
  profit_margin           DECIMAL(5,2)  NOT NULL,
  billable_weight         DECIMAL(10,2) NOT NULL,
  applied_zone            VARCHAR(50),
  domestic_truck_type     VARCHAR(50),

  -- Cost Breakdown (JSONB)
  breakdown             JSONB NOT NULL,
  warnings              JSONB DEFAULT '[]',

  -- Metadata
  status      VARCHAR(20) DEFAULT 'draft',
  notes       TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotes_reference_no    ON quotes(reference_no);
CREATE INDEX idx_quotes_destination     ON quotes(destination_country);
CREATE INDEX idx_quotes_created_at      ON quotes(created_at DESC);
CREATE INDEX idx_quotes_status          ON quotes(status);
```

---

## 4. API Specification

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/v1/quotes/calculate | Calculate quote (existing, unchanged) | None |
| POST | /api/v1/quotes | Calculate + Save quote | None (Phase 1) |
| GET | /api/v1/quotes | List saved quotes (paginated) | None (Phase 1) |
| GET | /api/v1/quotes/:id | Get quote detail | None (Phase 1) |
| DELETE | /api/v1/quotes/:id | Delete quote | None (Phase 1) |
| GET | /api/v1/quotes/export.csv | Export quotes as CSV | None (Phase 1) |

### 4.2 Detailed Specification

#### `POST /api/v1/quotes` (Save Quote)

**Request:** Same as existing `QuoteInput` type
```json
{
  "originCountry": "KR",
  "destinationCountry": "US",
  "destinationZip": "90001",
  "domesticRegionCode": "A",
  "isJejuPickup": false,
  "incoterm": "DAP",
  "packingType": "NONE",
  "items": [{ "id": "1", "width": 40, "length": 50, "height": 40, "weight": 15, "quantity": 1 }],
  "marginPercent": 15,
  "dutyTaxEstimate": 0,
  "exchangeRate": 1430,
  "fscPercent": 30.25,
  "notes": "Optional note"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "referenceNo": "SQ-2026-0001",
  "status": "draft",
  "createdAt": "2026-02-14T10:30:00Z",
  "totalQuoteAmount": 580000,
  "totalQuoteAmountUSD": 405.59,
  "totalCostAmount": 493000,
  "profitAmount": 87000,
  "profitMargin": 15,
  "billableWeight": 15,
  "appliedZone": "North America",
  "domesticTruckType": "Parcel/Small",
  "warnings": [],
  "breakdown": { ... }
}
```

#### `GET /api/v1/quotes` (List Quotes)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | integer | 1 | Page number |
| per_page | integer | 20 | Items per page (max 100) |
| q | string | - | Search by reference_no or destination |
| destination_country | string | - | Filter by country code |
| date_from | string | - | ISO date (YYYY-MM-DD) |
| date_to | string | - | ISO date (YYYY-MM-DD) |
| status | string | - | Filter by status |

**Response (200 OK):**
```json
{
  "quotes": [
    {
      "id": 1,
      "referenceNo": "SQ-2026-0001",
      "destinationCountry": "US",
      "totalQuoteAmount": 580000,
      "totalQuoteAmountUsd": 405.59,
      "profitMargin": 15,
      "billableWeight": 15,
      "domesticTruckType": "Parcel/Small",
      "status": "draft",
      "createdAt": "2026-02-14T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 100,
    "perPage": 20
  }
}
```

#### `GET /api/v1/quotes/:id` (Quote Detail)

**Response (200 OK):** Full quote with all input params, result, breakdown, items

#### `DELETE /api/v1/quotes/:id`

**Response (204 No Content)**

#### `GET /api/v1/quotes/export.csv`

Same query params as list. Returns CSV with headers:
```
Reference No,Date,Destination,Incoterm,Billable Weight,Total Cost (KRW),Quote Amount (KRW),Quote Amount (USD),Margin %,Status
```

---

## 5. UI/UX Design

### 5.1 Navigation Update

```
┌─────────────────────────────────────────────────────────┐
│  Header: [Logo] [Quote Calculator] [Quote History] [⚙]  │
└─────────────────────────────────────────────────────────┘
```

Add tab/navigation to switch between Calculator and History views.

### 5.2 Quote History Page Layout

```
┌──────────────────────────────────────────────────────────┐
│  Quote History                              [Export CSV]  │
├──────────────────────────────────────────────────────────┤
│  🔍 [Search...] [Country ▼] [Date From] [Date To] [Go]  │
├──────────────────────────────────────────────────────────┤
│  Ref No     │ Dest │ Amount(KRW) │ Margin │ Date │ Act  │
│─────────────│──────│─────────────│────────│──────│──────│
│  SQ-2026-01 │  US  │  ₩580,000  │  15%   │ 2/14 │ 👁🗑│
│  SQ-2026-02 │  JP  │  ₩320,000  │  12%   │ 2/14 │ 👁🗑│
│  SQ-2026-03 │  DE  │  ₩890,000  │  18%   │ 2/13 │ 👁🗑│
├──────────────────────────────────────────────────────────┤
│  [< Prev]  Page 1 of 5  [Next >]                        │
└──────────────────────────────────────────────────────────┘
```

### 5.3 Save Button on Calculator

```
┌──────────────────────────────────────┐
│  Result Section (existing)           │
│  ...                                 │
│  [📥 Download PDF] [💾 Save Quote]   │
└──────────────────────────────────────┘
```

### 5.4 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| QuoteHistoryPage | `src/features/history/components/QuoteHistoryPage.tsx` | Main history page container |
| QuoteHistoryTable | `src/features/history/components/QuoteHistoryTable.tsx` | Table with quote rows |
| QuoteSearchBar | `src/features/history/components/QuoteSearchBar.tsx` | Search/filter controls |
| QuotePagination | `src/features/history/components/QuotePagination.tsx` | Pagination controls |
| SaveQuoteButton | `src/features/quote/components/SaveQuoteButton.tsx` | Save button in result section |
| NavigationTabs | `src/components/layout/NavigationTabs.tsx` | Calculator/History tab switch |

---

## 6. Error Handling

### 6.1 Error Code Definition

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 400 | Invalid quote data | Missing required fields | Show validation errors |
| 404 | Quote not found | Invalid ID | Show "not found" message |
| 422 | Unprocessable entity | Business rule violation | Show specific error |
| 500 | Internal error | Server/DB error | Show retry message |

### 6.2 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Destination country is required",
    "details": { "field": "destinationCountry" }
  }
}
```

---

## 7. Security Considerations

- [x] Input validation via Rails strong parameters + model validations
- [ ] Authentication (Phase 2 - not in scope)
- [x] SQL injection prevention (ActiveRecord parameterized queries)
- [x] CORS configured (rack-cors already in place)
- [ ] Rate limiting (consider for future, low risk for internal tool)
- [x] HTTPS enforced (Render default)

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Model Test | Quote validations, scopes, reference_no generation | RSpec |
| Request Test | All API endpoints (CRUD + CSV export) | RSpec |
| Frontend Unit | HistoryPage, SearchBar, Pagination | Vitest |
| Manual Test | Full flow: calculate → save → list → view → delete | Browser |

### 8.2 Test Cases (Key)

- [ ] Save quote generates unique reference_no (SQ-YYYY-NNNN)
- [ ] List returns paginated results with correct metadata
- [ ] Search by reference_no and destination country works
- [ ] Date range filter works correctly
- [ ] CSV export includes all visible columns
- [ ] Delete removes quote and returns 204
- [ ] Re-quote loads saved input into calculator form
- [ ] Concurrent saves don't generate duplicate reference_nos

---

## 9. Rails Controller Design

```ruby
# app/controllers/api/v1/quotes_controller.rb
module Api
  module V1
    class QuotesController < ApplicationController
      # POST /api/v1/quotes/calculate (existing - unchanged)
      def calculate
        input = params.permit!.to_h.except(:controller, :action, :format)
        result = QuoteCalculator.call(input)
        render json: result
      end

      # POST /api/v1/quotes (new - calculate + save)
      def create
        input = params.permit!.to_h.except(:controller, :action, :format)
        result = QuoteCalculator.call(input)

        quote = Quote.new(
          **quote_input_params(input),
          **quote_result_params(result),
          items: input[:items],
          breakdown: result[:breakdown],
          warnings: result[:warnings]
        )

        if quote.save
          render json: quote_response(quote, result), status: :created
        else
          render json: { error: { code: 'VALIDATION_ERROR', message: quote.errors.full_messages.join(', ') } }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/quotes
      def index
        quotes = Quote.recent
                      .search_text(params[:q])
                      .by_destination(params[:destination_country])
                      .by_date_range(params[:date_from], params[:date_to])
                      .by_status(params[:status])
                      .page(params[:page] || 1)
                      .per(params[:per_page] || 20)

        render json: {
          quotes: quotes.map { |q| quote_summary(q) },
          pagination: pagination_meta(quotes)
        }
      end

      # GET /api/v1/quotes/:id
      def show
        quote = Quote.find(params[:id])
        render json: quote_detail(quote)
      end

      # DELETE /api/v1/quotes/:id
      def destroy
        Quote.find(params[:id]).destroy
        head :no_content
      end

      # GET /api/v1/quotes/export.csv
      def export
        # CSV generation logic
      end
    end
  end
end
```

**Pagination**: Use `kaminari` gem for `.page().per()` support.

---

## 10. Implementation Order

### Phase 1: Backend Foundation
1. [ ] Add `kaminari` gem to Gemfile
2. [ ] Generate Quote model + migration
3. [ ] Write model validations and scopes
4. [ ] Write RSpec model tests
5. [ ] Update routes (add CRUD + export)

### Phase 2: API Endpoints
6. [ ] Implement `create` action (calculate + save)
7. [ ] Implement `index` action with pagination/search
8. [ ] Implement `show` action
9. [ ] Implement `destroy` action
10. [ ] Implement `export` action (CSV)
11. [ ] Write RSpec request tests

### Phase 3: Frontend - API Client
12. [ ] Add TypeScript types (`src/types/history.ts`)
13. [ ] Extend `quoteApi.ts` with CRUD + export methods
14. [ ] Add `saveQuote()`, `listQuotes()`, `getQuote()`, `deleteQuote()`, `exportCsv()`

### Phase 4: Frontend - UI Components
15. [ ] Create `NavigationTabs` component
16. [ ] Create `QuoteHistoryPage` container
17. [ ] Create `QuoteSearchBar` component
18. [ ] Create `QuoteHistoryTable` component
19. [ ] Create `QuotePagination` component
20. [ ] Add `SaveQuoteButton` to result section
21. [ ] Update `App.tsx` with routing/tabs

### Phase 5: Testing & Deploy
22. [ ] Frontend Vitest tests for new components
23. [ ] Manual E2E testing
24. [ ] Deploy Rails migration to Render
25. [ ] Deploy frontend to Vercel

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-14 | Initial draft | jaehong |
