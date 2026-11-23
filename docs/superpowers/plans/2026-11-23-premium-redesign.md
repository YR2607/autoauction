# Premium Automotive Marketplace Redesign — Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the generic AI-template look; make AutoAuction look like a real premium automotive auction house (Bring a Trailer / Collecting Cars tier) across EVERY route — public, account, admin.

**Architecture:** Design-token-first refactor. New palette/type/spacing in `globals.css` → updated `ui/` primitives → per-route restyle. Zero changes to queries, API routes, auth, auction engine, Drizzle schema, or business logic. Icons: keep Iconoir + Phosphor (already migrated).

**Tech Stack:** Next.js 16.4.6 (Turbopack), React 19, Tailwind v4 (`@theme` in globals.css), TypeScript, Iconoir/Phosphor icons, Vitest.

## Global Constraints

- Do NOT touch: `src/features/**` queries, `src/app/api/**`, `src/lib/db`, `src/lib/auth`, auction engine, schema. Markup/classes only around them.
- All existing class/prop contracts of shared components must stay backward-compatible (`Badge` tones, `Button` variants, `Card`, `Input`, `CatalogLayout`, `VehicleCard` props).
- No new runtime dependencies. Fonts via `next/font/google` only.
- No gradients, glow, glassmorphism, heavy radius (>16px only on images/cards sparingly), no purple.
- Verification after every task: `pnpm exec tsc --noEmit` + `pnpm build` + `pnpm test` + curl assertions on local staging :3300.
- Desktop 1440 / laptop 1280 / tablet 768 / mobile 390 — check `sm:`/`lg:`/`xl:` breakpoints per task.

## Audit findings (Phase 1 — done)

- **Routes:** public `/`, `/vehicles`, `/vehicles/[slug]`, `/auctions`, `/buy-now`, `/legal/[slug]`; auth `/login` `/register` `/forgot-password` `/reset-password`; account 6 pages under `src/app/account/`; admin 9 pages under `src/app/admin/`; 24 API routes — all off-limits.
- **Shared UI:** `src/components/ui/` (badge, button, card, chip, drawer, input, tabs, toast, dialog, breadcrumb, empty); layout (site-header, site-footer, mobile-nav, nav-links, logo); vehicles (vehicle-card, catalog-filters, gallery, search-bar, pagination, favorite-button, buy-now-button); auctions (bid-panel, countdown); account-nav; admin-*.
- **Inconsistencies:** heavy radii (`rounded-full` pills everywhere), blue-primary CTA language vs "premium black/navy" spec, decorative icon tiles, `bg-ink` dark homepage sections vs light editorial spec, uppercase micro-labels overused, generic card grid repetition.
- **Design tokens today:** `globals.css @theme` — graphite #111827, ink #0b1220, bg #f3f5f8, primary #2563eb; fonts Inter + Manrope via next/font.

## Design direction decisions

- **Palette:** keep token names, shift values — bg `#fafafa` → sections alternate white/`#f7f7f5`; ink stays near-black for text & footer; primary CTA becomes near-black `--color-cta: #111318`; accent blue stays `--color-primary` but used only for live/links/bid states (restrained).
- **Type:** Inter→ keep as sans (body), Manrope→ keep as display but tighter scale: h1 44-56px, h2 28-32, section eyebrows `text-[12px] uppercase tracking-[0.18em] text-muted` (no color).
- **Radii:** buttons `rounded-md` (6px), cards `rounded-lg` (8px), images `rounded-md`; kill `rounded-full` pills except LIVE dot badge.
- **Borders:** hairline `border-line` everywhere; shadows nearly flat (`shadow-card` only on hover-lift for vehicle cards).
- **Header:** white, hairline bottom border, text wordmark, nav `text-sm` with active underline.
- **Footer:** keep dark `bg-ink`, simplify columns.

---

### Task 1: Design tokens + UI primitives

**Files:**
- Modify: `src/app/globals.css` (@theme tokens)
- Modify: `src/components/ui/button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx`, `chip.tsx`, `breadcrumb.tsx`, `empty.tsx`, `tabs.tsx`, `toast.tsx`, `dialog.tsx`, `drawer.tsx`

**Interfaces:**
- Produces: tokens `--color-cta`, `--color-bg-alt: #f7f7f5`; `Button` variant `primary` → near-black bg; `secondary` → white bordered; keeps all variant names.

- [ ] Update tokens: `--color-bg: #fafafa`, add `--color-cta: #111318`, `--color-cta-hover: #000`, keep line/muted; change `--radius-card` to 8px; comment out unused shadow-lift/pop or soften.
- [ ] `button.tsx`: `primary: "bg-cta text-white hover:bg-black"`, `dark` unchanged, radii `rounded-md`, remove `shadow-primary/25`.
- [ ] `badge.tsx`: square-ish `rounded-[4px]`, uppercase `tracking-[0.12em]`, tones keep names; `live` keeps pulse dot.
- [ ] `card.tsx`: `rounded-lg`, shadow-card only.
- [ ] `input.tsx`: `rounded-md`, focus `ring-2 ring-cta/10 border-graphite` (replace primary-blue ring).
- [ ] `chip.tsx` FilterChip: `rounded-md border`, active `bg-ink text-white`.
- [ ] `breadcrumb/empty/tabs/dialog/drawer`: radius + color token alignment only.
- [ ] `tsc --noEmit && pnpm build` green.

### Task 2: Header / footer / mobile nav / logo

**Files:** `src/components/layout/site-header.tsx`, `site-footer.tsx`, `mobile-nav.tsx`, `nav-links.tsx`, `logo.tsx`, `sign-out-button.tsx`

- [ ] Header: `bg-white border-b border-line` (no blur), h-16; nav links `text-[13.5px] font-medium`, active = `text-ink` + 2px ink underline offset; CTA "Create account" → `bg-cta hover:bg-black rounded-md`.
- [ ] Footer: keep `bg-ink text-white`, tighten grid, small-caps column titles `text-white/40 text-[11px] tracking-[0.14em]`; keep `flush` prop.
- [ ] Mobile nav: square menu icon button `rounded-md border border-line`; drawer styling aligned (radius, hairlines).
- [ ] Verify `/`, `/vehicles`, login page — header identical, no blur residue.

### Task 3: Homepage (new editorial layout)

**Files:** `src/app/(public)/page.tsx` (full rewrite of JSX; keep imports of queries: `liveAuctionCards`, `buyNowCards`, `latestVehicles`, `manufacturers` — verify exact names first), `src/components/vehicles/search-bar.tsx`

- [ ] Hero: full-width photo (`/seed-images/car-*.jpg`, cover, `h-[520px] lg:h-[600px]`), dark scrim via `bg-ink/55` overlay, left-aligned max-w-xl: eyebrow none, h1 48-56 Manrope, 1-line sub, two CTAs (primary ink pill→`rounded-md bg-white text-ink`? — decide: primary `bg-white text-ink`, secondary `border border-white/60 text-white`), small stat line below (live count / vehicles count — real numbers from queries).
- [ ] Search bar: attach directly under hero content inside hero or as overlapping `−mt-7` white card `rounded-lg border`; keep `SearchBar` logic, restyle: `rounded-md`, button `bg-cta`.
- [ ] Sections order per spec: Featured live auctions → Buy Now inventory → Latest arrivals → Browse by manufacturer (link chips to `/vehicles?make=X`, text-only row, no tiles) → How it works (numbered text steps, hairline dividers, no icon tiles) → Trust section (3 text columns, hairline top borders) → Footer.
- [ ] Section header pattern: eyebrow `text-[12px] tracking-[0.18em] uppercase text-muted` + h2 28px + right-aligned `View all →` link.
- [ ] Vehicle grid reuse `VehicleCard` (restyled in Task 4).
- [ ] Light background throughout; no dark sections except footer.
- [ ] curl-assert: heading text, section order markers, no `bg-ink` in main (except footer), CTA present.

### Task 4: VehicleCard + catalog + filters

**Files:** `src/components/vehicles/vehicle-card.tsx`, `src/app/(public)/vehicles/page.tsx`, `src/components/vehicles/catalog-filters.tsx`, `src/components/vehicles/pagination.tsx`

- [ ] Card: `rounded-lg border border-line bg-white`, photo `aspect-[4/3]` (more editorial), hover = subtle lift `hover:shadow-lift` + image scale 1.03; badges: top-left `Live` (error) / `Buy Now` (ink) / `Upcoming` (neutral), lot number bottom-left on image `bg-ink/70 backdrop-blur-sm rounded` keep.
- [ ] Specs row: text-only `·`-separated (`12,500 km · Petrol · Automatic`) — drop spec icons for cleaner editorial look.
- [ ] Price block: `font-display text-lg font-bold`, caption `text-[11px] uppercase tracking-wide text-muted`; countdown red only when < 24h? — keep current logic, restyle text only.
- [ ] Catalog page: header `text-3xl` + count line; filters panel `rounded-lg border` sections separated by hairlines; sort select styled; mobile drawer unchanged logic, restyle.
- [ ] `/auctions` + `/buy-now` pages: same card grid + page headers (thin work — they render VehicleCard).

### Task 5: Vehicle detail page

**Files:** `src/app/(public)/vehicles/[slug]/page.tsx`, `src/components/vehicles/gallery.tsx`, `src/components/auctions/bid-panel.tsx`, `src/components/vehicles/buy-now-button.tsx`, `src/components/vehicles/favorite-button.tsx`

- [ ] Keep two-column `1fr_380px`. Gallery: `rounded-md`, thinner thumbs strip `h-16`, arrows `bg-white/90 rounded-md`.
- [ ] Facts strip → 4-cell hairline grid keep but `rounded-lg`, label `text-[11px] uppercase text-muted` (drop icons).
- [ ] Action card: title 28px, lot+location line; BidPanel: status row, current bid `text-3xl font-display`, min-bid hint, input+CTA `rounded-md`, CTA `bg-cta`; history list hairlines; SSE logic untouched.
- [ ] Buy Now card: price 3xl + `bg-cta` CTA; reserved notice restyle `border-l-2 border-warning` flat.
- [ ] Specs/documents/condition sections: hairline tables `divide-y divide-line`, `text-sm`, generous py — replace any `Card` shells with bordered `rounded-lg` boxes; docs list items with `Page` icon + name + size.
- [ ] Similar vehicles: reuse VehicleCard 3-col.

### Task 6: Auth pages

**Files:** `src/app/(auth)/*/page.tsx`, `src/components/auth/auth-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`

- [ ] Centered card `max-w-sm mx-auto rounded-lg border`, wordmark top, `bg-cta` submit buttons, `rounded-md` inputs; keep all logic.

### Task 7: Account area

**Files:** `src/app/account/layout.tsx`, `account-nav.tsx`, all 6 account pages, `mark-all-read.tsx`, `profile-form.tsx`

- [ ] Sidebar nav: `rounded-md` items, active `bg-ink text-white`, unread count chip `bg-cta`; grid gap hairline.
- [ ] Pages: consistent page-header pattern (h1 24px + sub), tables → hairline rows `border-b border-line`, status badges restyled via updated Badge, empty states centered.
- [ ] Dashboard overview: stat cards → `border-l-2 border-cta pl-4` minimal stats, no tile icons.

### Task 8: Admin area

**Files:** `src/app/admin/layout.tsx`, `admin-nav.tsx`, all admin pages + `components/admin/*`

- [ ] Keep dark admin top bar (operational tool), tighten to h-12, wordmark + `Admin` muted.
- [ ] Admin nav pills → `rounded-md`, active `bg-white/10`.
- [ ] Stat cards flat `rounded-lg border`, tables hairline, action buttons `rounded-md`; forms keep logic, restyle via updated Input/Button.
- [ ] Dashboard chart bars → `bg-cta/80`.

### Task 9: Legal + misc pages

**Files:** `src/app/(public)/legal/[slug]/page.tsx`, not-found, error pages if present

- [ ] Prose container `max-w-3xl`, consistent typography, hairline dividers.

### Task 10: Full QA pass

- [ ] `tsc --noEmit`, `pnpm build`, `pnpm test` (140 tests) — all green.
- [ ] Restart local staging :3300; curl-check every public route returns 200 + key markers; login flow; bid flow via API; favorites.
- [ ] Visual pass at 1440/1280/768/390 via browser preview; mobile drawer, filters drawer, bid panel.
- [ ] Report: changed-file list, preserved-functionality checklist, test results — write to `docs/PREMIUM_REDESIGN_REPORT.md`.

## Additional Design Quality Requirements (approved amendments)

**0. Hard constraint:** agents MUST NOT change business logic, API routes, or the database to simplify design work. Markup/classes/queries-output only.

**1. Avoid repetitive AI-generated layouts.** No same-pattern-everywhere: no repeated identical 3-col grids, identical rounded containers, decorative icon tiles, generic marketing stats, repetitive eyebrow+heading+paragraph+cards. Use editorial layouts, asymmetric image compositions, varied content widths, clear visual hierarchy.

**2. Real automotive photography.** Use actual vehicle images from the DB/seed library; verify files exist before referencing; never unrelated stock; preserve aspect ratios/focal points; overlays only where text readability requires.

**3. Auction-first experience.** Immediately visible: live auctions, current highest bids, time remaining, how to bid, what is Buy Now. Not a generic dealership look.

**4. Design consistency — shared patterns for:** page headers, data tables, status indicators, price displays, vehicle specs, empty states, loading states, confirmation dialogs. Public + account must feel like one product.

**5. Final visual acceptance.** Compare before/after screenshots across home + catalog + vehicle detail + account (not home only). Criteria: real auction company look, vehicles dominant, distinctive typography, no AI-template repetition, scannable info, intentional mobile design. Never mark done on build success alone.

## Self-review

- Spec coverage: homepage ✓(T3), catalog ✓(T4), detail ✓(T5), auction UX ✓(T5 bid-panel), dashboard ✓(T7), admin ✓(T8), responsive ✓(T10 + per-task breakpoints), design system ✓(T1), consistent whole-app ✓.
- Untouched: API, queries, auth, engine, schema — enforced via constraints.
- Open point: hero CTA color final pick (white-on-dark vs ink) — resolve at T3 with user screenshot check.
