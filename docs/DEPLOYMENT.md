# Deployment — AutoAuction on SQLite

## Architecture constraints (READ FIRST)

This app is a **single-writer SQLite system**. Deploy it as **exactly one
long-running Node.js process** per database file.

| Component | Where it runs | Persistence |
|---|---|---|
| Next.js app + API | one Node process (`next start`) | — |
| Auction scheduler | in-process (`instrumentation.ts`, 5s tick) | — |
| SSE bus | in-process (`globalThis`) | — |
| Database | `data/autoauction.db` (WAL mode) | persistent volume required |
| Private documents | `data/documents/` | persistent volume required |
| Public images | `public/uploads/` | persistent volume required |

**Do NOT deploy to serverless/edge platforms** (Vercel serverless functions,
Lambda, etc.) — ephemeral filesystems break the database, the in-process
scheduler and the SSE bus.

Multiple instances against one DB file are safe for *correctness* (serialized
transactions + idempotent ticks), but SSE events only reach clients connected
to the emitting instance — run **one replica** or accept that limitation
behind a sticky-session load balancer.

## Option A — Docker (recommended)

```bash
docker compose up -d --build
```

`docker-compose.yml` provisions two volumes (`aa-data`, `aa-uploads`), a
healthcheck on `/api/health`, and runs `db:migrate` on boot. Set
`EMAIL_TRANSPORT`/`EMAIL_WEBHOOK_URL` and `APP_BASE_URL` in the compose env.

## Option B — Bare metal / VM with systemd

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm db:migrate          # applies migrations, snapshots a backup first
DATABASE_PATH=/srv/autoauction/data/autoauction.db pnpm start
```

Example unit (`/etc/systemd/system/autoauction.service`):

```ini
[Unit]
Description=AutoAuction
After=network.target

[Service]
Type=simple
User=autoauction
WorkingDirectory=/srv/autoauction
Environment=NODE_ENV=production PORT=3100 DATABASE_PATH=/srv/autoauction/data/autoauction.db
Environment=APP_BASE_URL=https://auctions.example.com EMAIL_TRANSPORT=webhook EMAIL_WEBHOOK_URL=https://mail.example.com/hook
ExecStart=/srv/autoauction/node_modules/.bin/next start -p 3100
Restart=on-failure
RestartSec=3
KillSignal=SIGTERM      # graceful shutdown closes SQLite cleanly

[Install]
WantedBy=multi-user.target
```

Put a TLS-terminating reverse proxy (nginx/Caddy) in front. `Secure` cookies
are enabled automatically under `NODE_ENV=production`.

## Backups

```bash
pnpm db:backup           # online, WAL-safe, verified, rotates (BACKUP_KEEP=10)
pnpm db:restore <file>   # stop the app first
```

Schedule via cron: `0 3 * * * cd /srv/autoauction && pnpm db:backup`

Restore procedure:

1. `systemctl stop autoauction`
2. `pnpm db:restore /path/to/backup.db` — verifies integrity, snapshots the
   current file to `*.pre-restore-*` before overwriting
3. `systemctl start autoauction`
4. Check `pnpm db:diagnose` and `/api/health`

## Rollback

- Code: redeploy the previous image/commit, run `pnpm db:migrate` (it is
  forward-only — restoring an older database snapshot may be required for
  destructive migrations; that's what pre-migration backups are for).
- Data: use the restore procedure above.

## Health & diagnostics

- `GET /api/health` → `{ ok, db, sqlite, uptime }` (503 on failure)
- `pnpm db:diagnose` → engine version, pragmas, integrity check, table counts

## Required env vars (production)

| Var | Purpose |
|---|---|
| `DATABASE_PATH` | absolute path to the SQLite file on a persistent volume |
| `APP_BASE_URL` | public origin (used in password-reset emails) |
| `EMAIL_TRANSPORT` | `webhook` (production) or `outbox` (dev only) |
| `EMAIL_WEBHOOK_URL` | mail delivery endpoint when transport=webhook |
| `DOCUMENTS_DIR` | private document store (default `data/documents`) |

## Security notes

- Never run `pnpm db:seed` in production (it self-blocks unless
  `ALLOW_DEV_SEED=1`).
- The dev system's `sqlite3` CLI (3.51.0) predates the WAL-reset fix — don't
  run *write* queries with it against the live WAL database; use
  `pnpm db:diagnose` (better-sqlite3 3.54.x) instead.
- Database file is chmod 600; keep it out of any publicly served directory.
