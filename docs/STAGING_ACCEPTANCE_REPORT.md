# Staging Acceptance Report — AutoAuction

Date: 2026-11-15 · Instance: `http://localhost:3300` (production build, main@`7166731`)
Synthetic accounts only: `demo-admin@`, `demo-buyer1@`, `demo-buyer2@autoauction.dev`.
All checks executed against the live HTTP API; results below are actual responses.

## Scenario A — Administrator

| Step | Result | Evidence |
|---|---|---|
| Admin login | ✅ | register + role grant; `/api/profile` → `role:"admin"` |
| Create vehicle | ✅ | 7 vehicles via `POST /api/admin/vehicles` → `{"ok":true,"id":…,"slug":…}` |
| Upload images | ✅ | 2× JPEG per vehicle → 200, served at `/uploads/vehicles/…` |
| Cover image | ✅ | first upload auto-marked cover (`isCover: count === 0`) |
| Private document | ✅ | PDF + `kind=inspection` + title → 200 |
| Specifications | ✅ | make/model/year/mileage/body/fuel/transmission/color/location accepted |
| Create auction + prices/currency | ✅ | 5 auctions: start, increment, currency, Buy Now all set |
| Schedule | ✅ | `{"action":"schedule"}` → SCHEDULED → scheduler → LIVE at startsAt |
| Publish | ✅ | `PATCH … {status:PUBLISHED}` → catalog-visible |

## Scenario B — Buyer

| Step | Result | Evidence |
|---|---|---|
| Register + login | ✅ | 200, httpOnly session cookie |
| Catalog/search/filter | ✅ | `/vehicles` 200; `?q=BMW` lists M4 Competition; sort/price/page params 200 |
| Favorites | ✅ | `POST …/favorite` → `{"ok":true}` |
| Place bid | ✅ | €56 000 → `ok:true`, `currentBid=5600000`, `minNextBid=5650000` |
| Current bid updates | ✅ | `GET …/state` reflects new bid |
| Second buyer outbids | ✅ | €57 000 accepted |
| Outbid notification | ✅ | db row `type:"outbid"` for buyer1, title "You have been outbid" |
| Min-bid validation | ✅ | €40 000 < min → `422 below_minimum:5500000` |
| Idempotent retry | ✅ | same key → same `bidId` (87e5068d), `bidCount` stays 1 |
| Countdown | ✅ | `endsAt` exposed in state; anti-sniping observed extending it (C3) |

## Scenario C — Auction completion (Porsche 911, 3-min auction)

| Step | Result | Evidence |
|---|---|---|
| Bids placed | ✅ | €90 000 (b1), €92 000 (b2) |
| Anti-sniping | ✅ | b1 bid inside 60 s window → `endsAt` +120 000 ms exactly |
| Auction ends | ✅ | scheduler LIVE → `AWAITING_ADMIN_APPROVAL` (~180 s observed) |
| Winner selection | ✅ | top bid (b1 €94 000) → `AUCTION_WIN` order `PENDING_APPROVAL` |
| Admin approve | ✅ | auction `SOLD`, vehicle `SOLD`, order `APPROVED` |
| Buyer dashboard | ✅ | `/account/purchases` renders "Porsche 911 Carrera" |

## Scenario D — Buy Now matrix

| Case | Result | Evidence |
|---|---|---|
| No auction (Toyota) | ✅ | 200 `{"ok":true,"orderId":…}` |
| DRAFT auction (Audi) | ✅ | 200 — order created |
| SCHEDULED auction (Mercedes) | ✅ | 200 — auction auto-closed `close_reason=buy_now`, vehicle RESERVED |
| LIVE auction below price (Range Rover) | ✅ | 200 — same close path |
| Bid ≥ Buy Now price | ✅ | `409 "the current bid already meets the Buy Now price"` |
| Currency mismatch | ✅ | `409 "auction currency differs from the Buy Now currency"`; create-time guard also 400s |
| Concurrent Buy Now | ✅ | two simultaneous POSTs → one 200 (`orderId`), one `409 "Vehicle is not available"` — no double-sell |
| Admin approve | ✅ | Toyota order → `APPROVED`, vehicle `SOLD` |
| Admin reject + recovery | ✅ | Audi order `REJECTED` → vehicle back `PUBLISHED` |
| REOPEN recovery | ✅ | earlier: `reject{next:REOPEN}` → auction LIVE w/ new endsAt |
| UNSOLD recovery | ✅ | RR order `reject{auctionAction:UNSOLD}` → auction `UNSOLD`, vehicle `PUBLISHED` |

## Scenario E — Security

| Check | Result |
|---|---|
| Guest → `/account`, `/admin` | ✅ 307 redirect to login |
| Buyer → `/admin` page | ✅ 307; admin API → `403 Forbidden` |
| Private doc — guest | ✅ 401 |
| Private doc — other buyer | ✅ 403 |
| Private doc — admin | ✅ 200 |
| Suspended user bid | ✅ `403 "Account suspended."` (re-activated after test) |
| Buyer calls admin order API | ✅ `403 Forbidden` |
| Invalid upload (fake exe as PDF) | ✅ `400` — content rejected, not just MIME |
| Dev-seed credentials | ✅ `401` — no dev seed present, `ALLOW_DEV_SEED` unset |

## Scenario F — Technical stability

| Check | Result |
|---|---|
| SSE multi-client | ✅ two concurrent clients got `{"event":"connected"}` on `text/event-stream`, `no-cache` |
| One disconnects → others fine | ✅ both streams closed independently, no server errors |
| Reconnect → current state | ✅ `connected` event on each (re)connect; `/state` endpoint gives live snapshot |
| Scheduler expiry | ✅ LIVE → AWAITING_ADMIN_APPROVAL at endsAt (5 s tick) |
| Restart keeps state | ✅ kill+start: all auctions/bids/orders/images intact, uptime reset only |
| Backup → restore (isolated) | ✅ `integrity ok`, full row counts match |
| Images persist across restart | ✅ `public/uploads/vehicles/` files present post-restart |
| Private docs stay protected | ✅ guest 401 / buyer 403 / admin 200 post-restart |

## Demo data present on staging

BMW M4 Competition (LIVE auction — open for demo bidding), Mercedes-Benz
AMG GT 63 S, Audi RS6 Avant (DRAFT auction), Porsche 911 Carrera S (SOLD —
shows completed journey), Toyota GR Supra (SOLD via Buy Now), Range Rover
Autobiography (PUBLISHED — UNSOLD recovery visible), Lexus LC 500
(pending order). 3 accounts (1 admin, 2 buyers), 2 images + 1 private
document per vehicle.

Demo journeys reproducible:
- **Journey 1 (Auction):** BMW M4 is LIVE — buyers bid → ends ~2 h → admin
  approves → SOLD (same path verified end-to-end on Porsche).
- **Journey 2 (Buy Now):** verified on Toyota — request → admin approve →
  appears in `/account/purchases`.

Credentials handed off privately (not in this document, not in git).

## Not covered / known limits

- No real email delivery (outbox transport by design for staging).
- Countdown visual check is via state `endsAt` + observed SSE/extension
  behavior, not a screenshot pass.
- Multi-instance behavior: out of scope — single process by design.
