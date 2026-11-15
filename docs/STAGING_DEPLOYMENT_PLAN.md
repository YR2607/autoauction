# Staging Deployment Plan — AutoAuction

Scope: a controlled staging environment for client demonstration and QA.
This plan does NOT cover production. The PR is not merged by this work.

## Architecture constraints (fixed by design)

- **One Node.js process.** SQLite + WAL allows many readers / one writer —
  the app assumes a single writer process (scheduler, anti-sniping timers,
  SSE fan-out all live in-process). Deploy exactly **one replica**.
- **Never run two app instances against the same SQLite file** (no
  multi-replica / no shared-disk second node). Scaling out requires a
  migration to a client-server DB — out of scope.
- **Persistent disk is required** — an ephemeral filesystem loses the
  database, private documents and uploaded images.

## Persistent volumes

| Path (container) | Contents | Notes |
|---|---|---|
| `/app/data` | `autoauction.db` (+ `-wal`/`-shm`), `data/documents/` (private docs), `data/backups/` | Must survive redeploys. `app` user must own it (Dockerfile already `chown`s). |
| `/app/public/uploads` | public vehicle images | Persistent volume, same lifecycle as `/app/data`. |

The provided `Dockerfile` runs a single `node:22-alpine` container:
`pnpm db:migrate && pnpm start` on port `3100`. `docker-compose.yml` maps
named volumes `aa-data` and `aa-uploads`. On any VM/bare-metal staging box
the equivalent is a dedicated disk for `./data` and `./public/uploads`.

## SQLite settings

- WAL is enabled by `src/lib/db/index.ts` (`PRAGMA journal_mode=WAL`) — keep
  the `-wal`/`-shm` sidecars on the same filesystem as the db.
- Do not put the db on NFS/synchronized folders — WAL requires real file
  locking semantics; use local block storage.
- File permissions: `restore.mjs` sets `0600` on the db; keep `data/` at
  `0700` and owned by the runtime user (`app` in the image).

## Environment variables (names only — never commit values)

| Variable | Staging value / note |
|---|---|
| `NODE_ENV` | `production` (build + runtime) |
| `PORT` | `3100` (or platform-assigned) |
| `DATABASE_PATH` | `./data/autoauction.db` on the persistent volume |
| `APP_BASE_URL` | `https://staging.<domain>` — used in reset emails/links |
| `SESSION_COOKIE_NAME` | `aa_session` |
| `UPLOAD_DIR` | `./public/uploads` |
| `DOCUMENTS_DIR` | `./data/documents` |
| `EMAIL_TRANSPORT` | `webhook` — real provider — **or** `outbox` **only with** `EMAIL_ALLOW_OUTBOX=1` (messages appended to `data/outbox.log`; acceptable for a closed demo env, documented behavior: no real email leaves the box) |
| `EMAIL_WEBHOOK_URL` | provider endpoint (required when `webhook`) |
| `EMAIL_FROM` | sender address |
| `NEXT_PUBLIC_CONTACT_EMAIL` | public contact shown in footer/legal pages |
| `BACKUP_KEEP` | `10` (optional, backup rotation) |

### Explicitly NOT set in staging

| Variable | Why |
|---|---|
| `ALLOW_DEV_SEED` | `src/lib/db/seed.ts` refuses to run in production without it — that guard is intentional. Staging data is created through the UI/admin, not the dev seed. |
| `EMAIL_ALLOW_OUTBOX` | leave unset unless the outbox transport is deliberately chosen above. |

### HTTPS / cookies

- Session cookie flags (`src/app/api/auth/login/route.ts`): `httpOnly`,
  `sameSite=lax`, `secure` **only when `NODE_ENV=production`** — therefore
  staging must run `NODE_ENV=production` **behind HTTPS** (TLS-terminating
  reverse proxy in front of the Node process). Plain HTTP + `secure` cookie
  = login silently fails.

## Deploy procedure

1. Provision host + two persistent mounts (`data`, `public/uploads`).
2. Build: `docker build -t autoauction .` or `pnpm install --frozen-lockfile && pnpm build`.
3. Configure env vars per table above; never log them.
4. **First boot runs `pnpm db:migrate`** (Dockerfile CMD) which automatically
   writes a pre-migration backup into `data/backups/` before applying any
   pending migrations — verified working (see below).
5. Terminate TLS at the proxy; forward to the Node process.
6. Smoke test per `docs/STAGING_SMOKE_TEST_REPORT.md`.

### Migration safety protocol

- `db:migrate` already performs a **pre-migration backup** automatically.
- For manual belt-and-braces before a risky deploy:
  `pnpm db:backup` → verify `integrity ok` in output.
- Never run `db:reset`/`db:seed` against staging — `db:reset` deletes the
  database file and is dev-only.

## Backup / restore (verified on this branch)

- `pnpm db:backup [destDir]` — SQLite online backup API (safe under WAL,
  app can keep running), writes `autoauction-<ts>.db`, runs
  `PRAGMA quick_check`, rotates to `BACKUP_KEEP` (default 10).
- `pnpm db:restore <file>` — integrity-checks source, snapshots the current
  db to `<db>.pre-restore-<ts>` before overwriting, clears `-wal`/`-shm`,
  copies, sets `0600`, re-checks integrity. **Stop the app first.**
- Schedule: cron `pnpm db:backup` on the staging host; ship `data/backups/`
  off-box (S3/rsync) for anything beyond demo use.

### Restore verification evidence (2026-11-15)

```
source.db   : migrated schema (16 tables) + marker row 'marker-42'
backup      : autoauction-2026-11-15T07-51-41-867Z.db (258048 bytes, integrity ok)
restore     : → tests/tmp/verify/restored.db (integrity ok)
restored db : marker='marker-42', 17 tables — data intact
```

## Known staging limitations

- No online payment — admin handles payment manually by design. Do not
  present a checkout as functional.
- Outbox email transport writes to `data/outbox.log` (no real delivery)
  unless `webhook` is configured.
- Single instance only — no horizontal scaling, no zero-downtime deploys
  (brief restart window on deploy is expected).
