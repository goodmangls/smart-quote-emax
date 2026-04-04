# Smart Quote System - Member User Guide

> **Goodman GLS & J-Ways** International Logistics Quoting System
>
> Version 3.1 | Last Updated: 2026-03-17

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Quote Calculator](#3-quote-calculator)
4. [Quote Results](#4-quote-results)
5. [Saving & PDF Export](#5-saving--pdf-export)
6. [Quote History](#6-quote-history)
7. [Account Settings](#7-account-settings)
8. [FAQ](#8-faq)

---

## 1. Getting Started

### Login

1. Navigate to `/login`
2. Enter your email and password
3. Click **Sign In**

> First time? Click **Sign Up** at `/signup` to create an account with your company info and nationality.

### Supported Languages

The system supports **4 languages**: English, Korean, Chinese, Japanese. Toggle via the language selector in the header.

### Dark Mode

Click the theme toggle icon in the header to switch between light and dark mode. Your preference is saved automatically.

---

## 2. Dashboard

After login, you land on the **Customer Dashboard** (`/dashboard`).

### Widgets

| Widget | Description |
|--------|-------------|
| **Welcome Banner** | Personalized greeting with your name and company |
| **Recent Quotes** | Last 5 saved quotes with quick access to details |
| **Weather & Alerts** | Real-time weather at 47 global ports & airports with delay warnings |
| **Logistics News** | Industry news and company announcements |
| **Exchange Rates** | Live KRW-based rates for USD, EUR, JPY, CNY, GBP, SGD with trend indicators |
| **Currency Calculator** | Quick currency conversion tool |

### Navigation

- **New Quote** button navigates to `/quote`
- **View All** link opens full quote history
- Header menu provides access to Dashboard, Quote Calculator, and Account Settings

---

## 3. Quote Calculator

Access via `/quote` from the dashboard or header navigation.

### Step 1: Route & Service

| Field | Description |
|-------|-------------|
| Origin Country | Fixed to South Korea (KR) |
| Destination Country | Select from supported countries |
| Destination ZIP | Optional ZIP/postal code |
| Shipping Mode | Door-to-Door |
| Incoterm | EXW, FOB, CNF, CIF, DAP, DDP |
| Carrier | UPS, DHL, or EMAX |

### Step 2: Cargo Details

For each item, enter:
- **Width / Length / Height** (cm)
- **Weight** (kg)
- **Quantity**

Click **+ Add Item** for multi-piece shipments. The system automatically:
- Adds packing dimensions (+10/+10/+15 cm)
- Calculates volumetric weight (L x W x H / 5000 for UPS & DHL, /6000 for EMAX)
- Applies the greater of actual vs volumetric weight

### Step 3: Packing & Options

| Field | Description |
|-------|-------------|
| Packing Type | None, Wooden Box, Skid, or Vacuum |
| Manual Packing Cost | Override auto-calculated packing cost |
| Manual Surge Cost | Additional surcharge (applied to all carriers) |
| Exchange Rate | Auto-fetched live USD/KRW rate (editable) |
| FSC % | Fuel surcharge percentage (auto-fetched per carrier) |

### Special Packing Info Panel

When selecting **WOODEN_BOX**, **SKID**, or **VACUUM**, a detailed info panel shows:

- **Material cost**: Surface area × ₩15,000/m²
- **Labor cost**: ₩50,000/box (standard), ₩75,000 for vacuum (×1.5)
- **Fumigation fee**: ₩30,000 fixed
- **Dimension/weight impact**: +10/+10/+15 cm, weight ×1.1 + 10 kg
- **Estimated total** based on current cargo inputs
- AHS auto-detect warning if applicable

### Carrier Add-On Panels

- **UPS Add-Ons**: Additional Handling Surcharge (AHS), Large Package, Over Maximum, Surge Fee (auto-detected for Middle East/Israel), etc.
- **DHL Add-Ons**: Non-Stackable, Overweight, Remote Area, Emergency Situation (EMG), Trade Sanctions (TSD), Manual Waybill (MWB), Lithium Battery (LBI/LBM), etc.

### UPS Surge Fee Auto-Detection

For Middle East and Israel destinations, UPS Surge Fee is automatically calculated (Israel: KRW 4,722/kg + FSC; Middle East 15 countries: KRW 2,004/kg + FSC). Shown as carrier add-on code **SGF**.

### EAS/RAS Postal Code Auto-Detection

When entering a destination ZIP code, the system automatically checks against 86 countries and 39,876 postal code ranges to detect Extended Area (EAS), Remote Area (RAS), or Delivery Area (DAS) surcharges. An orange banner appears with a one-click **Apply** button.

### Incoterm Policy

> **Note**: UPS/DHL/EMAX express shipments use **DAP only** — no exceptions.

### Carrier Comparison

A comparison card shows estimated costs across all carriers side-by-side for quick decision-making.

> **Note**: As a Member, the margin breakdown is hidden. You see the final quoted price only.

---

## 4. Quote Results

Results update **instantly** as you change inputs (no submit button needed).

### Key Metrics

| Metric | Description |
|--------|-------------|
| Total Quote Amount | Final price in KRW and USD |
| Billable Weight | Applied weight (actual or volumetric, whichever is greater) |
| Applied Zone | Carrier zone for the destination |
| Carrier | Selected carrier |

### Cost Breakdown

Visual breakdown showing international shipping, packing, surcharges, and domestic pickup costs. Click any amount to toggle between KRW and USD display.

### Warnings

The system alerts you to:
- Surcharge triggers (AHS, large package, over max)
- Collect terms notice (EXW/FOB)
- EMAX country support limitations
- Stale surcharge rates requiring re-quote

---

## 5. Saving & PDF Export

### Save Quote

1. Click the **Save** button in the action bar
2. Optionally add notes
3. The system generates a reference number (e.g., `SQ-2026-0042`)

> When you save a quote, a notification is automatically sent to the admin team via Slack.

### Duplicate Detection

If you attempt to save the same quote inputs twice, a confirmation dialog appears asking if you want to save again.

### PDF Export

1. After calculation, click the **PDF** icon
2. A professionally formatted quotation PDF downloads automatically
3. The PDF includes all quote details, cost breakdown, and company branding
4. **Packing details**: Packing type name (Korean/English) and cost sub-breakdown (material, labor, fumigation)
5. **Carrier add-on details**: All applied add-ons (SGF, EXT, RMT, etc.) with amounts

---

## 6. Quote History

Access via the **History** tab in the quote calculator.

### Features

| Feature | Description |
|---------|-------------|
| **Search** | Search by reference number, destination, or notes |
| **Filter** | Filter by destination country, date range, or status |
| **Sort** | Click column headers to sort |
| **Pagination** | Navigate through pages of results |
| **Detail Modal** | Click any row to view full quote details |
| **CSV Export** | Download filtered results as CSV |
| **Email** | Send quote details via email from the detail modal |
| **Status** | Track quote status (Draft, Sent, Accepted, Expired) |
| **Validity Visual** | Color-coded expiry: green (>3 days), yellow (1–3 days), red (expired) |

---

## 7. Account Settings

Click the gear icon in the header or your profile avatar.

### Change Password

1. Enter current password
2. Enter new password (minimum 6 characters)
3. Confirm new password
4. Click **Change Password**

Press **Escape** to close the settings modal.

---

## 8. FAQ

**Q: Why is my quote amount different from yesterday?**
A: Exchange rates and FSC percentages are fetched live. These values change daily.

**Q: Can I edit a saved quote?**
A: No. Create a new quote with updated parameters instead.

**Q: What does the weather widget "DELAY" status mean?**
A: Severe weather conditions at that port/airport may cause shipping delays.

**Q: Why can't I see the margin percentage?**
A: Margin details are visible to admin users only. Members see the final quoted price.

**Q: How do I change my language?**
A: Click the language selector (globe icon) in the header.

---

*Goodman GLS & J-Ways - Smart Quote System v3.1*
