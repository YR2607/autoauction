# Milestone 2 — Independent Audit & Production Hardening Report

Date: 2026-11-14 · Scope: full backend audit + production-critical gaps.
Method: code inspection, live diagnostics, unit + HTTP integration testing.

## 1. Database diagnostics (actual measurements)

| Check | Result | Status |
|---|---|---|
| SQLite runtime (better-sqlite3) | **3.54.1** | ✅ WAL-reset fix included (≥3.51.3) |
| sqlite3 CLI (system, macOS) | 3.51.0 | ⚠️ predates WAL-reset fix — documented "no writes against live DB" |
| journal_mode | wal | ✅ |
| foreign_keys | ON (per-connection, enforced in app) | ✅ |
| busy_timeout | 5000 ms | ✅ |
| synchronous | was NORMAL → **now FULL** | fixed |
| DB file location | `data/autoauction.db` (env `DATABASE_PATH`) | ✅ |
| File permissions | was 644 → **600** (enforced at connect) | fixed |
| integrity_check | ok | ✅ |
| Migrations | journal-ordered, transactional per file | ✅ |
| Pre-migration backup | was none → **automatic snapshot** | fixed |
| Backup/restore | was none → `pnpm db:backup` / `pnpm db:restore` (verified, integrity-checked, rotated) | fixed |
| Diagnostics | `pnpm db:diagnose` added | fixed |

## 2. Confirmed issues found & fixed

### Data integrity / auction engine
| # | Issue | Fix |
|---|---|---|
| B1 | Idempotency key unique on (auctionId, key): a second user reusing a key received *another user's* bid result | Scope changed to (auctionId, userId, key); migration `0001` |
| B2 | No DB-level guard against duplicate pending orders | Partial unique index `orders_pending_vehicle_idx` (`WHERE status='PENDING_APPROVAL'`) |
| B3 | Double-clicked Buy Now returned a hard 409 | Idempotent replay: returns the same pending order |
| C1 | **SSE listener leak**: `cancel()` called `removeAllListeners(channel)` — one client disconnecting killed every subscriber of that auction | Fixed: removes only its own listener |
| C2 | Expired sessions/reset tokens accumulated forever | `cleanupExpiredAuth()` in every scheduler tick |

### Security
| # | Issue | Fix |
|---|---|---|
| D1 | Image upload trusted client-declared `Content-Type` — HTML could be stored & served as `.png` (stored-XSS vector) | Magic-byte sniffing (`src/lib/media.ts`), extension derived from content |
| D2 | No security headers | nosniff, frame-deny, CSP, permissions-policy, Referrer-Policy; `/uploads/*` sandboxed |
| D3 | scrypt N=16384 (below OWASP recommendation) | N=32768 + maxmem; stored params keep old hashes verifiable |
| D4 | Password change left all other sessions alive | `destroyUserSessions` on change; reset kills all |
| D5 | Dev seed could run in production (known weak creds!) | `NODE_ENV=production` guard (`ALLOW_DEV_SEED=1` override) |
| D6 | Per-IP rate limit only — distributed single-account attack possible | Added per-account bucket on login |
| D7 | `vehicle_documents` existed but had no upload/serve path — and `public/uploads` would have been the wrong place | Private store `data/documents/` (chmod 600), authorized route `/api/documents/[id]` (public → open; private → admin only) |
| D8 | Path-traversal surface in image upload (vehicle id interpolated into fs path) | ID regex-validated before use; doc paths resolved inside store root |

### Missing functionality (implemented)
| # | Feature | Implementation |
|---|---|---|
| E1 | Photo reorder + cover selection | `PATCH /api/admin/vehicles/[id]/images` + UI controls |
| E2 | Document upload/manage UI | `DocumentManager` on the admin vehicle page |
| E3 | Password reset | 30-min single-use tokens (SHA-256 in DB only), atomic claim tx, session revocation, `/forgot-password` + `/reset-password` pages |
| E4 | Email delivery | Adapter: `outbox` (dev → `data/outbox.log`) / `webhook` (prod, `EMAIL_WEBHOOK_URL`). No fake delivery: prod without config → 503 |
| G1 | Health endpoint | `GET /api/health` (db probe + sqlite version) |
| G2 | Graceful shutdown | SIGTERM/SIGINT → stop scheduler + close SQLite |
| G3 | Deployment | Dockerfile + compose (1 replica, volumes), `docs/DEPLOYMENT.md`, systemd example |
| G4 | `GET /api/profile` | needed for session checks + tests |

## 3. Test results (all actually executed)

| Suite | Result |
|---|---|
| `pnpm typecheck` | ✅ clean |
| `pnpm build` | ✅ clean (warnings only: instrumentation uses Node APIs — expected on nodejs runtime) |
| Unit tests (engine, decisions, concurrency, password-reset) | **41/41** ✅ |
| HTTP integration tests (real `next start`, fresh DB) | **17/17** ✅ |
| **Total** | **58/58** ✅ |

Concurrency verified: 5-user identical-amount race → 1 accepted/4 rejected; bid-vs-buy-now; double finalize → 1 order; double approve → second throws; restart-after-expiry finalizes correctly.

HTTP coverage: register/login/logout, expired & suspended sessions, 401/403 guards, admin API, bid over HTTP, rate limit 429, spoofed-MIME upload rejection, private/public document access, image reorder/cover, full password-reset flow over the wire.

Backup/restore verified live: `backup → integrity ok → restore → vehicles=12`.

## 4. Remaining production blockers

None critical. Watchlist:

- **Single-process topology** is a hard requirement (documented). No horizontal scaling without an external pub/sub for SSE + leader-elected scheduler.
- `EMAIL_TRANSPORT=webhook` is the only production transport — wire a real mail endpoint (or add SMTP later).
- better-sqlite3 native module must be rebuilt for the container (`pnpm approve-builds` already configured; Dockerfile installs prebuilds via node-gyp toolchain on alpine — verify first build on target).
- No rate-limit persistence across restarts (in-memory, single node — acceptable for MVP).
- Payments deliberately out of scope (per spec).
