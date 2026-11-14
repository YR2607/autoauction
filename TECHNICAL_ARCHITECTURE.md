# Technical Architecture — AutoAuction MVP

## 1. Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router), TypeScript strict | Single deployable, SSR + Route Handlers |
| Styling | Tailwind CSS v4 + own component kit (shadcn-style) | Premium design control |
| Database | **SQLite via `better-sqlite3` + Drizzle ORM** | Per client decision (replaces Supabase) |
| Migrations | `drizzle-kit` versioned SQL migrations | Reproducible schema |
| Auth | Custom: `scrypt` password hashing, DB sessions, httpOnly cookie | No external dependency |
| Realtime | **SSE (Server-Sent Events)** + in-process event bus | Single-node deploy (SQLite) makes this reliable and simple; clients refetch authoritative state on event |
| Media | Local filesystem `public/uploads` + DB metadata | Simple, replaceable by S3 later |
| Jobs | In-process scheduler (`node-cron`-style `setInterval` runner) | Finalize expired auctions, schedule live auctions |
| Tests | Vitest (unit + engine) | Fast, runs against real SQLite file |

## 2. Why `better-sqlite3` matters for the auction engine

`better-sqlite3` executes synchronously inside a single connection, and SQLite
serializes writers by design. Wrapped in `db.transaction(...)` (Drizzle sync
transaction ⇒ SQLite `BEGIN IMMEDIATE`), a bid acceptance is:

```
BEGIN IMMEDIATE
  re-read auction row (status, endsAt, currentBid, increment)
  validate rules
  insert bid (status = ACCEPTED)
  update auction (currentBid, highestBidderId, bidCount, extendedEndsAt?)
COMMIT
```

Concurrent HTTP requests serialize at the writer lock — **no lost updates, no
double winners, no duplicated accepted bids** without distributed locks.
A unique `idempotencyKey` (client-generated UUID) makes retries safe.

## 3. Source of truth

SQLite is authoritative for: current bid, bid history, auction status, end time,
winner, purchase status. SSE only *broadcasts*; it never decides outcomes.
Clients always hydrate auction state from the server (`GET /api/auctions/:id/state`).

## 4. Module boundaries

```
src/
  app/
    (public)/            # home, catalog, auctions, buy-now, vehicle details
    (auth)/              # login, register
    account/             # buyer dashboard (protected)
    admin/               # admin panel (protected, role=admin)
    api/                 # route handlers
  components/
    ui/                  # design system primitives
    layout/              # header, footer, nav
    vehicles/ auctions/  # feature components
    admin/ account/
  features/
    auctions/engine.ts   # placeBid, buyNow, finalize, transitions — pure domain
    auctions/lifecycle.ts
    bids/ orders/ favorites/ notifications/ vehicles/ users/ settings/
  lib/
    db/                  # connection, schema, migrations runner, seed
    auth/                # sessions, password hashing, guards
    validation/          # zod schemas
    currency/            # money formatting, minor units
    realtime/            # event bus + SSE helpers
    rate-limit/          # simple in-memory limiter
  config/                # defaults read from platform_settings
tests/                   # vitest suites
public/uploads/          # vehicle media (gitignored)
drizzle/                 # generated migrations
```

Rule: `features/*` hold domain logic usable from both Route Handlers and tests —
**no business logic inside React components**.

## 5. Money & time

- All money stored as **integer minor units** (cents) + `currency CHAR(3)`.
- Formatting centralized in `lib/currency` (`Intl.NumberFormat`).
- Timestamps stored as UTC unix-ms integers; display per platform timezone.

## 6. Security

- RBAC: `role ∈ {buyer, admin}` enforced server-side on every handler.
- Input validation: `zod` schemas at every API boundary.
- Rate limiting on `/api/auth/*` and `/api/auctions/:id/bids`.
- Uploads: MIME + size validation, randomized filenames, private docs under
  `uploads/private/` served via authorized handler only.
- VIN masked publicly (last 4 chars) unless `vinVisibility` allows more.
- Sessions: 256-bit random token, httpOnly + SameSite=Lax cookie, 30-day expiry,
  rotation on privilege change. CSRF: SameSite=Lax + origin check on mutations.
- Audit log for every admin mutation — append-only.

## 7. Non-goals

No microservices, no message broker, no Redis. Single Node process + single
SQLite file — the correct size for this MVP and trivially portable.
