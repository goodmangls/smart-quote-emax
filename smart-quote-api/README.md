# Smart Quote API

Rails 8 API-only backend for **E-MAX Smart Quote** — calculates international shipping costs for UPS, DHL, FedEx, and EMAX carriers.

**Frontend repo**: `../` (monorepo root)  
**Deploy**: Render.com (Docker, Singapore region)

---

## Tech Stack

- **Ruby** 3.4 / **Rails** 8 API-only
- **PostgreSQL** (Render managed)
- **JWT** authentication
- **RSpec** + FactoryBot

## Prerequisites

- Ruby 3.4+, Bundler
- PostgreSQL

## Setup

```bash
bundle install
bin/rails db:prepare   # create + migrate
bin/rails db:seed      # optional: seed addon rates
```

## Running

```bash
bin/rails server       # API on http://localhost:3000
```

## Testing & Linting

```bash
bundle exec rspec      # RSpec test suite
bin/rubocop            # Ruby style linting
bin/brakeman           # Security scan
```

## Tariff Data

Published carrier rate tables are stored in `storage/tariffs/`:

| File | Description |
|------|-------------|
| `DHL 정가.pdf` / `.txt` | DHL Express Worldwide 2026 정가 |
| `UPS 정가.pdf` / `.txt` | UPS Express Saver 2026 정가 (Eff. 01-Feb-26) |
| `FDX 정가.pdf` / `.txt` | FedEx International Priority 2026 정가 (Eff. 2026.01.05) |

These PDFs are the **source of truth**. Constants in `lib/constants/` must match. Frontend `src/config/` must stay in sync with `lib/constants/`.

## Deployment

Backend deploys to **Render.com** from a separate `smart-quote-api.git` remote.

From the **monorepo root**:

```bash
# Push backend changes
git subtree push --prefix=smart-quote-api api-deploy main
```

After deploy, if new add-on rates were seeded:
```bash
# Run in Render Shell
rails runner db/seeds/addon_rates.rb
```
