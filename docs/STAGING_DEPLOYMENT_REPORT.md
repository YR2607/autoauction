# Staging Deployment Report — AutoAuction

Date: 2026-11-15

## Merge

- **PR #1 merged**: `6a46115ccbc278be3d19e2b1314b7b06e7ea3d74` — merge commit
  preserving all 12 design-branch commits.
- **PR #2 merged** (follow-up): `71667313ad626c299c6652ee80b23badd1762936` —
  health endpoint no longer exposes the SQLite version (M4 requirement).
- Current `main` HEAD: `7166731`.
- Milestone 2.3.1 reservation guards (`320ad58`) verified ancestor of main.

## CI

- Main-head CI run: https://github.com/YR2607/autoauction/actions/runs/43703088140 → **success**
- PR #2 head CI run (branch `fix/health-endpoint-disclosure`): `43703254064` → **success**
- Pipeline: install (`--frozen-lockfile`) → typecheck → build → test.
- Latest test count: **127/127**.

## Branch protection (configured — repo admin token used)

- Required status check: `verify` (strict — branch must be up to date).
- Required PR reviews: 1 approval, stale approvals dismissed on new pushes.
- Force pushes and branch deletion on `main`: disabled.
- `enforce_admins`: false (admins may still merge/push — pragmatic for a
  solo-maintainer repo; flip to true for a team).

## Deployment topology (this staging instance)

Local staging — a real production-mode deployment on the development host
**instead of a VPS** (no VPS/Docker/DNS access was available; documented
blocker). Everything else matches `STAGING_DEPLOYMENT_PLAN.md`:

- **One Node.js process** — `pnpm start` on `:3300`, `NODE_ENV=production`.
- **One SQLite db** — `staging/data/autoauction.db` (WAL, `0600`, dir `0700`).
- **One scheduler** — in-process 5 s tick, single instance.
- **Persistent storage**: `staging/data/` (db + private documents + backups)
  and `public/uploads/` (vehicle images) — real filesystem, survives restarts
  (verified by process restart below).
- **Email**: `outbox` transport + `EMAIL_ALLOW_OUTBOX=1` — messages append to
  `data/outbox.log`; no real delivery (demo-safe, documented).
- **HTTPS**: not applicable on localhost; on a VPS terminate TLS at the
  reverse proxy — session cookies are `secure` only under
  `NODE_ENV=production`, so HTTPS is mandatory there.
- **Reverse proxy**: not needed on localhost; on VPS use nginx/Caddy with
  `client_max_body_size ≥ 12 MB` (upload limit is 10 MB).
- **No public URL**: staging is reachable only as `http://localhost:3300` —
  a VPS + DNS + TLS remains the remaining infrastructure step. Exact deploy
  commands live in `STAGING_DEPLOYMENT_PLAN.md` + `STAGING_OPERATIONS_RUNBOOK.md`.

## Environment variables used

`DATABASE_PATH`, `DOCUMENTS_DIR`, `UPLOAD_DIR`, `APP_BASE_URL`,
`EMAIL_TRANSPORT`, `EMAIL_ALLOW_OUTBOX`, `NEXT_PUBLIC_CONTACT_EMAIL`,
`PORT`, `NODE_ENV=production`. `ALLOW_DEV_SEED` deliberately unset — no dev
seed data in staging. `SESSION_COOKIE_NAME` default.

## Database verification (actual results)

```
PRAGMA integrity_check → ok
PRAGMA journal_mode    → wal
PRAGMA foreign_keys    → 1
sqlite_version()       → 3.54.1
```

## Backup & restore verification

| Run | Result |
|---|---|
| `pnpm db:backup` on live staging db | `autoauction-…102453.db`, 282 624 B, `integrity ok` |
| `pnpm db:restore` into **isolated** `restore-check.db` | `integrity ok`; contents: 3 users, 7 vehicles, 6 bids, 6 orders — matches source |

Earlier empty-table restore (10:18 backup) confirmed backups capture
point-in-time state correctly.

## Restart persistence

Process killed and restarted — uptime reset, all auctions (LIVE/ENDED/DRAFT/
SCHEDULED/UNSOLD), 6 bids, orders, sessions and uploaded images intact.
Uploads verified present under `public/uploads/vehicles/` post-restart.

## Known limitations (staging)

- Localhost-only URL — VPS + DNS + TLS pending (infra blocker documented).
- `outbox` email transport (no real delivery) — acceptable for demo;
  production needs `EMAIL_TRANSPORT=webhook` + provider.
- Outbox log writes to `./data/outbox.log` relative to cwd (hardcoded).
- Health endpoint uptime resets per process (expected).
- No horizontal scaling by design (single-process SSE + scheduler).

## Production launch blockers

See `docs/CLIENT_OPEN_DECISIONS.md`: legal pages are drafts, contact email is
a placeholder, payment method/fees/jurisdiction unspecified. Staging works —
that does NOT equal production readiness.
