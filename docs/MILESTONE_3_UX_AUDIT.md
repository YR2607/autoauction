# Milestone 3 — UX Audit (Step 0)

Date: 2026-11-14. Scope: all public pages, account, admin, shared UI.

## Existing design assessment

The current UI is a competent MVP shell: Manrope/Inter already loaded,
spec palette already tokenized in `globals.css` (`graphite/ink/bg/primary/
muted/line/success/warning/error`), small primitive set (`Button`, `Card`,
`Badge`, `Input/Select/Textarea/Label`, `Modal/ConfirmModal`, `EmptyState`,
`Skeleton`), lucide icons. Layout is consistent: sticky header, 7xl
container, footer with 4 columns.

## Problems found

### Hierarchy & polish
- Hero is a flat ink block with two radial gradients — no photography,
  generic SaaS feel; headline copy differs from spec direction.
- Vehicle cards: dense but flat — price/bid area weakly differentiated,
  no hover affordance on the CTA, lot badge competes with sale badges.
- Section headers repeat a manual eyebrow+title+link pattern (ok) but
  spacing/alignment varies between pages.
- Footer is thin on the promised content (currencies, legal, contact).

### Catalog
- Filters are desktop-only aside; on mobile they occupy the whole flow —
  no drawer, no collapsible behavior.
- No active-filter chips / count; "Reset filters" is the only escape.
- No `auctionStatus` control in the UI although the query supports it.
- Search is duplicated inside filters; no dedicated toolbar row
  (count + sort + filter trigger).

### Vehicle detail
- Gallery: no keyboard nav, thumbnails unlabeled, lightbox has no
  prev/next/close affordances beyond click-out.
- Bid panel reads as a plain white card — the money moment lacks presence;
  min-next-bid hint is small; no leading/outbid state for the user.
- Spec/condition are `dl` pairs — fine but visually flat; no grouped
  sections; documents area plain.
- Bid history is a bare table; bidder masking exists (keep).
- No sticky mobile purchase affordance.

### Account
- Sidebar is a gray card; no icons, no unread badge on notifications.
- Dashboard stat tiles fine but text-heavy; "Recent activity" raw.
- My Bids table shows data but statuses are text-only; row affordance weak.

### Admin
- Functional but plain: no icons in nav, no breadcrumb/page-title pattern,
  tables vary in density, dashboard lacks visual rhythm.
- Vehicle form is a single long page — spec asks for a stepped wizard
  (implement as client-side stepper over the same fields/payload).
- Approvals: rejection modal exists (REOPEN duration input added in 2.2) —
  keep, restyle consistently.

### Accessibility / responsive
- Modal lacks focus trap/initial focus; drawer needs `aria` roles.
- Color-only statuses in several spots (mitigate with labels/icons).
- Horizontal overflow risk in admin tables on narrow screens.

## What must NOT change (contracts)

- `publicAuctionState` payload + SSE channels (`/events`, `/state`).
- `POST /api/auctions/:id/bid` body `{amountMinor, idempotencyKey}`.
- `POST /api/vehicles/:id/buy-now`, admin order/auction actions schemas.
- `listVehicles` params (q/make/model/yearFrom/yearTo/priceMax/mileageMax/
  fuelType/transmission/bodyType/saleType/auctionStatus/sort/page).
- `showBuyNow` allowlist logic (server-authoritative).
- Bid masking, docs access rules, all 109 tests.

## Redesign architecture

1. **Foundation**: expand `globals.css` tokens (radius scale, shadows,
   container, focus ring, motion); new primitives `Chip`, `Tabs`,
   `Breadcrumb`, `Toast` (client ctx), `Drawer` (mobile filter panel),
   `ErrorState`, `IconButton`, `Stat` card, `DataTable` styles.
2. **Site chrome**: header with active-state nav + notifications link;
   richer footer (currencies/legal/contact); improved `MobileNav`
   (X icon fix — currently renders Menu for both states).
3. **Homepage**: photographic hero (reuse a seed `car-*.jpg` as backdrop —
   decorative, not vehicle data), stats strip, same sections, better cards.
4. **Catalog**: toolbar (count/search/sort), desktop aside, mobile
   `Drawer`, active chips + Clear all, `auctionStatus` control.
5. **Vehicle card**: image-first, price block prominent, hover CTA.
6. **Vehicle detail**: 65/35 grid, keyboard gallery + lightbox,
   dark "deal panel" (bid + buy-now), leading/outbid status, grouped
   spec sections, bid history table, sticky mobile bar.
7. **Account**: icon sidebar + unread badge, metric cards, status-pilled
   bids table.
8. **Admin**: icon sidebar, breadcrumb page headers, consistent tables,
   dashboard metric cards, vehicle form → 7-step wizard (same payload).
9. **QA**: verify viewports 1440/1280/768/390/375, keyboard flows,
   `pnpm typecheck && pnpm build && pnpm test`.
