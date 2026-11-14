# Development Roadmap — AutoAuction MVP

## Milestones

| # | Phase | Deliverable | Status |
|---|---|---|---|
| M0 | Inspection & docs | Spec ×5, plan, stack confirmed (Next.js + SQLite) | ✅ done |
| M1 | Foundation | Scaffold, Tailwind theme, design system, DB schema + migrations + seed, auth + RBAC, layouts | 🚧 in progress |
| M2 | Public website | Home, Catalog (+filters/sort/pagination), Auctions, Buy Now, Vehicle Details | ⬜ |
| M3 | Auction engine | placeBid txn, Buy Now txn, lifecycle transitions, SSE broadcast, scheduler, extension, finalization | ⬜ |
| M4 | Admin panel | Dashboard, vehicle CRUD + wizard + media, auction mgmt, bids, approvals, users, orders, settings | ⬜ |
| M5 | Account area | Dashboard, profile, my bids, purchases, favorites, notifications | ⬜ |
| M6 | Hardening | Tests (engine/concurrency/security/UI), SEO basics, security review, deploy config | ⬜ |

## Verification harness

- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — eslint
- `pnpm test` — vitest (engine, transactions, auth, security)
- `pnpm build` — production build must pass

## Key risks & mitigations

| Risk | Mitigation |
|---|---|
| Concurrent double-bid/double-buy | better-sqlite3 serialized txns + idempotency keys + tests simulating N parallel bids |
| Timer correctness | Server-side only; scheduler re-evaluates every 5 s; countdown is cosmetic |
| SQLite multi-process | Documented constraint: single Node process (fine for MVP); WAL mode on |
| SSE in serverless | We target a Node server (`next start`), not edge — documented |

## Decision log

- 2026-11-14 — DB: **SQLite** (client) via better-sqlite3+Drizzle; auth/SSE/local
  storage replace Supabase equivalents.
- 2026-11-14 — Bid dedup via unique `(auctionId, idempotencyKey)`.
- 2026-11-14 — Rejected bids persisted for audit, never rendered as history.
