# Public Staging Deployment — AutoAuction

Step-by-step runbook for deploying AutoAuction to **one VPS** behind HTTPS.
Owner substitutes real domain/secrets — nothing is invented here.

## 0. What you need before starting

| Requirement | Notes |
|---|---|
| VPS | 1 vCPU / 1 GB RAM minimum (2 GB recommended), Ubuntu 22.04+ or Debian 12+ |
| Disk | 10 GB+ persistent disk for `/app/data` + uploads + backups |
| DNS | A/AAAA record `staging.example.com` → VPS public IP |
| Ports | 22 (SSH), 80 + 443 (HTTP/HTTPS) open; **nothing else needs to be public** |
| Email provider | webhook endpoint for `EMAIL_WEBHOOK_URL`, or accept outbox (demo only) |

### Preflight checklist (owner inputs)

Every input must be supplied before deployment starts — the app refuses to
boot on missing/invalid production config (by design). Do not paste private
keys or passwords into chat or the repo; use an SSH agent or a secret store.

| # | Input | Status |
|---|---|---|
| 1 | VPS public IP | ✅ PROVIDED — Tencent `43.156.110.135` |
| 2 | SSH access (key-based; agent or approved secret store) | ✅ PROVIDED — ed25519 deploy key |
| 3 | Staging domain | ✅ PROVIDED — `autoauction.claimonetest.online` |
| 4 | DNS A record → VPS IP | ✅ RESOLVING — `autoauction.claimonetest.online` → `43.156.110.135` |
| 5 | Email: `EMAIL_WEBHOOK_URL` + `EMAIL_FROM` **or** explicit approval for outbox-only demo (`EMAIL_ALLOW_OUTBOX=1`) | ✅ APPROVED — outbox-only for demo |
| 6 | Official public contact email → `NEXT_PUBLIC_CONTACT_EMAIL` (build-time, requires image rebuild) | ⬜ MISSING — placeholder for now |
| 7 | VPS persistent storage ≥10 GB (data, uploads, backups) | ✅ VERIFIED — 69 GB disk |
| 8 | Firewall: 22/80/443 inbound; **3100 must NOT be public** | ✅ VERIFIED — 3100 loopback-only |

> **Deployed 2026-11-15:** live at https://autoauction.claimonetest.online —
> see `docs/MILESTONE_7_PUBLIC_STAGING_REPORT.md`. This VPS already ran
> nginx+Certbot for other sites, so a dedicated nginx server block replaced
> Caddy — same architecture (edge TLS → loopback app on 127.0.0.1:3100).
> `deploy/Caddyfile` remains the template for a fresh single-app box.

## 1. Install Docker + Compose plugin

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
docker compose version
```

## 2. Deploy the code

```bash
git clone https://github.com/YR2607/autoauction.git /opt/autoauction
cd /opt/autoauction && git checkout main
```

## 3. Create the environment file

```bash
cp .env.example .env        # .env is gitignored — never commit it
$EDITOR .env
```

Required values for a **public** deployment:

```bash
DATABASE_PATH=/app/data/autoauction.db          # inside container volume
DOCUMENTS_DIR=/app/data/documents
APP_BASE_URL=https://staging.example.com         # real https URL — enforced at startup
APP_BIND=127.0.0.1                               # app reachable only via proxy
APP_PORT=3100
SESSION_COOKIE_NAME=aa_session
EMAIL_TRANSPORT=webhook
EMAIL_WEBHOOK_URL=https://provider.example/hook  # required when transport=webhook
EMAIL_FROM=noreply@example.com
NEXT_PUBLIC_CONTACT_EMAIL=support@example.com    # BUILD-time var — see step 4
BACKUP_KEEP=20
```

Startup validation (`src/lib/env.ts`, runs in `instrumentation.ts`) refuses to
boot if: `APP_BASE_URL` missing/localhost/HTTP, `EMAIL_TRANSPORT=webhook`
without a valid `EMAIL_WEBHOOK_URL`, `outbox` transport without
`EMAIL_ALLOW_OUTBOX=1`, or data dirs unwritable. Fix the `.env` until it boots.

## 4. Build (set build-time vars first)

`NEXT_PUBLIC_*` vars are inlined at build time:

```bash
NEXT_PUBLIC_CONTACT_EMAIL=support@example.com docker compose build
```

(or add it to `.env` — compose passes the environment into the build args
only if you build with the env exported; simplest: export before `docker
compose build`).

## 5. First admin account (after first boot)

```bash
docker compose up -d
curl -fsS http://127.0.0.1:3100/api/health    # {"ok":true,"db":"ok",...}

# register through the UI, then promote:
docker compose exec app node -e "
const D=require('better-sqlite3');
const db=new D('/app/data/autoauction.db');
db.prepare(\"UPDATE users SET role='admin' WHERE email='you@example.com'\").run();
db.close();"
```

## 6. HTTPS reverse proxy

Recommended: **Caddy** (automatic TLS via Let's Encrypt, zero cert work).

```bash
sudo apt install caddy   # or: docker run caddy
# Edit deploy/Caddyfile: replace staging.example.com
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy proxies `127.0.0.1:3100`, flushes SSE immediately, limits request
bodies to 12 MB (app upload limit 10 MB), and 404s `/data/*` paths.

Nginx equivalent (key directives):

```nginx
server {
  listen 443 ssl http2;
  server_name staging.example.com;
  client_max_body_size 12m;
  location / {
    proxy_pass http://127.0.0.1:3100;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_buffering off;              # SSE
    proxy_read_timeout 3600s;         # SSE long-lived
  }
}
```

## 7. Post-deploy verification checklist

| # | Check | Command / path | Expected |
|---|---|---|---|
| 9 | Health | `curl https://staging.example.com/api/health` | `{"ok":true,...}` — no version/path details |
| 10 | Register+login | UI `/register` → `/login` | session cookie `Secure; HttpOnly; SameSite=Lax` |
| 11 | First admin | step 5 above | `role:"admin"` in `/api/profile` |
| 12 | Create vehicle | admin UI | appears in admin list |
| 13 | Upload photo | admin → vehicle → images | renders on vehicle page |
| 14 | Private doc | admin → vehicle → documents | admin 200; guest `401`, other user `403` on `/api/documents/:id` |
| 15 | Create+schedule auction | admin → auction | SCHEDULED → LIVE at startsAt (scheduler ticks 5 s) |
| 16 | Bids + SSE | two browsers | outbid appears live; second client unaffected by first disconnect |
| 17 | Buy Now | vehicle page | `200 {"ok":true,"orderId":…}`; unavailable states → `409` |
| 18 | Admin approval | admin → orders/approvals | approve → SOLD + APPROVED order; reject → REOPEN/NEXT_BIDDER/UNSOLD |
| 19 | Backup | `docker compose exec app node scripts/backup.mjs` | `… integrity ok` in `/app/data/backups/` |
| 20 | Restore | isolated path first (see §8) | `integrity ok`, row counts match |

## 8. Backup & restore (production-safe procedure)

```bash
# Backup — safe while app runs (SQLite backup API, WAL-consistent)
docker compose exec app node scripts/backup.mjs        # → /app/data/backups/

# Restore — STOP THE APP FIRST
docker compose stop app
docker compose run --rm --no-deps app node scripts/restore.mjs \
  /app/data/backups/autoauction-<ts>.db
docker compose start app
```

`restore.mjs` integrity-checks the source, snapshots the live db to
`<db>.pre-restore-<ts>` before overwriting, clears `-wal`/`-shm`, sets
`0600`, and re-verifies. Always rehearse restores into an isolated copy:
`DATABASE_PATH=/tmp/verify.db node scripts/restore.mjs <backup>`.

Retention: `BACKUP_KEEP` (default 10) rotated by `backup.mjs`. Also ship
`backups/` off-box nightly (rsync/S3) — volume loss destroys backups too.

## 9. Upgrade without data loss

```bash
cd /opt/autoauction
docker compose exec app node scripts/backup.mjs   # belt-and-braces backup
git pull --ff-only
docker compose build && docker compose up -d      # recreate container —
                                                   # volumes persist
docker compose exec app node -e "const D=require('better-sqlite3');const db=new D('/app/data/autoauction.db',{readonly:true});console.log(db.prepare('PRAGMA integrity_check').pluck().get())"
```

Migrations run automatically at container start (`CMD pnpm db:migrate`),
which writes its own pre-migration backup first.

## 10. Rollback

```bash
git checkout <previous-tag-or-sha>
docker compose build && docker compose up -d
# Only if the bad release ran a migration: stop app, restore the
# pre-migration backup from data/backups/, start app.
```

## 11. Logs & disk

```bash
docker compose logs -f app          # app + scheduler + email errors
docker compose exec app df -h /app/data /app/public/uploads
du -sh data backups (inside aa-data volume)
```

Watch for: `scheduler tick failed`, `health check failed`,
`outbox transport is for development only`, HTTP 5xx in proxy logs.

## 12. Failure playbooks

- **Disk full** → backups may fail silently; `df -h`, prune `data/backups/`,
  expand volume, re-run `backup.mjs` and verify.
- **Corrupt DB** → stop app → restore latest good backup → verify
  `PRAGMA integrity_check` → start.
- **Failed deploy** → §10 rollback; never leave a half-migrated state —
  the pre-migration backup is the restore point.

## Single-instance deployment limitations

- Run **exactly one** app container/process per SQLite file. Two instances
  with independent local DBs diverge silently — there is no merge.
- Do not put the db on NFS/shared mounts — WAL needs real filesystem locks.
- The scheduler and SSE bus live in-process: a second replica would run a
  second scheduler and only its own clients would see its events.
- Scaling beyond one node requires an architectural change (client-server
  DB + shared event bus) — out of scope for this MVP.

## Before inviting real users

- [ ] Replace ALL demo accounts — unique strong passwords, not committed anywhere
- [ ] Verify the admin account is the intended person only
- [ ] Real email transport configured (`EMAIL_TRANSPORT=webhook` + URL + FROM)
- [ ] `NEXT_PUBLIC_CONTACT_EMAIL` = real published contact (rebuild needed)
- [ ] Legal pages finalized — current ToU/Privacy are drafts (see `docs/CLIENT_OPEN_DECISIONS.md`)
- [ ] Official company details in footer/legal
- [ ] Backup cron configured + first restore rehearsal done
- [ ] All items in `docs/CLIENT_OPEN_DECISIONS.md` answered (jurisdiction, fees, payments, refunds, handover)
- [ ] `ALLOW_LOCALHOST_DEPLOY`, `EMAIL_ALLOW_OUTBOX`, `ALLOW_DEV_SEED` all unset
- [ ] `DEMO_MODE=1` set on staging (adds a STAGING DEMO banner + `X-Robots-Tag:
      noindex, nofollow` on every response — keeps search engines out); unset
      for real production
- [ ] Confirm `/api/health` returns no diagnostic details
