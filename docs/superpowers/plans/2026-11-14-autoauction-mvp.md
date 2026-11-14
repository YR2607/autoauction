# AutoAuction MVP — Implementation Plan

> Executed milestone-by-milestone in session. Stack: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Drizzle + better-sqlite3 + custom session auth + SSE.

## Status legend: ✅ done · 🚧 partial · ⬜ pending

### M1 — Foundation ✅
- [x] Scaffold (package.json, tsconfig, next.config, tailwind v4 theme, drizzle config)
- [x] DB schema + drizzle-kit migration + migrate runner (`pnpm db:migrate`)
- [x] Seed data: admin + 3 buyers + 12 vehicles + auctions + bids (`pnpm db:seed`)
- [x] Auth: register/login/logout APIs, scrypt hashing, sessions, RBAC guards
- [x] Design system: tokens in globals.css, Button/Input/Select/Badge/Card/Modal/EmptyState
- [x] Layouts: site header/footer, account nav, admin nav

### M2 — Public website ✅
- [x] Homepage (hero, dual CTA, search, live/upcoming/buy-now/featured, makes, how-it-works)
- [x] Catalog `/vehicles` — filters (q/make/year/price/mileage/fuel/trans/body/saleType/sort) + pagination
- [x] `/auctions` — live/upcoming/completed sections
- [x] `/buy-now` — fixed-price grid
- [x] `/vehicles/[slug]` — gallery+zoom, bid panel (SSE), buy-now, favorites, bid history, specs, condition, similar

### M3 — Auction engine ✅
- [x] `placeBid` — serialized txn, min-increment, idempotency key, REJECTED audit, outbid notify
- [x] `buyNow` — atomic reserve + auction close + pending order
- [x] Lifecycle: scheduler (5s tick via instrumentation), activate/finalize, winner → AWAITING_ADMIN_APPROVAL
- [x] Anti-sniping extension (configurable)
- [x] Admin decisions: approve/reject(+REOPEN|NEXT_BIDDER|UNSOLD), order approve/reject/complete
- [x] SSE `/api/auctions/[id]/events` + `/state` refetch on reconnect

### M4 — Admin panel ✅
- [x] Dashboard with real counts + bid activity chart
- [x] Vehicles: list, create/edit form (all spec fields), publish/archive, image upload/delete
- [x] Auctions: list, create, schedule, cancel (reason)
- [x] Approvals: auction results + Buy Now requests
- [x] Orders, Bids (accepted+rejected), Users (suspend/reactivate), Settings

### M5 — Account area ✅
- [x] Dashboard, My Bids (leading/outbid/won), Purchases, Favorites, Notifications (real events), Profile + password

### M6 — Hardening 🚧
- [x] Engine tests: 20 vitest cases (bids, idempotency, concurrency, extension, lifecycle, approvals, buy-now)
- [ ] Auth flow tests, API-level security tests
- [ ] Vehicle documents upload UI (schema ready; API pending)
- [ ] Password reset flow (schema/mail out of scope — needs decision)
- [ ] Image ordering UI (sortOrder exists; UI pending)
- [ ] UI/responsive tests, SEO meta expansion, deploy config

## Next milestone candidates
1. E2E auth+bid security tests at HTTP level
2. Document upload + private file handler
3. Vehicle image reorder + cover picker
4. Production deploy config (Dockerfile / single-node notes)
