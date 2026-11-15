# Milestone 7 — Public Staging Activation Report

- **Main SHA (verified):** `46c5745` — fetched fresh; PR #4 merged, main CI green (run 43710760015)
- **Docs branch:** `docs/milestone-7-public-staging` (PR #5)
- **Public staging URL:** **https://autoauction.claimonetest.online** — LIVE
- **VPS:** Tencent Cloud, `43.156.110.135`, Ubuntu 24.04.4 LTS, 3.6 GB RAM, 69 GB disk
- **Deployed image:** built on VPS from `main@46c5745` source (rsync'd, no secrets)
- **Demo data:** restored from M4 staging backup (`autoauction-2026-11-15T17-49-29-007Z.db`, integrity-verified)

Status legend: **PASS** verified · **PARTIAL** implemented, not fully exercised · **BLOCKED** needs external input.

## Topology

```
internet ──► nginx (host, 80/443, Let's Encrypt) ──► 127.0.0.1:3100
              │                                        └── docker container
              │                                        autoauction-app-1
              └── shared host: also serves claimone.ink,                (single process,
                  whale.claimonetest.online — untouched                  single scheduler,
                                                                        single SQLite writer)
```

Named volumes: `autoauction_aa-data` (`/app/data` — DB, documents, backups),
`autoauction_aa-uploads` (`/app/public/uploads`). App port is **not**
public — bound to loopback only (verified: external connect to :3100 fails).

Deviation from runbook: the box already ran nginx+Certbot for other sites,
so the app sits behind a dedicated nginx server block instead of Caddy —
same architecture (edge TLS → loopback app), zero changes to existing sites.

## Phase results

| Phase | Result |
|---|---|
| 1. Repository state | PASS |
| 2. Infra preflight | PASS — VPS, SSH key, domain, DNS all provided |
| 3. VPS validation | PASS |
| 4. DNS & HTTPS | PASS |
| 5. Staging environment | PASS (contact email placeholder — rebuild pending) |
| 6. DB & deployment | PASS |
| 7. Email delivery | PARTIAL — outbox-only, owner-approved; reset links verified with correct public base URL |
| 8. Public staging QA | PASS — real HTTPS checks below |
| 9. Client demonstration | PASS — demo data + rotated credentials ready |
| 10. Client decisions | PASS — checklist in `CLIENT_OPEN_DECISIONS.md` |

## Verified on the real public URL (recorded HTTP results)

### Infrastructure & TLS

| Check | Result | Evidence |
|---|---|---|
| TLS certificate | PASS | Let's Encrypt `YE2`, `CN=autoauction.claimonetest.online`, verify return 0 |
| HTTP→HTTPS redirect | PASS | `http://` → 301 → `https://` |
| `/api/health` | PASS | `{"ok":true,"db":"ok"}` over public HTTPS |
| App port closed externally | PASS | `autoauction.claimonetest.online:3100` → connection refused/timeout |
| Security headers | PASS | CSP, `X-Frame-Options: DENY`, nosniff |
| DEMO_MODE | PASS | `X-Robots-Tag: noindex, nofollow` on pages + API; "STAGING DEMO" banner rendered |
| SSE through proxy | PASS | `/api/auctions/:id/events` → `text/event-stream`, `no-transform`, connected event received (nginx `proxy_buffering off`) |

### Auth & security

| Check | Result |
|---|---|
| Admin/buyer login over HTTPS | PASS — `{"ok":true,"role":...}` |
| Session cookie flags | PASS — `Secure; HttpOnly; SameSite=lax` |
| Guest bid rejected | PASS — `{"error":"Sign in to bid."}` |
| Private doc — guest | PASS — 401 |
| Private doc — buyer | PASS — 403 |
| Private doc — admin | PASS — 200 `application/pdf`, `no-store` |
| New account registration | PASS — synthetic `demo-client-guest@autoauction.dev` |
| Forgot password | PASS — token written to container outbox with `https://autoauction.claimonetest.online` base URL |

### Auction & Buy Now flows

| Check | Result |
|---|---|
| Live bid over HTTPS | PASS — current_bid 5,700,000→5,850,000, count→5 |
| Idempotent retry | PASS — same idempotency key, no duplicate bid |
| Below-minimum bid | PASS — rejected `below_minimum:5900000` |
| Buy Now on live auction | PASS — order `83e3c922…` PENDING_APPROVAL, auction froze as designed |
| Admin reject Buy Now + REOPEN | PASS — auction back LIVE, bids intact, new end 2026-11-20 |
| Favorites | PASS — toggle `{"ok":true}` |

### Persistence (Phase 5/8)

| Check | Result |
|---|---|
| Container restart | PASS — same bids/users after restart |
| Container recreation | PASS — `up --force-recreate`, state intact |
| SQLite integrity | PASS — `PRAGMA integrity_check` → ok, WAL mode |
| Backup | PASS — `scripts/backup.mjs` in container, verified snapshot |
| Isolated restore read | PASS — backup file opens, `integrity_check` ok, all users present |
| Migrations | PASS — auto-run on boot, pre-migration backup taken |

## Demo environment (live now)

- **URL:** https://autoauction.claimonetest.online (banner + noindex active)
- **BMW M4 Competition** — LIVE auction, current bid €58,500, ends 2026-11-20
- **Audi RS6** — published, auction scheduled 2026-11-17
- **Porsche 911 / Toyota Supra** — SOLD (completed auction / Buy Now)
- **Range Rover** — published + Buy Now; **Lexus LC 500** — pending Buy Now
- Accounts: `demo-admin@` / `demo-buyer1@` / `demo-buyer2@autoauction.dev` —
  passwords rotated, unique per account, delivered out-of-band only
- 12 synthetic SVG demo photos (clearly labeled); 6 private PDF docs, admin-only

## Known limitations / remaining work

| Item | Status |
|---|---|
| Real email delivery | BLOCKED — `EMAIL_TRANSPORT=outbox` + `EMAIL_ALLOW_OUTBOX=1` by owner choice; supply `EMAIL_WEBHOOK_URL` + `EMAIL_FROM` when ready |
| `NEXT_PUBLIC_CONTACT_EMAIL` | BLOCKED — placeholder; needs real address → rebuild image |
| Off-VPS backups | PARTIAL — backups inside `aa-data` volume; pull off-box via `docker run` + scp (runbook §8) or attach remote storage |
| VPS reboot survival | PARTIAL — `restart: unless-stopped` + Docker autostart configured; not reboot-tested (owner's box, avoid disrupting other sites) |
| Client business decisions | BLOCKED — `CLIENT_OPEN_DECISIONS.md` unchanged |
| Container vs. host clock skew | ok — server time embedded in API responses, no drift observed |

## Operations quick reference (this deployment)

```bash
ssh -i ~/.ssh/autoauction_deploy ubuntu@43.156.110.135

cd /opt/autoauction/src
sudo docker compose -p autoauction ps|logs|restart
sudo docker exec autoauction-app-1 node scripts/backup.mjs
# update app: rsync new source → docker compose -p autoauction build → up -d
```
