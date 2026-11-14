# Milestone 2.2 — Admin Workflow Consistency & Final Business Logic Audit

Date: 2026-11-14. Base: `33ce86f` (M2.1, 67/67 tests).

## Task 1 — Single authoritative approval workflow

**Problem confirmed:** `/admin/orders` rendered generic Approve/Reject for
`AUCTION_WIN` orders. `approveOrder()` marked the order APPROVED but left the
auction `AWAITING_ADMIN_APPROVAL` (the `ENDED`-only recovery check didn't
fire) — order decided, auction orphaned in the approvals queue.

**Fix:**
- `approveOrder(orderId)` → if `type === "AUCTION_WIN"` delegates to
  `approveResult(auctionId)` before opening its own transaction.
- `rejectOrder(orderId, …, opts.next)` → for `AUCTION_WIN` requires
  `next ∈ {REOPEN, NEXT_BIDDER, UNSOLD}` and delegates to `rejectResult`;
  missing `next` → `BAD_TRANSITION` (400 via API).
- `POST /api/admin/orders/:id` reject body now accepts `next`.
- `/admin/orders`: pending `AUCTION_WIN` rows show a read-only notice +
  link to `/admin/approvals` instead of action buttons. Approved orders
  (incl. `AUCTION_WIN`) keep the "Mark completed" action.
- Net effect: no API or UI path can decide an `AUCTION_WIN` order without
  resolving the auction.

## Task 2 — Unified Buy Now rejection UI

- `/admin/approvals` Buy Now section used `OrderActions` without the
  recovery choice → silent `UNSOLD` default while `/admin/orders` offered
  `REOPEN`/`UNSOLD`. `pendingOrderRows()` now joins the auction; both pages
  compute `endedByBuyNow` identically.
- `OrderActions` reject modal gained a **configurable reopen duration**
  (hours input, default 24, sends `newEndsAt`). `ApprovalActions` already
  had it — the two entry points now produce identical payloads.

## Task 3 — Buy Now pricing rules

**Reviewed:** `currentBid`, `startingPrice`, `bidIncrement` are auction-currency
values; `buyNowPrice`/`buyNowCurrency` are vehicle values. Two
inconsistencies existed:

1. A bid meeting/exceeding the fixed price did not disable Buy Now → a later
   shopper could buy for *less* than the accepted bid.
2. `createAuction` allowed an auction currency ≠ `buyNowCurrency` on a
   combined listing, making any price comparison meaningless.

**Fix (server-side):**
- `buyNow()` refuses when `auction.currentBid >= buyNowPrice`
  (`BUY_NOW_UNAVAILABLE`) and when currencies differ (`BUY_NOW_UNAVAILABLE`,
  treated as misconfiguration rather than silently comparing).
- `createAuction()` rejects a currency mismatch on `AUCTION_BUY_NOW`
  listings up front.
- Vehicle page also hides the Buy Now button when the bid reached the price
  (UX only — the server remains the authority).

**Documented interpretation:** "current bid meets the fixed price" is
compared as `currentBid >= buyNowPrice` (equal counts — the market already
offers the fixed price). No change to `startingPrice`/`bidIncrement` rules.

## Task 4 — Repository history verification

Verified via the public GitHub API (2026-11-14):

- Branches: `main` only. Tags: none. PRs: none. Forks: none.
- Current `main` tree: **zero** database/backup artifacts.
- **Old commit `44edf97` remains resolvable** through the API and its tree
  still lists the historical dumps (`data/*.db*`, `data/backups/*.db*`).
  Same applies transitively to other rewritten SHAs
  (`e5fd711, 5c046b4, 2233e73, c150b20`).
- GitHub keeps unreachable objects until its own GC/cache expiry — this is
  expected after a force-push and is NOT a new exposure vector (no ref
  points there). GitHub's documented removal path for cached data is a
  support request via https://support.github.com → "Sensitive data removal",
  referencing repo `YR2607/autoauction` and SHAs above.
- **Support request deferred:** the dumps contain only development accounts
  with hashes of already-public seed passwords and un-reversible session
  hashes — low sensitivity. If the repo owner wants the objects deleted
  anyway, file the request with the SHAs listed; no further history rewrite
  is needed (a verified pre-rewrite backup exists locally).

## Task 5 — Regression tests added

- `tests/admin-workflow.test.ts` — 12 unit tests: delegation of
  approve/reject for `AUCTION_WIN`, refusal without `next`, NEXT_BIDDER via
  the order path, buy-now-below-bid rule (meet/exceed/refuse), currency
  mismatch at creation and at purchase, reopen honoring chosen end time,
  no duplicate pending orders.
- `tests/http.test.ts` — 6 HTTP tests: approve via auctions endpoint,
  delegated approve/reject via orders endpoint, reject without `next` → 400,
  read-only notice on `/admin/orders` page HTML, buy-now REOPEN with
  explicit `newEndsAt` over HTTP.

## Actual test results

| Command | Result |
|---|---|
| `pnpm typecheck` | ✅ clean |
| `pnpm build` | ✅ clean |
| `pnpm test` | **85/85 ✅** (67 baseline + 18 new; 7 files) |

## Unresolved business decisions

- Reopened auction duration: admin-chosen per decision (24 h default);
  whether a platform-level setting is wanted is open.
- Currency mismatch on *legacy* rows is refused at purchase time; there is
  no admin repair UI to fix a misconfigured listing (can be added if real
  data ever hits it — currently impossible to create).
- `NEXT_BIDDER` skips rejected *winners* but keeps their bids in history and
  in the min-bid math — intended and documented; flag if buyers should
  instead see their bids excluded from pricing.

## Remaining technical risks

- Dangling GitHub objects for pre-rewrite SHAs until GitHub GC (documented
  above; support request prepared if desired).
- Admin UIs are server-rendered; the read-only Orders view was verified via
  HTML assertion, not a browser E2E.
