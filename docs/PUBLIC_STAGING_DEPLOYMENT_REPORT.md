# Public Staging Deployment Report — Milestone 6

Status classification used throughout:

- **PASS** — actually verified by a fresh run/inspection.
- **PARTIAL** — implemented and partially verified, but not exercised end-to-end.
- **BLOCKED** — cannot complete without external access or client decisions.

## Executive summary

The application is **technically ready** for public staging deployment on a
single VPS (Docker + Caddy + persistent SQLite storage + HTTPS). The actual
public deployment is **BLOCKED**: no VPS, SSH access, domain, DNS control,
email webhook endpoint, or official contact email has been provided. PR #4
carries all hardening and is merged into main (`46c5745`) with green CI —
the owner authorized an admin bypass merge since no external reviewer was
available and GitHub forbids self-approval.

## Scope inputs

| Input | State |
|---|---|
| Repository | `YR2607/autoauction` |
| PR | [#4](https://github.com/YR2607/autoauction/pull/4) — `hardening/milestone-5-public-staging-readiness` |
| Branch head | `510e9cd` at report time |
| Main HEAD | `46c5745` (PR #4 merged 2026-11-15, squash) |
| VPS / SSH / domain / DNS | **not provided** |
| Email webhook endpoint | **not provided** |
| Official contact email | **not provided** |

## Phase 1 — Final PR #4 review

| Check | Result |
|---|---|
| Branch contains latest main (`e644bd8`) | PASS — verified via merge-base |
| No conflicts with main | PASS — merged cleanly |
| M2.3.1 reservation guards in main | PASS — commits `001136f`, `320ad58` are ancestors; `RESERVED` transitions present in `src/features/auctions/engine.ts` |
| M5 changes isolated on the branch | PASS — diff vs main limited to env validation, health endpoint, Docker/Compose/Caddy, CI, tests, docs |
| Review comments | PASS — none present on the PR |
| Independent review | RESOLVED — no external reviewer was available; the repository owner explicitly authorized an admin bypass merge. Branch protection was not weakened |
| Merge | PASS — PR #4 merged into main as `46c5745`; post-merge main CI green (run 43710760015) |

### Docker build-time public config (corrected this milestone)

- `ARG NEXT_PUBLIC_CONTACT_EMAIL` declared in the Dockerfile build stage and
  exported as `ENV` before `pnpm build`, so the contact email is baked into
  the frontend bundle correctly — **PASS**.
- `docker-compose.yml` `build.args` passes it through — **PASS**.
- Documented that changing the value requires a rebuild — **PASS**.
- CI `docker` job builds the image with a synthetic email and greps `.next`
  for it — **PASS** (run 43707346846: `docker build` + `compose config` +
  bundle verification all green).
- No private secrets baked into the image — **PASS** (only the synthetic
  public email ARG).
- `pnpm minimumReleaseAge` untouched — **PASS**.

## Phase 2 — Public infrastructure preparation

| Item | Result |
|---|---|
| Runbook exists (`docs/PUBLIC_STAGING_DEPLOYMENT.md`) | PASS — VPS spec, Docker, DNS, HTTPS, env, volumes, checklist |
| Compose/Caddyfile parameterized for owner values | PASS — `${VAR:?}` placeholders, `{$DOMAIN}` in `deploy/Caddyfile` |
| VPS provisioned | **BLOCKED** — no IP/SSH provided |
| Domain + DNS A-record | **BLOCKED** — no domain provided |
| Email webhook endpoint | **BLOCKED** — not provided; staging email delivery untestable |
| Official contact email | **BLOCKED** — `NEXT_PUBLIC_CONTACT_EMAIL` stays placeholder |

Manual actions required from the owner are listed at the bottom of this
report and in the runbook §1–§4.

## Phase 3 — Staging environment configuration

| Check | Result |
|---|---|
| Production env validation (fail-fast) | PASS — `pnpm start` refused to boot twice during this milestone: missing `APP_BASE_URL` and `EMAIL_TRANSPORT=outbox` without `EMAIL_ALLOW_OUTBOX`; clear messages, no secret values printed |
| HTTPS `APP_BASE_URL` enforced | PASS — `src/lib/env.ts` requires https in production unless `ALLOW_LOCALHOST_DEPLOY=1` |
| localhost override gated | PASS — `ALLOW_LOCALHOST_DEPLOY` opt-in only |
| Webhook transport requires `EMAIL_WEBHOOK_URL` | PASS |
| Outbox transport gated | PASS — requires `EMAIL_ALLOW_OUTBOX=1` |
| Secure cookies in prod | PASS — `Secure` flag under `NODE_ENV=production` (code inspection, M5 audit) |
| Writable data dir check | PASS — validation probes the data directory |
| No demo seed credentials in image | PASS — `db:seed` blocked in prod unless `ALLOW_DEV_SEED=1`; no seed data in the repo |
| `.env.example` placeholders only | PASS — no real values |

## Phase 4 — Deploy public staging

**BLOCKED** — requires VPS + DNS + secrets (see Phase 2). Every step that
does not need external access was prepared and verified locally:

| Sub-check | Result |
|---|---|
| `next start` production boot | PASS — verified on :3300 |
| Health endpoint | PASS — `GET /api/health` → `{"ok":true,"db":"ok",...}`; 503 → `{"error":"database_unavailable"}` without internals |
| Persistent paths declared | PASS — `/app/data` + `/app/public/uploads` volumes in Compose |
| Private docs outside public dir | PASS — `DOCUMENTS_DIR=/app/data/documents`, admin-gated route |
| App bound to loopback | PASS — `127.0.0.1:3100` publish binding; only Caddy faces the internet |
| Caddy auto-HTTPS config | PARTIAL — template reviewed; not run against a real domain |
| SSE through reverse proxy | PARTIAL — `flush_interval -1` + no buffering directives set in Caddyfile; verified only locally without proxy |
| Scheduler running | PARTIAL — starts via instrumentation on boot (verified locally) |
| Real email delivery | **BLOCKED** — no webhook endpoint |

### Demo protection

- `DEMO_MODE=1` adds a visible "STAGING DEMO" banner on every page — **PASS**
  (verified live on :3300).
- `DEMO_MODE=1` sends `X-Robots-Tag: noindex, nofollow` on every response
  (pages, API, assets) via `src/proxy.ts` — **PASS** (verified live).
- Demo passwords are not committed — **PASS**; accounts documented in
  `docs/CLIENT_DEMO_GUIDE.md` without credentials.

## Phase 5 — Database durability

| Check | Result |
|---|---|
| SQLite WAL mode | PASS — enabled at open in `src/lib/db` (M4 verified) |
| Foreign keys | PASS — pragma on connection (M4 verified) |
| Persistent DB + uploads volumes | PASS — declared in Compose |
| Safe SQLite backup API | PASS — `scripts/backup.mjs` uses the SQLite online backup API |
| Isolated restore rehearsal | PASS — Milestone 4 end-to-end backup→restore→`integrity_check` passed; restore requires explicit confirmation and refuses to overwrite a live DB |
| Backup schedule on the VPS | PARTIAL — `BACKUP_KEEP` retention documented; cron line in runbook; not installed (no VPS) |
| Off-VPS backup destination | **BLOCKED** — no remote storage credentials |
| Container recreation survival | PARTIAL — volume layout verified statically; no live container to restart |
| VPS restart survival | **BLOCKED** — no VPS |

## Phase 6 — Public staging acceptance

**BLOCKED** — no public HTTPS domain exists yet. The full acceptance
checklist (admin/buyer/auction/Buy-Now/security flows) was last executed in
Milestone 4 on local production-mode staging (27 checks + scenarios A–F, all
PASS — see `docs/STAGING_ACCEPTANCE_REPORT.md`). The same checklist must be
re-run against the real domain once deployed; no mock tests were
substituted.

## Phase 7 — Client demonstration

| Item | Result |
|---|---|
| Demo guide | PASS — `docs/CLIENT_DEMO_GUIDE.md` covers register → browse → bid → Buy Now → results → admin vehicle creation → winner approval |
| Synthetic demo vehicles | PASS — live auction, published, and sold vehicles staged in the M4 local staging DB |
| Admin + 2 buyers | PASS — synthetic accounts exist; passwords held out of the repo |
| Demo environment notice + noindex | PASS — `DEMO_MODE=1` (banner + `X-Robots-Tag`) |
| Public demo reachable | **BLOCKED** — no domain |

## Phase 8 — Client business decisions

PASS — `docs/CLIENT_OPEN_DECISIONS.md` is the organized client response
document: 16 decision areas (jurisdiction, fees, payment method, deposit,
deadlines, refunds, defaults, handover, legal docs, contacts, inspection,
KYC) each with explicit checkboxes; nothing invented. Legal pages remain
marked as drafts pending client answers.

## Phase 9 — Consolidated results

| Item | Result |
|---|---|
| Actual deployment URL | **BLOCKED** — pending domain |
| Main commit SHA | `46c5745` (PR #4 merged) |
| CI status | PASS — `verify` + `docker` jobs green on `510e9cd` |
| VPS topology | **BLOCKED** — documented spec only (single instance, loopback app, Caddy edge) |
| Docker build | PASS — CI built the image with synthetic public config |
| Compose validation | PASS — `docker compose config` in CI |
| TLS verification | **BLOCKED** — no domain for real cert issuance |
| Persistent volume verification | PARTIAL — static config verified; no live container |
| Database integrity | PASS — `integrity_check` after restore passed in M4 rehearsal |
| Backup/restore | PASS — full rehearsal in M4 |
| Email test | **BLOCKED** — no webhook endpoint |
| Auction acceptance | PARTIAL — full M4 local pass; not re-run on public HTTPS |
| Security results | PASS — M5 audit + `DEMO_MODE` noindex + health leak fix |
| Tests | PASS — 140/140 (13 files), typecheck clean |
| Known limitations | Single-instance architecture; no payments/KYC/dealer/proxy bidding by design |
| Unresolved client decisions | `docs/CLIENT_OPEN_DECISIONS.md` — all open |
| Production launch blockers | VPS/domain/secrets provisioning + client decisions |

## Actions required from the owner

1. **Provision a VPS** — Ubuntu 22.04+/Debian 12+, ≥2 GB RAM, ≥10 GB disk;
   install Docker + Compose; provide SSH/deploy key access (not via chat).
2. **DNS** — point the staging domain's A-record at the VPS; put the domain
   in `deploy/Caddyfile`.
3. **Email webhook** — provide `EMAIL_WEBHOOK_URL` + `EMAIL_FROM`, or
   confirm staging should keep outbox transport (`EMAIL_ALLOW_OUTBOX=1`).
4. **Contact email** — provide the official `NEXT_PUBLIC_CONTACT_EMAIL`
   (image rebuild required after changing).
5. **Secrets** — fill `.env` on the VPS; never commit it.
6. **Deploy** — follow `docs/PUBLIC_STAGING_DEPLOYMENT.md` §5–§9; set
   `DEMO_MODE=1` for the demo environment.
7. **Re-run Phase 6 acceptance** on the real HTTPS URL and record results.
8. **Answer `docs/CLIENT_OPEN_DECISIONS.md`** before inviting real users.
