# Business Rules — AutoAuction MVP

## Confirmed (from client)

1. Administrators only create listings/auctions. Two roles: buyer, admin.
2. Sale types: `BUY_NOW`, `AUCTION`, `AUCTION_BUY_NOW`.
3. Manual bidding only. Highest valid bid wins. Winner needs admin approval.
4. One currency per auction (USD/EUR/GBP). No conversion. Same currency for
   start price, increment, bids, buy-now.
5. Default EUR increment €250; per-auction and per-currency defaults configurable.
6. Buy Now reserves the vehicle **atomically**; on `AUCTION_BUY_NOW` it also
   **closes the auction** and preserves bid history. **Buy Now is refused when
   the auction's accepted current bid already meets or exceeds the fixed
   price** (server-side `BUY_NOW_UNAVAILABLE`; UI also hides the button) and
   when the auction and Buy Now currencies differ — combined listings are
   validated to share one currency at auction creation.
7. No payment gateway. Orders + manual payment status only.
8. English UI, copy centralized (`src/lib/messages.ts` → future i18n).

## Bidding rules (enforced server-side, in-transaction)

- Auth required; bidder must be `active`; admins may not bid (avoid conflict).
- Auction must be `LIVE` and `now < endsAt` (server clock).
- First bid ≥ `startingPrice`; later bids ≥ `currentBid + bidIncrement`.
- Currency fixed by auction — client never sends currency.
- Idempotent via client UUID → retry never double-inserts.
- Rejected attempts stored as `REJECTED` bids (audit) — never displayed as history.
- Rejected bids do **not** trigger extension.

## Auction timing

- `SCHEDULED → LIVE` when `startsAt` reached (scheduler job).
- `LIVE → ENDED` when `endsAt` reached (scheduler job), then winner computed
  → `AWAITING_ADMIN_APPROVAL` (+ order `PENDING_APPROVAL`, admin notified).
- No bids at end → `UNSOLD` directly.
- **Extension (default ON):** accepted bid inside final `extensionWindowSec`
  (default 120) extends `endsAt` by `extensionDurationSec` (default 120).
  Per-auction override; platform default in settings; disableable.

## Rejection / approval

- **One authoritative workflow for auction results:** `AUCTION_WIN` orders are
  decided only through `approveResult`/`rejectResult` (`/admin/approvals`,
  `POST /api/admin/auctions/:id`). Pending `AUCTION_WIN` orders are read-only
  on `/admin/orders`. Generic `/api/admin/orders/:id` calls on `AUCTION_WIN`
  orders **delegate** to the result workflow (approve) or are refused unless
  an explicit `next` action is supplied (reject) — no path can leave an
  auction `AWAITING_ADMIN_APPROVAL` while its order is decided.
- Admin approve → order `APPROVED`, vehicle `SOLD`, auction `SOLD`, winner notified.
- Admin reject → reason required + explicit next action:
  `REOPEN` (new end time required, admin-chosen duration — 24 h default)
  | `NEXT_BIDDER` | `UNSOLD`.
- `NEXT_BIDDER` excludes **every** previously rejected winner of that auction
  and creates exactly one new pending order; no eligible bidder → `UNSOLD`.
- Rejected Buy Now that had closed an auction requires the same explicit
  choice in every admin UI: `REOPEN` (new end time) or `UNSOLD`; reopen is
  refused if the vehicle was already sold via another order.
- All decisions in `admin_audit_logs` + `auction_events`. Bid history immutable.

## Vehicle status ↔ auction consistency

| Auction event | Vehicle status |
|---|---|
| auction scheduled/live | `PUBLISHED` |
| buy-now order pending | `RESERVED` |
| order rejected/cancelled | `PUBLISHED` (or auction resumed) |
| order approved/completed | `SOLD` |

## Unconfirmed → documented defaults (reversible, in `platform_settings`)

| Setting | Default | Key |
|---|---|---|
| Extension window | 120 s | `auction.extensionWindowSec` |
| Extension duration | 120 s | `auction.extensionDurationSec` |
| Default auction duration | 72 h | `auction.defaultDurationSec` |
| Default increment EUR/USD/GBP | 25000/25000/20000 minor | `auction.defaultIncrementMinor.{cur}` |
| Platform currency | EUR | `platform.defaultCurrency` |
| Platform timezone | Europe/Berlin | `platform.timeZone` |
| Session TTL | 30 days | `auth.sessionTtlSec` |
| Max images / vehicle | 30 | `media.maxImages` |
| Max upload size | 10 MB | `media.maxUploadBytes` |
| Rate limit: bids | 30/min/user | `rate.bidsPerMin` |
| Rate limit: auth | 10/min/IP | `rate.authPerMin` |
| Min bid margin above current | increment only (no extra %) | — |

## Explicit non-goals

- Reserve/hidden reserve price — not in scope (can add `reservePrice` later).
- Bid retractions — not allowed; admin invalidation only, with reason + audit.
- Proxy/auto bidding.
- Payment capture, deposits, invoices.
