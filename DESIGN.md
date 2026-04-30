---
name: E-MAX Worldwide Express
colors:
  emax-50: "#fef2f2"
  emax-100: "#fee2e2"
  emax-200: "#fecaca"
  emax-300: "#fca5a5"
  emax-400: "#f87171"
  emax-500: "#ef4444"
  emax-600: "#dc2626"
  emax-700: "#b91c1c"
  emax-800: "#991b1b"
  emax-900: "#7f1d1d"
  emax-950: "#450a0a"
  accent-50: "#f0f9ff"
  accent-100: "#e0f2fe"
  accent-200: "#bae6fd"
  accent-300: "#7dd3fc"
  accent-400: "#38bdf8"
  accent-500: "#0ea5e9"
  accent-600: "#0284c7"
  accent-700: "#0369a1"
  accent-800: "#075985"
  accent-900: "#0c4a6e"
  accent-950: "#082f49"
  gray-50: "#fafafa"
  gray-100: "#f5f5f5"
  gray-200: "#e5e5e5"
  gray-300: "#d4d4d4"
  gray-400: "#a3a3a3"
  gray-500: "#737373"
  gray-600: "#525252"
  gray-700: "#404040"
  gray-800: "#262626"
  gray-900: "#171717"
  gray-950: "#0a0a0a"
  primary: "#dc2626"
  on-primary: "#ffffff"
  primary-container: "#fee2e2"
  on-primary-container: "#7f1d1d"
  secondary: "#0284c7"
  on-secondary: "#ffffff"
  secondary-container: "#e0f2fe"
  on-secondary-container: "#0c4a6e"
  tertiary: "#737373"
  on-tertiary: "#ffffff"
  surface: "#ffffff"
  surface-container: "#fafafa"
  surface-container-high: "#f5f5f5"
  on-surface: "#171717"
  on-surface-variant: "#525252"
  outline: "#d4d4d4"
  outline-variant: "#e5e5e5"
  background: "#ffffff"
  on-background: "#171717"
  error: "#b91c1c"
  on-error: "#ffffff"
  error-container: "#fee2e2"
  on-error-container: "#7f1d1d"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: "700"
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: "600"
    lineHeight: 1.2
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: "600"
    lineHeight: 1.3
  headline-sm:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: "600"
    lineHeight: 1.4
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: "400"
    lineHeight: 1.6
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: "400"
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: "400"
    lineHeight: 1.5
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: "600"
    lineHeight: 1.4
    letterSpacing: 0.025em
rounded:
  none: "0rem"
  sm: "0.25rem"
  DEFAULT: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  "2xl": "2rem"
  full: "9999px"
spacing:
  unit: "0.25rem"
  container-padding: "1rem"
  section-gap: "2.5rem"
motion:
  duration-fast: "150ms"
  duration-normal: "250ms"
  duration-slow: "400ms"
  ease-out: "cubic-bezier(0.16, 1, 0.3, 1)"
  ease-in-out: "cubic-bezier(0.65, 0, 0.35, 1)"
---

# E-MAX Worldwide Express — Design System

This document is the **single source of truth** for visual identity. Tokens live in the YAML front matter above; prose below explains the intent. Tailwind config (`tailwind.config.cjs`) is a *consumer* of these tokens — when a token changes here, Tailwind must be updated to match (or regenerated automatically via `npm run design:export` in a future phase).

## Brand Voice

E-MAX Worldwide Express is a logistics quoting tool for international shipping (UPS, DHL, FedEx, EMAX). The tone is **operational, precise, and fast** — not decorative. Operators need to read a quote in under 10 seconds and trust the number. Visual treatments must never obscure the number.

- **Confident without flashy** — the red identity reads as "urgent, decisive" rather than "alarming".
- **Dense over airy** — operators look at many numbers at once; spacing is generous enough to be legible but not wasteful.
- **Neutral chrome** — containers, borders, and secondary labels stay grayscale so the data and the brand red can lead.

## Color Rationale

The brand red **`emax-600` (`#dc2626`)** maps to `primary`. It is the "E-MAX" in E-MAX Worldwide Express. Every primary CTA, the main header accent, and the hover state of navigation use this exact token.

| Role | Token | Tailwind class | When to use |
|------|-------|----------------|-------------|
| `primary` | `#dc2626` | `bg-emax-600`, `text-emax-600` | The single most important CTA on a screen |
| `on-primary` | `#ffffff` | `text-white` (on emax-600) | Label on primary CTA |
| `primary-container` | `#fee2e2` | `bg-emax-100` | Subtle primary background (banners, selected rows) |
| `on-primary-container` | `#7f1d1d` | `text-emax-900` | Readable text on primary-container |
| `secondary` | `#0284c7` | `bg-accent-600` | Secondary actions, info banners |
| `tertiary` | `#737373` | `text-gray-500` | Metadata, timestamps, low-emphasis labels |
| `surface-container` | `#fafafa` | `bg-gray-50` | Card backgrounds |
| `outline` | `#d4d4d4` | `border-gray-300` | Default borders |
| `error` | `#b91c1c` | `text-red-700` | Validation errors, destructive hints |

**Why red?** The carrier rate card that sits at the center of the product is essentially a risk decision — shipment value vs. carrier list price. Operators expect the brand itself to feel like "money is moving". Red is deliberately uncomfortable in the right way.

**Why a single accent?** `accent-*` (Tailwind sky/blue scale) is reserved for **informational** surfaces (jet fuel chart, exchange rate widget, weather). It must never compete with `primary` for the user's eye. There is no tertiary brand color by design.

## Typography

- **Single family**: Inter, loaded via system or CDN. We do not ship Inter in the bundle.
- **Fallback**: system sans (see `tailwind.config.cjs`).
- **Numerals**: `font-variant-numeric: tabular-nums` wherever currency, weight, or zone codes are displayed. This is enforced in per-component Tailwind classes, not in the base token.
- **Korean rendering**: PDF exports (not web UI) use Noto Sans KR via `src/lib/pdfFontLoader.ts`. Web UI relies on Inter's Latin + the OS's Korean fallback.

### Scale usage

| Token | Use |
|-------|-----|
| `display-lg` | Marketing landing hero only |
| `headline-lg` | Page title (one per page) |
| `headline-md` | Section title |
| `headline-sm` | Card/modal title |
| `body-lg` | Primary long-form copy (rarely used — this is not a reading app) |
| `body-md` | **Default** body copy |
| `body-sm` | Dense table rows, metadata |
| `label-sm` | Uppercase-style pill labels, field labels |

## Spacing and Rhythm

Base unit is `0.25rem` (4px). Standard Tailwind `space-*` / `gap-*` / `p-*` utilities apply. Sections on the dashboard use `gap-10` (2.5rem) between top-level blocks; cards use `p-4` to `p-6` depending on density.

## Motion

Animate only compositor-friendly properties: `transform`, `opacity`. Do not animate `width`, `height`, `top`, `left`, `margin`, `border`, `font-size`.

- `duration-fast` (150ms): hover, focus ring
- `duration-normal` (250ms): modal open, tooltip
- `duration-slow` (400ms): page transitions (use sparingly)
- `ease-out`: all directional motion (drawer slide, modal enter)
- `ease-in-out`: cross-fades, carousel swaps

Respect `prefers-reduced-motion: reduce` in the component layer (not enforced by tokens).

## Rounded

Default radius is `0.5rem` (Tailwind `rounded`). Containers holding dense data (tables, rate cards) use the DEFAULT; marketing cards use `lg` or `xl`. `full` only for pills and avatars.

## Do / Don't

1. **Do** use `emax-600` for exactly one CTA per screen. **Don't** fill a dashboard with red buttons — the most important action becomes invisible.
2. **Do** pair `emax-*` backgrounds with `text-white` or `text-emax-900` only. **Don't** put `emax-500` text on a light background — contrast fails WCAG AA.
3. **Do** keep `accent-*` for informational widgets (jet fuel, weather, exchange). **Don't** use accent as a second CTA color.
4. **Do** prefer grayscale chrome (borders, backgrounds, labels) so the data leads. **Don't** decorate neutral surfaces with brand tints.
5. **Do** compose hover/focus/active states with opacity shifts and ring outlines. **Don't** animate color transitions longer than `duration-fast` on interactive elements.
6. **Do** run `npm run design:diff` before committing a Tailwind config change. **Don't** edit `tailwind.config.cjs` without updating this file first.

## Governance

- **Editing**: this file is the authority. If a color/type token must change, edit the YAML above, then update `tailwind.config.cjs`, then run `npm run design:diff` to verify.
- **Lint**: CI runs `npx design.md lint DESIGN.md` using `@google/design.md`. Failures block merge (hard fail in `design:diff`; `design:lint` is advisory while the CLI is alpha).
- **Scope**: only tokens that are consumed in code belong here. Component-level specifics (padding of `<SurchargeTable>`, etc.) stay in the component file.

## References

- Google DESIGN.md spec: <https://github.com/google-labs-code/design.md>
- Tailwind config consumer: `tailwind.config.cjs`
- PDCA plan: `docs/01-plan/features/emax-design-system.plan.md`
- PDCA design: `docs/02-design/features/emax-design-system.design.md`

## Performance & Loading Experience

To maintain the **operational, precise, and fast** brand voice, the application implements:
- **Code Splitting**: Heavy components like `AdminWidgets` and `QuoteHistoryPage` are lazily loaded.
- **On-Demand PDF**: The PDF generation engine (`jspdf`) is only loaded when the "Download PDF" button is clicked, reducing the initial bundle size.
- **Optimized Bundle**: Global utilities and translations are centralized in the main chunk for consistent performance across views.

