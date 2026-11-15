# Milestone 3.1 — Premium UX Final Polish — Report

Branch: `design/milestone-3-premium-ux` (on top of Milestone 3).

## Task 1 — Buy Now catalog consistency

**New single source of truth:** `src/features/vehicles/availability.ts`

- `buyNowAvailable(vehicle, auction)` — JS predicate mirroring the authoritative
  engine rules in `buyNow()` (PUBLISHED status, sale type, price+currency set,
  auction currency match, `currentBid < buyNowPrice`, purchasable-state allowlist).
- `buyNowEligibleSQL` — SQL twin used inside JOINed catalog queries.

**Applied to:**

- `buyNowCards()` (Buy Now page + homepage section) — now excludes vehicles
  whose auction is ended/awaiting/sold, whose bid reached the fixed price, or
  whose auction currency differs.
- `listVehicles({ saleType: "BUY_NOW" })` — same eligibility, not just "price set".
- `VehicleCard` — `buyNowAvailable` flag drives the badge; price block shows the
  fixed price only when actually purchasable; otherwise shows auction price.
- Vehicle details page — inline allowlist replaced by the shared predicate.
- Account favorites — same flag supplied.

**Price semantics:** `effectivePrice` SQL expression matches exactly what the
card renders (live/scheduled auction → auction price; eligible Buy Now →
fixed price; else last known auction price, then fixed price). Used for
`priceMax` filtering and all price sorts — displayed and sorted prices agree.

**Currency filter** — previously dead code (`currency === "buynow"`); now a
working select in the filter panel matching the display currency.

**Tests:** `tests/buy-now-catalog.test.ts` — 12 tests (predicate allowlist,
bid/currency exclusions, catalog exclusion, card flag, priceMax/sort/currency
semantics, engine still rejects over-bid purchases).

## Task 2 — Accessibility

- New `src/lib/use-dialog-a11y.ts`: initial focus into the dialog, Tab/Shift+Tab
  focus trap, Escape handling, background scroll lock, focus restoration on close.
- `Modal` / `ConfirmModal` / `Drawer` rebuilt on the hook; `role="dialog"`,
  `aria-modal`, `aria-labelledby`, `tabIndex={-1}` panel fallback.
- `Tabs`: roving tabindex, ArrowLeft/Right/Home/End navigation, `aria-label` prop.
- Mobile nav: `aria-expanded`/`aria-controls`, Escape-to-close, visible focus styles.
- All overlays keep `prefers-reduced-motion` support (animations already gated).
- Uniform `focus-visible` outlines on new interactive elements.

## Task 3 — Legal & contact content

- `/legal/[slug]` pages carry a visible "Draft — pending legal review" badge and
  a closing note that jurisdiction/final wording is unconfirmed.
- Removed the "binding offer" claim from Terms and from the bid-confirmation
  dialog ("firm offer" instead).
- "Every vehicle inspected" claims replaced with documented-condition wording.
- `src/lib/site.ts` — `contactEmail` driven by `NEXT_PUBLIC_CONTACT_EMAIL`;
  footer renders the contact only when configured (no placeholder contacts).
  `.env.example` documents the variable.

## Task 4 — Design consistency

- All remaining `disabled={busy}` submit buttons converted to `Button loading`
  (uniform spinner + disabled semantics) across auth, admin, settings, uploaders.
- Header breakpoint moved to `lg` so the desktop nav never overflows at 768px.

## Task 5 — Responsive QA (Playwright screenshots, `docs/screenshots/`)

| Viewport | Result |
|---|---|
| 1440 | catalog, vehicle, home, auctions — OK |
| 1280 | catalog OK |
| 768 | burger nav, 2-col grid, filter button, vehicle single-column — OK |
| 390 | home, catalog, vehicle — OK |
| 375 | catalog, vehicle — OK |

No horizontal overflow; gallery lightbox keyboard navigation (←/→/Esc) in place;
dialog focus trap verified in code (initial focus, trap, restore).

## Task 6 — Regression

| Command | Result |
|---|---|
| `pnpm typecheck` | ✅ clean |
| `pnpm build` | ✅ clean |
| `pnpm test` | ✅ **121/121** (109 baseline + 12 new) |

No schema changes, no engine/financial-logic changes. The only API delta remains
the additive `isLeading` field from M3.

## Files changed

- New: `features/vehicles/availability.ts`, `lib/use-dialog-a11y.ts`,
  `lib/site.ts`, `tests/buy-now-catalog.test.ts`, this report.
- Modified: `features/vehicles/queries.ts`, `vehicle-card.tsx`,
  `catalog-filters.tsx`, `vehicles/page.tsx`, `vehicles/[slug]/page.tsx`,
  `account/favorites/page.tsx`, `dialog.tsx`, `drawer.tsx`, `tabs.tsx`,
  `mobile-nav.tsx`, `site-header.tsx`, `nav-links.tsx`, `site-footer.tsx`,
  `legal/[slug]/page.tsx`, `(public)/page.tsx`, `bid-panel.tsx`,
  assorted `disabled`→`loading` buttons, `.env.example`.
