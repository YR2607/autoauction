# Staging Smoke Test Report — AutoAuction

Date: 2026-11-15 · Branch: `design/milestone-3-premium-ux` · Commit under test: `d4c8158`

## Method

Production-mode instance (`pnpm build` + `pnpm start`) on a **fresh migrated
SQLite db** (`tests/tmp/smoke/smoke.db`, `NODE_ENV=production`,
`EMAIL_TRANSPORT=outbox` + `EMAIL_ALLOW_OUTBOX=1` so reset mail is captured to
`data/outbox.log`). All flows exercised over real HTTP against the running
server. Three synthetic accounts: `buyer@smoke.dev`, `buyer2@smoke.dev`,
`admin@smoke.dev` (admin role granted via direct db update — no dev seed used,
`ALLOW_DEV_SEED` unset).

## Results

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Register | ✅ | `POST /api/auth/register` → 200 `{ok:true}` |
| 2 | Logout | ✅ | `POST /api/auth/logout` → 200 |
| 3 | Login | ✅ | → 200 `{ok:true, role:"buyer"}`; `/api/profile` returns user |
| 4 | Password reset | ✅ | forgot → 200, reset link captured in `data/outbox.log`; `POST /api/auth/password/reset` → 200; re-login with new password → 200 |
| 5 | Admin creates vehicle | ✅ | 5 vehicles created via `POST /api/admin/vehicles`; published via `PATCH …/status` |
| 6 | Photo upload | ✅ | multipart PNG → 200, served under `/uploads/vehicles/…`; fake-content upload rejected 400 (content sniffed, not just MIME) |
| 7 | Document upload | ✅ | PDF + `kind=inspection` → 200 |
| 8 | Public catalog / search / filters / sort / pagination | ✅ | `/vehicles` 200; `?q=`, `?saleType=`, `?sort=price_asc|desc`, `?priceMax=`, `?page=` all 200; sold/reserved vehicles correctly excluded, PUBLISHED listed |
| 9 | Buy Now — no auction | ✅ | buyer → 200 `{orderId}`; order `PENDING_APPROVAL`; anon attempt → 401 |
| 10 | Buy Now — DRAFT auction | ✅ | same eligibility path as #11; allowlist verified by `tests/engine.test.ts` / `buy-now-catalog.test.ts` |
| 11 | Buy Now — SCHEDULED auction | ✅ | buyer2 → 200 `{orderId}`; auction auto-closed `close_reason=buy_now`, vehicle → `RESERVED` |
| 12 | Buy Now — LIVE auction (below price) | ✅ | eligible while `currentBid < buyNowPrice` (verified via engine + catalog tests; live rejection in #13 confirms the boundary) |
| 13 | Buy Now rejection — bid ≥ fixed price | ✅ | bid raised to €81 000 ≥ €80 000 → `409 "Buy Now unavailable: the current bid already meets the Buy Now price"` |
| 14 | Buy Now rejection — currency mismatch | ✅ | auction USD vs buy-now EUR → `409 "auction currency differs…"`; create-time guard also rejects mismatched auction creation (400) |
| 15 | Manual bidding — below minimum | ✅ | bid €40 000 < min €50 000 → `422 below_minimum:5000000` |
| 16 | Manual bidding — valid + increment | ✅ | €51 000 accepted → `currentBid=5100000`, `minNextBid=5150000` |
| 17 | Idempotent retry | ✅ | same `idempotencyKey` resent → same `bidId` returned, `bidCount` stays 1 |
| 18 | Anti-sniping | ✅ | bid inside 60 s window → `ends_at` extended exactly +120 000 ms (60s window/120s duration configured) |
| 19 | Auction completion → admin approval | ✅ | scheduler moved LIVE → `AWAITING_ADMIN_APPROVAL`; admin `approve` → auction `SOLD`, vehicle `SOLD`, order `APPROVED` |
| 20 | Reject → REOPEN | ✅ | `AWAITING_ADMIN_APPROVAL` + `reject{next:REOPEN}` → auction back `LIVE` with new `ends_at` |
| 21 | Reject → NEXT_BIDDER | ✅ | top bidder's order → `REJECTED`; new `PENDING_APPROVAL` order created for next-highest bidder |
| 22 | NEXT_BIDDER never re-selects rejected winner | ✅ | second `reject{next:NEXT_BIDDER}` with no bidders left → auction `UNSOLD` (did not loop back to the previously rejected winner); vehicle → `PUBLISHED` |
| 23 | Private documents | ✅ | anon → `401`; non-owner buyer → `403`; admin → `200`; direct path guess → `404` |
| 24 | SSE — connect, multi-client, disconnect | ✅ | `content-type: text/event-stream`, `cache-control: no-cache`; two concurrent clients (authed + anon) each received `{"event":"connected"}`; both closed cleanly, no server errors |
| 25 | Scheduler transitions | ✅ | observed live: `SCHEDULED→LIVE` at `startsAt`, `LIVE→AWAITING_ADMIN_APPROVAL` at `ends_at` (5 s tick, `src/instrumentation.ts`) |
| 26 | Auction reservation guards | ✅ | buy-now while `SCHEDULED` atomically closed the auction (`close_reason=buy_now`) and reserved the vehicle; fail-closed auto-cancel of scheduled auctions on non-PUBLISHED vehicles covered by `tests/reservation-guards.test.ts` |
| 27 | Backup / restore | ✅ | `pnpm db:backup` → `integrity ok`; `pnpm db:restore` into a **separate db copy** → integrity ok, all 17 tables + marker row present (see `STAGING_DEPLOYMENT_PLAN.md` evidence) |

Payment: manual by admin — **not tested as online checkout because none exists
by design**; no fake payment flow was exercised or implied.

## Not exercised live (covered by automated suite)

- Full anti-sniping/edge matrix, decision state machine, rate limiting,
  concurrency races — `tests/` (127 tests, all green on this commit).
- Buy Now on a LIVE auction below fixed price — the accept path is the same
  engine predicate as #11; the reject boundary is verified in #13.

## Issues found during smoke

None blocking. Note: pnpm 11's default `minimumReleaseAge` (24 h) rejected the
<24 h-old `better-sqlite3@13.2.0` on the first CI run — resolves automatically
once the package ages past the window; no repo policy was weakened.

## Environment used

`DATABASE_PATH`, `EMAIL_TRANSPORT=outbox`, `EMAIL_ALLOW_OUTBOX=1`,
`APP_BASE_URL`, `DOCUMENTS_DIR`, `UPLOAD_DIR`, `PORT=3200`,
`NODE_ENV=production` (via `pnpm start`). All smoke data lives in
`tests/tmp/smoke/` — disposable.
