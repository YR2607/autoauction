# Milestone 2.1 — Critical Business Logic Fixes & Repository Security

Date: 2026-11-14. See `REPOSITORY_SECURITY_CLEANUP.md` for the history purge.

## Fixes

### Task 2 — Buy Now on scheduled auctions
- `buyNow()` crashed with `BAD_TRANSITION` on SCHEDULED auctions
  (SCHEDULED → ENDED was not in the transition map).
- Added `SCHEDULED → ENDED` for terminal actions that bypass LIVE.
- New `auctions.close_reason` column (`expired` | `buy_now`, migration
  `0002_exotic_invaders`) records *why* an auction left LIVE/SCHEDULED —
  the basis for the recovery model.

### Task 3 — Rejected Buy Now recovery
- Previously `rejectOrder()` left the buy-now-ended auction stuck at ENDED
  with no recovery path.
- `rejectOrder(orderId, admin, reason, { auctionAction, newEndsAt })`:
  - `REOPEN` → `ENDED → LIVE` with a future `endsAt` (default +24h, validated),
    `finalizedAt`/`closeReason` cleared, **all bid history preserved**;
  - `UNSOLD` (default) → `ENDED → UNSOLD`;
  - refuses REOPEN when the vehicle is already sold through another order;
  - API + admin UI (radio choice shown only for buy-now-ended orders).
- `rejectResult` REOPEN now also validates `newEndsAt > now`.

### Task 4 — NEXT_BIDDER correction
- Old code excluded only the buyer of the *current* rejected order — a
  previously rejected winner could be offered the lot again.
- Now excludes **every buyer with a REJECTED order on the auction**;
  exactly one new pending order per offer (also enforced by
  `orders_pending_vehicle_idx`); no eligible bidder → UNSOLD.

## Regression tests added (`tests/lifecycle.test.ts`, 9 tests)

- Buy Now on a SCHEDULED auction (was throwing, now closes + reserves)
- Buy Now after auction expiration → refused, winner's order intact
- Concurrent Buy Now on scheduled auction → exactly 1 order
- Reject buy-now-ended auction + UNSOLD → statuses consistent, bids kept
- Reject + REOPEN → LIVE, bids preserved (min-bid still enforced), past
  end time refused
- Audit/event trail records recovery decisions
- 3 consecutive NEXT_BIDDER rejections → w3→w2→w1→UNSOLD, no re-offers,
  3 orders total, zero pending
- No eligible bidder → UNSOLD immediately

## Actual test results

| Suite | Result |
|---|---|
| `pnpm typecheck` | ✅ clean |
| `pnpm build` | ✅ clean |
| Unit tests (5 files) | 50/50 ✅ |
| HTTP integration (`next start`, fresh DB) | 17/17 ✅ |
| **Total** | **67/67** ✅ |

## Remaining risks

- Old commit SHAs may remain reachable on GitHub until its caches expire
  (documented in the security report).
- Reopen defaults to +24h; a configurable default is a possible follow-up.
- Admin cannot yet pick the reopened end time in the UI (API supports
  `newEndsAt`; UI uses the 24h default).
