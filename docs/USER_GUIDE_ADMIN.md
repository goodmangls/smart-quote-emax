# Smart Quote System - Admin User Guide

> **Goodman GLS & J-Ways** Internal Logistics Quoting System
>
> Version 3.1 | Last Updated: 2026-03-17

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard (Shared with Member)](#2-dashboard)
3. [Admin Quote Calculator](#3-admin-quote-calculator)
4. [Margin Management](#4-margin-management)
5. [FSC Rate Management](#5-fsc-rate-management)
6. [Surcharge Management](#6-surcharge-management)
7. [Customer Management](#7-customer-management)
8. [User Management](#8-user-management)
9. [Rate Table Viewer](#9-rate-table-viewer)
10. [Audit Log](#10-audit-log)
11. [Quote History & Operations](#11-quote-history--operations)
12. [Slack Notifications](#12-slack-notifications)
13. [Account & Settings](#13-account--settings)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Getting Started

### Admin Login

1. Navigate to `/login`
2. Sign in with your admin credentials
3. You will see the **Admin** link in the header navigation

### Admin vs Member Access

| Feature | Admin | Member |
|---------|:-----:|:------:|
| Dashboard widgets | O | O |
| Quote calculator | O | O |
| Margin breakdown visible | O | X |
| Margin slider control | O | X |
| Quote history | O | O |
| PDF export | O | O |
| **Admin widgets panel** | **O** | **X** |
| Margin rules CRUD | O | X |
| FSC rate management | O | X |
| Surcharge management | O | X |
| Customer management | O | X |
| User management | O | X |
| Rate table viewer | O | X |
| Audit log viewer | O | X |
| Slack notification on save | X | O (auto) |

---

## 2. Dashboard

Same as Member dashboard. See [Member User Guide](USER_GUIDE_MEMBER.md#2-dashboard) for widget details.

---

## 3. Admin Quote Calculator

Access via `/admin` (header **Admin** link).

### Key Differences from Member View

1. **Margin Breakdown Visible**: Full cost breakdown including margin percentage, cost amount, and profit
2. **Margin Slider**: Manually adjust target margin percentage at any time
3. **Admin Widgets Panel**: Additional management widgets below the calculator (see sections 4-10)
4. **No Slack Notification**: Admin saves do not trigger Slack alerts

### Calculation Pipeline (Full Visibility)

```
Item Costs → Carrier Costs → FSC → Margin → Final Quote
```

| Stage | Details |
|-------|---------|
| Item Costs | Packing dimensions, volumetric weight, material/labor |
| Carrier Costs | Zone lookup → rate table → billable weight pricing |
| FSC | Fuel surcharge % applied to carrier cost |
| Carrier Add-Ons | Auto-detected surcharges (Surge Fee, EAS/RAS, AHS) + manual add-ons |
| Margin | `revenue = cost / (1 - margin%)`, rounded up to nearest KRW 100 |
| Warnings | Low margin (<10%), surcharges, collect terms |

### Special Packing Info Panel

When selecting **WOODEN_BOX**, **SKID**, or **VACUUM** packing type, a detailed info panel displays:

| Detail | Description |
|--------|-------------|
| Material Cost | Surface area × ₩15,000/m² |
| Labor Cost | ₩50,000/box standard, ₩75,000 for vacuum (×1.5) |
| Fumigation Fee | ₩30,000 fixed per shipment |
| Dimension Impact | +10 (W) / +10 (L) / +15 (H) cm |
| Weight Impact | Actual weight × 1.1 + 10 kg |
| Estimated Total | Live preview based on current cargo inputs |

> If the cargo triggers AHS (Additional Handling Surcharge), a warning is shown in the panel.

### UPS Surge Fee Auto-Detection

For **Middle East and Israel** destinations, UPS Surge Fee is automatically calculated:

| Region | Rate |
|--------|------|
| Israel (IL) | KRW 4,722/kg + FSC |
| Middle East (15 countries) | KRW 2,004/kg + FSC |

The surge fee appears as a carrier add-on (code: **SGF**) and is included in the carrier cost automatically.

### EAS/RAS Postal Code Auto-Detection

When a destination ZIP code is entered, the system checks against **86 countries and 39,876 postal code ranges**:

- Detects **Extended Area (EAS)**, **Remote Area (RAS)**, or **Delivery Area (DAS)** surcharges
- Shows an orange banner with a one-click **Apply** button
- Maps to **RMT** (Remote) or **EXT** (Extended) add-on codes

### DHL Add-On Services (Expanded)

Six new selectable DHL add-ons are available:

| Code | Name | Amount |
|------|------|--------|
| EMG | Emergency Situation Surcharge | Variable |
| TSD | Trade Sanctions Delivery | ₩50,000 |
| NSC | Non-Stackable Cargo | ₩440,000 |
| MWB | Manual Waybill Entry | ₩15,000 |
| LBI | Lithium Ion Battery | ₩10,000 |
| LBM | Lithium Metal Battery | ₩10,000 |

### Incoterm Policy

> **Note**: UPS/DHL/EMAX express shipments use **DAP only** — no exceptions.

---

## 4. Margin Management

### Target Margin Rules Widget

Located in the admin widgets panel. Manages DB-driven margin rules that auto-resolve for each quote.

### Priority Tiers

| Priority | Type | Description |
|----------|------|-------------|
| **P100** | Per-User Flat | Fixed margin % for a specific user (by email) |
| **P90** | Per-User Weight-Based | Weight-range margin for a specific user |
| **P50** | Nationality | Margin by user nationality (e.g., KR, JP, US) |
| **P0** | Default | Fallback margin when no other rule matches |

Resolution uses **first-match-wins** algorithm with 5-minute cache.

### CRUD Operations

- **Add Rule**: Click **+ Add Rule**, fill in name, type, priority, match criteria, and margin %
- **Edit Rule**: Click the edit icon on any rule row
- **Delete Rule**: Click delete icon → soft delete with confirmation dialog
- **Refresh**: Manual refresh button to clear cache and reload rules

### Manual Override

Even with auto-resolved margins, you can always adjust the margin slider manually for any individual quote.

---

## 5. FSC Rate Management

### FSC Rate Widget

Displays current fuel surcharge percentages tracked for UPS and DHL.

| Field | Description |
|-------|-------------|
| UPS International FSC | Current UPS fuel surcharge % |
| DHL International FSC | Current DHL fuel surcharge % |
| External Links | Direct links to UPS/DHL official surcharge pages for verification |

### Update FSC

1. Click the **Update** button
2. Enter the new FSC percentage
3. The rate is applied globally to all new calculations

> FSC rates are auto-fetched when the quote calculator loads. Manual updates override the auto-fetched values.

---

## 6. Surcharge Management

### Surcharge Management Widget

Full CRUD for carrier-specific surcharges.

### Fields

| Field | Description |
|-------|-------------|
| Code | Unique surcharge code (e.g., `UPS_AHS`) |
| Name / Name (KO) | English and Korean surcharge names |
| Carrier | UPS, DHL, or ALL |
| Charge Type | Per-shipment, per-piece, or percentage |
| Amount | Surcharge amount in KRW or % |
| Active | Enable/disable toggle |

### Sub-Components

- **Surcharge Table**: View all surcharges with edit/delete actions
- **Surcharge Form**: Add or edit surcharge details
- **Carrier Links**: Quick links to official UPS/DHL surcharge reference pages
- **Notice**: Warning about manual surcharge update requirements

---

## 7. Customer Management

### Features

| Feature | Description |
|---------|-------------|
| Customer List | View all registered customers with company, contact, email |
| Add Customer | Create new customer record |
| Edit Customer | Update customer details inline |
| Delete Customer | Remove customer with confirmation |
| Quote Count | Badge showing number of quotes per customer |
| Link to Quotes | Click to filter quote history by customer |

### Customer Fields

Company Name, Contact Name, Email, Phone, Country, Address, Notes

---

## 8. User Management

### Features

| Feature | Description |
|---------|-------------|
| User List | All registered users with role, company, nationality |
| Edit User | Change role, company, nationality, networks |
| Role Assignment | `admin` or `member` |
| Network Assignment | Assign carrier network access |

### Role Badges

- **Admin**: Red badge
- **Member**: Blue badge

---

## 9. Rate Table Viewer

Read-only viewer for carrier rate tables.

| Table | Description |
|-------|-------------|
| UPS Tariff | Z1-Z10 zone rates, weight tiers 0.5-70kg |
| DHL Tariff | Z1-Z8 zone rates, weight tiers 0.5-70kg |
| EMAX Tariff | Per-country rates (CN, VN) |

Use this to verify rate accuracy and compare carrier pricing.

---

## 10. Audit Log

### Audit Log Viewer

Tracks all administrative actions for compliance and debugging.

### Tracked Actions

- Quote saved/deleted/exported
- Margin rule created/updated/deleted
- FSC rate updated
- Surcharge created/updated/deleted
- Customer created/updated/deleted
- User role changed

### Filters

| Filter | Description |
|--------|-------------|
| Search | Free text search across all fields |
| Action Type | Filter by specific action |
| User | Filter by admin user |
| Date Range | Filter by time period |

---

## 11. Quote History & Operations

### Full History Access

Same as Member with additional capabilities:

| Feature | Admin Extra |
|---------|------------|
| View all users' quotes | O (Members see only their own) |
| Status change | Update quote status (Draft → Sent → Accepted) |
| Bulk CSV export | Export with all fields including margin data |
| Delete quotes | Remove quotes with audit trail |
| Email quotes | Send quote details to customers |

### Reference Numbers

Format: `SQ-YYYY-NNNN` (e.g., `SQ-2026-0042`)

### Quote Validity Visual

Color-coded expiry indicators on each quote:

| Color | Meaning |
|-------|---------|
| 🟢 Green | More than 3 days remaining |
| 🟡 Yellow/Amber | 1–3 days remaining |
| 🔴 Red | Expired |

### Status Flow

```
Draft → Sent → Accepted
              → Expired (auto after validity period)
```

---

## 12. Slack Notifications

### How It Works

When a **Member** saves a quote, a Slack notification is automatically sent to the admin channel.

### Notification Data

| Field | Content |
|-------|---------|
| Reference No | SQ-YYYY-NNNN |
| Member | Company / Name / Email |
| Carrier | UPS, DHL, or EMAX |
| Destination | Country name |
| Billable Weight | Applied weight |
| Total Quote | KRW and USD amounts |
| Margin | Profit margin % |

### Conditions

- Only **Member** role triggers notifications (not Admin)
- Only **first save** (not duplicate saves)
- Best-effort delivery (failures don't block the save)

---

## 13. Account & Settings

### Change Password

1. Click gear icon in header
2. Enter current → new → confirm password
3. Minimum 6 characters

### Theme & Language

- Dark/light mode toggle in header
- 4 languages: EN, KO, CN, JA

---

## 14. Troubleshooting

**Q: Margin rules aren't applying to new quotes**
A: Click the refresh button on the Margin Rules widget. Rules are cached for 5 minutes.

**Q: FSC rates seem outdated**
A: Check the external links in the FSC widget to verify current rates, then update manually if needed.

**Q: A member can't access the dashboard**
A: Verify their account exists in User Management and their role is set to `member`.

**Q: Audit log shows unexpected actions**
A: All admin actions are tracked. Check the user filter to identify who performed the action.

**Q: Surcharge stale warning appears on saved quotes**
A: Surcharge rates have changed since the quote was saved. The customer should request a re-quote.

---

*Goodman GLS & J-Ways - Smart Quote System v3.1 (Admin)*
