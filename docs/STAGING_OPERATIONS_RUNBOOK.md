# Staging Operations Runbook — AutoAuction

Single-process Next.js + SQLite app. One instance, one scheduler, one writer.
Do not scale horizontally — in-process SSE and the auction scheduler assume
exactly one process.

## Start / stop / restart

```bash
# Environment (staging example — adjust paths/host)
export DATABASE_PATH=/app/data/autoauction.db
export DOCUMENTS_DIR=/app/data/documents
export UPLOAD_DIR=/app/public/uploads
export APP_BASE_URL=https://staging.example.com
export EMAIL_TRANSPORT=webhook          # or outbox+EMAIL_ALLOW_OUTBOX=1 for demo
export EMAIL_WEBHOOK_URL=...            # required when webhook
export EMAIL_FROM=noreply@example.com
export NEXT_PUBLIC_CONTACT_EMAIL=...    # build-time var — rebuild to change!

# Start (production build must exist)
pnpm start                              # serves on $PORT (default 3000/3100)

# Safe stop — send SIGTERM/SIGINT; instrumentation.ts shuts down the
# scheduler interval cleanly:
kill -TERM <pid>

# Restart
kill -TERM <pid> && sleep 2 && pnpm start
```

Docker: `docker compose up -d` / `docker compose restart app` — the compose
file already wires `aa-data` and `aa-uploads` named volumes and
`restart: unless-stopped`.

## Migrations

```bash
pnpm db:migrate    # auto-writes a pre-migration backup to data/backups/ first
```

Migrations run automatically at container boot (`CMD pnpm db:migrate && pnpm start`).
Never run `pnpm db:reset` or `pnpm db:seed` against staging/production —
`db:seed` refuses in production unless `ALLOW_DEV_SEED=1` (keep it unset).

## Backups

```bash
pnpm db:backup                    # → data/backups/autoauction-<ts>.db
DATABASE_PATH=/app/data/autoauction.db pnpm db:backup /backups
BACKUP_KEEP=20                    # optional rotation count (default 10)
```

- Online SQLite backup API — safe while the app runs (WAL-consistent).
- Each backup is `PRAGMA quick_check`-verified before it's kept.
- Schedule: cron every 6 h + copy `data/backups/` off-box (rsync/S3).

## Restore

```bash
# STOP THE APP FIRST
pnpm db:restore data/backups/autoauction-<ts>.db
# Script: integrity-checks source, snapshots current db to
# <db>.pre-restore-<ts>, clears -wal/-shm, copies, chmod 0600, re-checks.
pnpm start
```

Always test a restore into an isolated path first:
`DATABASE_PATH=/tmp/restore-check.db pnpm db:restore <file>`.

## Logs

- App logs to stdout/stderr (`staging/server.log` locally; `docker compose
  logs -f app` in Docker).
- Email outbox transport appends to `data/outbox.log`.
- Scheduler failures print `scheduler tick failed` + error — grep for it.

## Health checks

```bash
curl -fsS http://localhost:3300/api/health
# → {"ok":true,"db":"ok","uptime":N,"time":N}   (503 on failure)
```

If unhealthy: check the process is running → check `data/` disk space and
permissions → check last log lines → check WAL files exist next to the db.

## Disk space

```bash
df -h /app/data /app/public/uploads
du -sh data/ public/uploads/ data/backups/
```

SQLite db + WAL grow with bids/events; uploads grow with vehicle images.
Alert threshold suggestion: >80% volume usage.

## Monitoring (minimal viable)

| Signal | How |
|---|---|
| Availability | cron/uptime probe → `GET /api/health` expect `ok:true` |
| HTTP 5xx | proxy access-log rate (nginx `$status`) |
| Disk space | `df` alert at 80% |
| DB size | `stat data/autoauction.db` growth trend |
| Scheduler | log-watch for `scheduler tick failed`; verify a known SCHEDULED auction flips to LIVE at startsAt |
| Backups | alert if newest file in `data/backups/` older than 24 h |
| Email | webhook 5xx → app throws, logged as send failure; outbox → check `data/outbox.log` growth |

## Failed-deployment recovery

1. `pnpm db:backup` (safety snapshot).
2. Roll back code to last green commit / image tag.
3. `pnpm build && pnpm start` — migrations are forward-only; if a bad
   migration slipped in, restore the pre-migration backup in `data/backups/`.
4. Verify `/api/health`, then log in and place a test bid on a throwaway lot.

## Scheduler verification

The scheduler ticks every 5 s (`src/instrumentation.ts`). To verify:
```sql
SELECT id, status, starts_at, ends_at FROM auctions WHERE status='SCHEDULED';
```
Watch one transition to `LIVE` at `starts_at`, or check
`auction_events` for recent `scheduled start`/`expired` entries.
