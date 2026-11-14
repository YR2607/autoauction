# Milestone 2.3.1 — DRAFT Auction & Vehicle Reservation Consistency

Date: 2026-11-14. Base: `7bdafc1` (M2.3, 99/99 tests).
Branch: `fix/draft-auction-reservation-guards`.

## Root cause

Buy Now is allowed while a vehicle's auction is `DRAFT` (by design — the
draft is simply left untouched). The resulting pending order reserves the
vehicle (`RESERVED`), but nothing stopped the draft from being
**scheduled → activated → LIVE**, letting bids pour into a vehicle already
under a pending purchase. Cancellation had the mirror-image hole: it
released `RESERVED → PUBLISHED` unconditionally, which could free a vehicle
still awaiting its Buy Now decision.

## Fixes (all checks inside the same transaction)

| Task | Function | Change |
|---|---|---|
| 1 | `createAuction` | requires `vehicle.status === PUBLISHED` and no pending `BUY_NOW` order |
| 2 | `scheduleAuction` | loads the vehicle; refuses when not `PUBLISHED` or a pending Buy Now order exists (`BAD_TRANSITION`, nothing mutated) |
| 3 | `cancelAuction` | refuses while **any** pending order exists on the vehicle — reservation is never silently released |
| 4 | `placeBid` | new bids on non-`PUBLISHED` vehicles → recorded `REJECTED` bid with `vehicle_unavailable`; idempotent replay of existing keys unchanged |
| 5 | `activateDueAuctions` | fail-closed: an unavailable vehicle's scheduled auction is **auto-`CANCELLED`** (reason recorded in `auction_events` + `cancelReason`, admins notified) — deterministic, never releases the reservation, never retries silently |

Files changed: `src/features/auctions/decisions.ts`,
`src/features/auctions/engine.ts`, `tests/reservation-guards.test.ts`,
`MILESTONE_2_3_1_REPORT.md`. No schema changes.

## New regression tests (`tests/reservation-guards.test.ts`, 10)

- Buy Now on a DRAFT-auction vehicle → order pending, vehicle RESERVED, draft intact
- Scheduling that draft afterwards → rejected; auction/vehicle/order unchanged
- `createAuction` on RESERVED → rejected
- Cancel with pending order → refused, reservation kept; cancel without orders still works
- New bid on RESERVED vehicle → `vehicle_unavailable` (+ idempotent replay returns same outcome)
- Scheduled auction on reserved vehicle → auto-CANCELLED, not LIVE, vehicle stays RESERVED
- Normal DRAFT → SCHEDULED → LIVE → bid flow unaffected
- Normal Buy Now on SCHEDULED and LIVE auctions still works
- Sequential: reject order → vehicle PUBLISHED → draft schedules/cancels normally

## Actual test results

| Command | Result |
|---|---|
| `pnpm typecheck` | ✅ clean |
| `pnpm build` | ✅ clean |
| `pnpm test` | **109/109 ✅** (99 baseline + 10 new; 9 files) |

## Acceptance criteria — verified

- No active auction accepts bids for a reserved vehicle (`placeBid` guard)
- No cancellation releases a vehicle with a pending purchase
- Scheduler cannot bypass availability checks (auto-cancel + admin notice)
- M2.3 behavior intact: all 99 prior tests still pass, incl. stale-order
  protection and Buy Now pricing/currency validation
- No schema changes

## Remaining notes

- `cancelAuction` blocks when ANY pending order exists (both `BUY_NOW` and
  `AUCTION_WIN`) — stricter than the task minimum, chosen because releasing
  a vehicle under an undecided purchase is never safe.
- An `AUCTION_WIN` pending order already implied `AWAITING_ADMIN_APPROVAL`
  which `cancelAuction` could not reach anyway; the guard now covers every
  combination explicitly.
