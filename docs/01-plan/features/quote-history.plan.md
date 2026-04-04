# Quote History & DB Persistence Planning Document

> **Summary**: Add database persistence to save, browse, and manage quote calculations
>
> **Project**: Smart Quote System (j-ways-smart-quote-system)
> **Version**: 0.0.0
> **Author**: jaehong
> **Date**: 2026-02-14
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

Enable persistent storage of calculated quotes so operators can review past quotes, re-use them as templates, and track quoting history over time. Currently all calculations are ephemeral - once the page refreshes, data is lost.

### 1.2 Background

The Smart Quote system currently operates as a stateless calculator. The Rails 8 API (`smart-quote-api/`) has PostgreSQL configured via Render but has no database models or migrations. All quote calculations are computed on-the-fly and returned without persistence.

Business needs:
- **Audit trail**: Track all quotes generated for compliance and review
- **Re-usability**: Operators frequently quote similar routes; past quotes serve as starting points
- **Analysis**: Management needs visibility into quoting patterns, margins, and volume

### 1.3 Related Documents

- Product Overview: `.agent-os/product/overview.md`
- Roadmap: `.agent-os/product/roadmap.md`
- Architecture Decisions: `.agent-os/product/decisions.md`

---

## 2. Scope

### 2.1 In Scope

- [ ] Database schema design (Quote model with full breakdown)
- [ ] Rails migrations for quotes table
- [ ] Save quote on calculation (auto-save or explicit save)
- [ ] Quote listing API endpoint with pagination
- [ ] Quote detail API endpoint
- [ ] Quote search/filter (by date, destination, amount range)
- [ ] Frontend quote history page
- [ ] Quote detail view with re-calculation option
- [ ] CSV/Excel export of quote history

### 2.2 Out of Scope

- User authentication (Phase 2 - no per-user ownership yet)
- Quote versioning/diff (future enhancement)
- Rate management admin (Phase 3)
- Customer/contact association (Phase 4)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Save calculated quote with all input parameters and results | High | Pending |
| FR-02 | List saved quotes with pagination (20 per page) | High | Pending |
| FR-03 | View quote detail with full cost breakdown | High | Pending |
| FR-04 | Search quotes by destination country, date range, amount | High | Pending |
| FR-05 | Re-calculate from saved quote (load as template) | Medium | Pending |
| FR-06 | Delete individual quotes | Medium | Pending |
| FR-07 | Export quote list to CSV | Medium | Pending |
| FR-08 | Quote reference number auto-generation (e.g., SQ-2026-0001) | Medium | Pending |
| FR-09 | Mark quote as "sent to customer" status tracking | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | Quote list API < 200ms for 1000 records | Rails logs, Render metrics |
| Performance | Save quote < 100ms additional latency | API response time comparison |
| Data Integrity | All numeric values stored as decimal, not float | Schema validation |
| Storage | Support 10,000+ quotes without performance degradation | Load testing |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] All functional requirements FR-01 through FR-07 implemented
- [ ] Rails model with validations and tests
- [ ] API endpoints with request specs
- [ ] Frontend quote history page functional
- [ ] CSV export working
- [ ] Deployed to Render (API) + Vercel (frontend)

### 4.2 Quality Criteria

- [ ] RSpec model + request specs passing
- [ ] Frontend Vitest tests for new components
- [ ] Zero RuboCop violations in new code
- [ ] Database migrations reversible
- [ ] API response matches existing QuoteResult TypeScript type

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Render free-tier PostgreSQL limits (1GB) | Medium | Medium | Monitor storage, implement cleanup for old quotes |
| Schema changes breaking existing API contract | High | Low | Keep existing `/api/v1/quotes/calculate` unchanged, add new endpoints |
| Data precision loss (float vs decimal) | High | Medium | Use `decimal` columns with explicit precision (10,2) for KRW |
| No auth means all quotes visible to everyone | Medium | High | Acceptable for Phase 1 (internal tool), address in Phase 2 |
| Migration on Render free tier may timeout | Low | Low | Keep migrations small and atomic |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | |
| **Dynamic** | Feature-based modules, services layer | Web apps with backend, SaaS MVPs | :white_check_mark: |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Frontend Framework | React (existing) | React 19 + Vite | Already in use, no migration needed |
| Backend Framework | Rails (existing) | Rails 8 API | Already deployed, service object pattern established |
| Database | PostgreSQL (existing) | PostgreSQL via Render | Already provisioned, zero setup |
| API Design | REST / GraphQL | REST (versioned) | Matches existing `/api/v1/` pattern |
| State Management | useState (existing) | React useState + fetch | Keep simple, no global state library needed yet |
| Quote Save Strategy | Auto-save / Explicit save | Explicit save (button) | Avoid saving draft/exploratory calculations |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic

Backend (Rails):
  app/models/quote.rb              # Quote model with validations
  app/controllers/api/v1/quotes_controller.rb  # Extend existing controller
  app/services/quote_calculator.rb  # Existing (unchanged)
  db/migrate/                       # New migration for quotes table

Frontend (React):
  src/features/history/             # New feature module
    components/QuoteHistoryPage.tsx
    components/QuoteHistoryTable.tsx
    components/QuoteSearchBar.tsx
  src/api/quoteApi.ts              # Extend with list/get/delete endpoints
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] ESLint configuration (`.eslintrc.cjs`)
- [x] Prettier configuration (`.prettierrc`)
- [x] TypeScript configuration (`tsconfig.json`)
- [x] RuboCop configuration (`.rubocop.yml` in smart-quote-api)
- [ ] `CLAUDE.md` has coding conventions section (partial)
- [ ] Formal convention document

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | camelCase (TS), snake_case (Ruby) | API response key format (camelCase agreed) | High |
| **Folder structure** | Feature-based (React), service objects (Rails) | History feature follows existing pattern | High |
| **API versioning** | `/api/v1/` | Consistent versioning for new endpoints | High |
| **Error handling** | Basic try/catch (frontend) | Standardize API error responses | Medium |
| **Date format** | Not established | ISO 8601 for API, localized for display | Medium |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `DATABASE_URL` | DB connection | Server (Rails) | Already exists on Render |
| `VITE_API_URL` | API endpoint | Client (React) | Already exists |

### 7.4 Database Schema Preview

```sql
CREATE TABLE quotes (
  id            BIGSERIAL PRIMARY KEY,
  reference_no  VARCHAR(20) NOT NULL UNIQUE,  -- SQ-2026-0001

  -- Input Parameters
  origin_country        VARCHAR(3) NOT NULL DEFAULT 'KR',
  destination_country   VARCHAR(3) NOT NULL,
  destination_zip       VARCHAR(20),
  domestic_region_code  CHAR(1) NOT NULL DEFAULT 'A',
  is_jeju_pickup        BOOLEAN DEFAULT FALSE,
  incoterm              VARCHAR(5) NOT NULL,
  packing_type          VARCHAR(20) NOT NULL DEFAULT 'NONE',
  margin_percent        DECIMAL(5,2) NOT NULL,
  duty_tax_estimate     DECIMAL(12,0) DEFAULT 0,
  exchange_rate         DECIMAL(10,2) NOT NULL,
  fsc_percent           DECIMAL(5,2) NOT NULL,
  manual_domestic_cost  DECIMAL(12,0),
  manual_packing_cost   DECIMAL(12,0),

  -- Cargo Items (JSONB)
  items                 JSONB NOT NULL,

  -- Result Summary
  total_quote_amount    DECIMAL(15,0) NOT NULL,
  total_quote_amount_usd DECIMAL(12,2) NOT NULL,
  total_cost_amount     DECIMAL(15,0) NOT NULL,
  profit_amount         DECIMAL(15,0) NOT NULL,
  profit_margin         DECIMAL(5,2) NOT NULL,
  billable_weight       DECIMAL(10,2) NOT NULL,
  applied_zone          VARCHAR(50),
  domestic_truck_type   VARCHAR(50),

  -- Cost Breakdown (JSONB)
  breakdown             JSONB NOT NULL,
  warnings              JSONB DEFAULT '[]',

  -- Metadata
  status                VARCHAR(20) DEFAULT 'draft',  -- draft, sent, accepted, rejected
  notes                 TEXT,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotes_reference_no ON quotes(reference_no);
CREATE INDEX idx_quotes_destination ON quotes(destination_country);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_quotes_status ON quotes(status);
```

---

## 8. Next Steps

1. [ ] Write design document (`quote-history.design.md`) - `/pdca design quote-history`
2. [ ] Review and approval
3. [ ] Implement Rails migrations and model
4. [ ] Implement API endpoints
5. [ ] Implement frontend history page
6. [ ] Deploy and verify

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-14 | Initial draft | jaehong |
