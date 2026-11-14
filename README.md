# AutoAuction

Premium car auction MVP — Next.js 16 (App Router) + TypeScript + Tailwind v4 + **SQLite** (better-sqlite3 + Drizzle) + custom session auth + SSE realtime.

## Quick start

```bash
pnpm install
pnpm db:migrate   # apply SQL migrations from ./drizzle
node scripts/generate-seed-images.mjs   # dev placeholder images
pnpm db:seed      # sample vehicles/auctions/users (dev data)
pnpm dev          # http://localhost:3000
```

Seed logins (dev only):
- Admin: `admin@autoauction.dev` / `admin12345`
- Buyer: `buyer@autoauction.dev` / `buyer12345`

## Commands

| cmd | what |
|---|---|
| `pnpm dev` / `build` / `start` | Next.js |
| `pnpm typecheck` | tsc --noEmit |
| `pnpm test` | vitest — auction engine, concurrency, approvals |
| `pnpm db:generate` | drizzle-kit: new SQL migration |
| `pnpm db:migrate` / `db:seed` / `db:reset` | DB lifecycle |

## Architecture notes

- **Auction engine**: `src/features/auctions/engine.ts` — all bidding inside
  serialized better-sqlite3 transactions (no lost updates, no double winners).
- **Idempotent bids** via unique `(auctionId, idempotencyKey)`.
- **Realtime**: SSE broadcasts only; server state is authoritative
  (`/api/auctions/:id/state` refetch on every event).
- **Scheduler**: `src/instrumentation.ts` ticks every 5 s — promotes/finalizes auctions.
- **Money**: integer minor units + currency CHAR(3); no floats.
- Docs: `PRODUCT_SPECIFICATION.md`, `TECHNICAL_ARCHITECTURE.md`,
  `DATABASE_SCHEMA.md`, `BUSINESS_RULES.md`, `DEVELOPMENT_ROADMAP.md`.
