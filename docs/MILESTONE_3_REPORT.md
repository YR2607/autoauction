# Milestone 3 — Premium UX/UI Redesign — Report

Branch: `design/milestone-3-premium-ux` (based on `fix/draft-auction-reservation-guards`,
which is not yet merged into `main`).

Audit document: `docs/MILESTONE_3_UX_AUDIT.md`.

## Design system (foundation)

- **Tokens** (`src/app/globals.css`): palette per spec — Graphite `#111827`, Primary `#2563EB`,
  background `#F3F5F8`, secondary text `#6B7280`, semantic success/warning/danger.
  Extended with shadow scale (`--shadow-xs/sm/card/lift/pop`), radius, motion utilities
  (`anim-fade`, `anim-pop`, `anim-drawer` — all disabled under `prefers-reduced-motion`),
  `.tnum` (tabular numerals for prices/countdowns), `.scroll-thin`.
- **Typography**: Manrope (display/headings) + Inter (body/UI), tabular numerals on all
  money/time values.
- **New primitives** (`src/components/ui/`): `chip.tsx` (FilterChip), `drawer.tsx`
  (mobile slide-over), `breadcrumb.tsx`, `toast.tsx` (+ ToastProvider in root layout),
  `tabs.tsx`. `Button` gained `loading` state + `IconButton`; `EmptyState` redesigned
  with icon support.

## Public website

- **Header**: extracted client `nav-links.tsx` with active-state pills; mobile menu
  close button fixed.
- **Footer**: dark graphite block — navigation, how-it-works, contact, supported
  currencies, legal links; new `/legal/[slug]` pages so no dead links.
- **Homepage**: dark photographic hero (real seed imagery), trust strip, live auctions,
  Buy Now section, featured vehicles, popular makes, 4-step How It Works.
- **Catalog**: `CatalogLayout` — sticky filter sidebar (desktop) + `Drawer` (mobile),
  `CatalogToolbar` with result count, removable filter chips, Clear All, and a
  dedicated sort control (newest / price / ending soon / highest bid).
- **Vehicle card**: clearer price hierarchy (tabular numerals), sale-type badges,
  hover lift, favorite button with a11y labels.
- **Vehicle details** (most important page):
  - `Gallery` — thumbnail rail, arrows, counter, fullscreen lightbox with keyboard
    navigation (←/→/Esc), zoom button.
  - `BidPanel` — dark graphite panel: live pulse, current bid, server-authoritative
    countdown, quick-bid amount buttons, free input, confirm modal, SSE-driven refresh;
    per-user **Leading / Outbid** status (new additive `isLeading` field in
    `/api/auctions/[id]/state`, session-derived — no schema or engine change).
  - Grouped spec sections (General / Engine & performance / Exterior & interior),
    Condition card with damage callout, key-facts strip, bid history with
    anonymized bidder aliases.
  - `BuyNowButton` — explicit "request purchase" wording; makes clear an administrator
    confirms the sale (per spec's truthful-language rule).

## User account

- `AccountNav` — icons, unread-notification badge, horizontal scroll on mobile.
- Dashboard — icon stat cards with hover lift; live bid list with Leading/Outbid.
- My Bids / Purchases — vehicle thumbnails in tables (coverUrl already selected).
- Favorites — reused `VehicleCard`; Notifications — unread highlighting;
  Profile — section headings, loading states, error-tone messages.

## Admin panel

- `AdminNav` — icons, pending Approvals/Orders count badges, mobile scroll.
- `AdminBreadcrumb` — automatic breadcrumbs on every admin page.
- Vehicle creation — 6-step wizard (General → Specifications → Condition →
  Sale & pricing → Records → Review) with required-field validation and a review
  step; all fields preserved (same payload contract).
- Vehicles table — cover thumbnails; dashboard stat cards polished.

## Files changed (high level)

- New: `docs/MILESTONE_3_UX_AUDIT.md`, `ui/{chip,drawer,breadcrumb,toast,tabs}.tsx`,
  `layout/nav-links.tsx`, `admin/admin-breadcrumb.tsx`, `(public)/legal/[slug]/page.tsx`.
- Rewritten: `globals.css`, `site-header`, `mobile-nav`, `site-footer`, homepage,
  `vehicle-card`, `catalog-filters`, `vehicles/page`, `vehicles/[slug]/page`,
  `gallery`, `bid-panel`, `account-nav`, `admin-nav`, `vehicle-form` (wizard).
- API (additive only): `api/auctions/[id]/state` adds `isLeading`.

## Functional regression

- All API contracts preserved (only additive `isLeading` field).
- Auction engine, bidding rules, Buy Now rules, approval workflows — untouched.
- SSE updates, countdown (server timestamps), idempotent bid keys — preserved.

## Verification

| Command | Result |
|---|---|
| `pnpm typecheck` | ✅ clean |
| `pnpm build` | ✅ clean |
| `pnpm test` | ✅ 109/109 |

Visual evidence: `docs/screenshots/` (desktop 1440px + mobile 390px captures of
homepage, catalog, vehicle detail).

## Remaining design issues

- Catalog "Buy Now" list shows auction lots whose current bid already reached the
  fixed price; the server rejects such purchases, but the card CTA could ideally be
  dimmed earlier (catalog-level join is a heavier change — documented in M2.3 report).
- Admin approval/order cards could adopt thumbnails for faster scanning.
- Currency selector in header is display-only until multi-currency checkout exists.
