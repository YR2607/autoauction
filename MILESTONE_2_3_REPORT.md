# Milestone 2.3 — Final Edge Cases & Business State Consistency

Date: 2026-11-14. Base: `b4fce0a` (M2.2, 85/85 tests).

## Task 1 — Stale order actions

**Root cause:** `approveOrder`/`rejectOrder` delegated `AUCTION_WIN` orders to
`approveResult`/`rejectResult` by `auctionId` only. The delegated function
then decided *whichever* `PENDING_APPROVAL` order existed — a request
addressing an old order could decide a newer `NEXT_BIDDER` order for a
different bidder.

**Fix:**
- `approveResult`/`rejectResult` accept `expectedOrderId`; inside the same
  transaction the current pending order's id must equal it, else
  `BAD_TRANSITION ("Pending order changed — refresh and retry")`.
- Delegation paths verify `head.status === "PENDING_APPROVAL"` *before*
  delegating and pass `head.id` as the expected id — a request on an
  already-decided order can never reach a different order.
- Direct `/admin/approvals` calls (no expected id) are unchanged.

**Regression coverage:** rejected order cannot approve/reject the
replacement order; expected-id mismatch refused on both paths; current
pending order still approves/rejects normally.

## Task 2 — Explicit Buy Now recovery required

**Root cause:** `rejectOrder` defaulted a missing `auctionAction` to
`UNSOLD` when the rejected Buy Now had closed an auction — a raw API call
could silently kill an auction.

**Fix:** missing `auctionAction` on a `closeReason="buy_now"` order →
`BAD_TRANSITION` inside the transaction (full rollback — order stays
pending, auction stays `ENDED`). Explicit `REOPEN` keeps its future-`newEndsAt`
validation (24 h documented default); `UNSOLD` unchanged. Buy Now orders
that did not close an auction reject normally without the choice.

**HTTP regression:** `POST /api/admin/orders/:id` reject without
`auctionAction` on a buy-now-ended order → 400, nothing mutated.

## Task 3 — Buy Now availability across all auction states

**Root cause:** bid/currency checks ran only inside the `LIVE | SCHEDULED`
branch — an `UNSOLD`/`CANCELLED` auction with a historically accepted bid ≥
fixed price still allowed a below-market purchase.

**Fix (engine):** for *any* auction record on the vehicle:
1. `auction.currency !== buyNowCurrency` → refuse.
2. `auction.currentBid >= buyNowPrice` → refuse (state-independent — a bid
   once accepted always counts).
3. `LIVE`/`SCHEDULED` → atomically closed (`ENDED`, `close_reason=buy_now`);
   `DRAFT`/`UNSOLD`/`CANCELLED` → purchase proceeds, auction untouched;
   `ENDED`/`AWAITING_ADMIN_APPROVAL`/`APPROVED`/`REJECTED`/`SOLD` →
   `VEHICLE_NOT_AVAILABLE` (resolution in flight or done — never silently
   purchasable).

Vehicle-level `PUBLISHED` check and the idempotent pending-order replay are
unchanged — a sold vehicle can never be bought again.

**Frontend:** `showBuyNow` mirrors the same allowlist (states, currency,
`currentBid < price`). Server remains authoritative.

**Regression coverage:** UNSOLD ≥ price refused; CANCELLED ≥ price refused;
UNSOLD below price allowed (auction untouched, vehicle RESERVED); currency
mismatch in non-live state; AWAITING/ENDED/SOLD auctions refused; SOLD
vehicle refused.

## Task 4 — Relisting architecture (proposal, not implemented)

**Current limitation:** `auctions_vehicle_idx` is a unique index on
`auctions.vehicleId` — one auction *ever* per vehicle. `createAuction`
rejects vehicles that already have an auction record.

**Proposed model (when relisting becomes a requirement):**
- Replace the unique index with a **partial unique index on active states**:
  `CREATE UNIQUE INDEX auctions_active_vehicle_idx ON auctions(vehicle_id)
  WHERE status IN ('DRAFT','SCHEDULED','LIVE','ENDED','AWAITING_ADMIN_APPROVAL','APPROVED','REJECTED')`
  — one auction in-flight at a time; `SOLD`/`UNSOLD`/`CANCELLED` rows stay
  as history.
- `createAuction` keeps its current existence check naturally via the
  index; bids/orders already key by `auctionId`, so history and
  historical-order linkage are free.
- New auction gets independent `startingPrice`/`bidIncrement`/`currency`/
  dates by construction.
- `buyNow`/`rejectOrder`/`rejectResult` must scope their auction lookup to
  the *active* row (currently `WHERE vehicle_id` + `.get()` assumes at most
  one row) — the main code change, plus the queries that join "the"
  auction (`allOrders`, vehicle detail, cards).
- Vehicle status stays authoritative for availability, so Buy Now on a
  relisted vehicle simply inspects the new auction row.

## Actual test results

| Command | Result |
|---|---|
| `pnpm typecheck` | ✅ clean |
| `pnpm build` | ✅ clean |
| `pnpm test` | **99/99 ✅** (85 baseline + 14 new; 8 files) |

New: `tests/edge-cases.test.ts` (13 unit) + 1 HTTP test
(`buy-now rejection without an explicit auctionAction is a 400`).

## Remaining edge cases (documented, not blocking)

- `buyNowCards()` catalog may list an `AUCTION_BUY_NOW` vehicle whose
  historical bid exceeds the fixed price — the detail page hides the button
  and the server refuses; a catalog-level filter is cosmetic follow-up.
- An `AWAITING_ADMIN_APPROVAL` auction requires a pending order by
  construction; the invariant "no awaiting auction without pending order"
  is enforced transactionally but not continuously monitored (could add a
  periodic consistency check to `schedulerTick` if desired).
- `rejectResult` `REOPEN` and buy-now `REOPEN` still allow only future end
  times — there is no admin UI to pick a specific timestamp (duration
  hours only).
