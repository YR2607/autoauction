# Milestone 7 — Public Staging Activation Report

- **Main SHA (verified):** `46c5745` — fetched fresh; PR #4 merged, main CI green (run 43710760015, verify + docker jobs)
- **Working branch:** `docs/milestone-7-public-staging` (docs only)
- **Local staging instance:** `http://localhost:3300` — production build, `DEMO_MODE=1`, staging DB `staging/data/autoauction.db`
- **Public staging URL:** **not available** — no domain/VPS provided yet

Status legend: **PASS** verified · **PARTIAL** implemented, not fully exercised · **BLOCKED** needs external access or client decision.

## Phase results

| Phase | Result | Notes |
|---|---|---|
| 1. Repository state | PASS | main `46c5745`, PR #4 merged, CI green, clean tree; `PUBLIC_STAGING_DEPLOYMENT_REPORT.md` updated to reflect the merged state |
| 2. Infra preflight | PARTIAL | Checklist added to `PUBLIC_STAGING_DEPLOYMENT.md` §0; all 8 owner inputs currently MISSING — nothing invented |
| 3. VPS validation | **BLOCKED** | No VPS/SSH provided |
| 4. DNS & HTTPS | **BLOCKED** | No domain; Caddyfile template ready, `{$DOMAIN}` placeholder |
| 5. Staging environment | PARTIAL | Full env spec documented; `.env` template ready; `DEMO_MODE` verified live (banner + `X-Robots-Tag` on pages and API) |
| 6. DB & deployment | PARTIAL | Production boot, WAL, persistent dirs verified locally; containerized deploy needs the VPS |
| 7. Email delivery | **BLOCKED** | No `EMAIL_WEBHOOK_URL`; fallback documented (outbox + `EMAIL_ALLOW_OUTBOX=1` needs explicit owner approval) |
| 8. Public staging QA | **BLOCKED** | Requires real HTTPS URL; the equivalent checklist passed on local staging in M4 + spot checks this milestone |
| 9. Client demonstration | PARTIAL | Guide updated; demo data refreshed; **passwords rotated** and delivered out-of-band |
| 10. Client decisions | PASS | `CLIENT_OPEN_DECISIONS.md` now has confirmed/default/unresolved checklist |
| 11. This report | PASS | |

## Demo environment state (verified live on :3300)

| Item | State | Evidence |
|---|---|---|
| BMW M4 Competition | **LIVE auction** | reopened via admin reject→REOPEN flow; ends 2026-11-20; current bid €58,000 (4 bids, seeded via real bid API) |
| Porsche 911 / Toyota Supra | SOLD | completed auction + completed Buy Now examples |
| Audi RS6 | PUBLISHED, auction scheduled | DRAFT window 2026-11-17 |
| Range Rover Autobiography | PUBLISHED + Buy Now €135,000 | UNSOLD auction history |
| Mercedes AMG GT 63 S | RESERVED | prior auction ended |
| Lexus LC 500 | RESERVED, Buy Now pending | shows pending-approval state |
| Accounts | admin + 2 buyers | passwords rotated (unique per account), all sessions invalidated, login verified via API |
| DEMO_MODE | ON | banner rendered; `x-robots-tag: noindex, nofollow` returned on every response incl. `/api/*` |

## Verified this milestone (local staging, production build)

- `GET /api/health` → `{"ok":true,"db":"ok",...}` — **PASS**
- `POST /api/auth/login` with rotated credentials → `{"ok":true}` — **PASS**
- Admin reject→REOPEN → auction status `LIVE` — **PASS**
- Two consecutive bids via `/api/auctions/:id/bid` → `currentBid` 5.75M→5.8M, `minNextBid` recomputed, idempotency keys accepted — **PASS**
- `X-Robots-Tag` on page + API responses under `DEMO_MODE=1` — **PASS**

## Remaining external blockers (owner actions)

| # | Input needed | Unblocks |
|---|---|---|
| 1 | VPS (Ubuntu 22.04+/Debian 12+, ≥2 GB RAM, ≥10 GB disk) + SSH key access | Phases 3, 6, 8 |
| 2 | Staging domain + DNS A record → VPS IP | Phase 4 (TLS issuance needs a public name) |
| 3 | `EMAIL_WEBHOOK_URL` + `EMAIL_FROM`, or explicit outbox-only approval | Phase 7 |
| 4 | Official contact email → `NEXT_PUBLIC_CONTACT_EMAIL` (rebuild) | Phase 5 |
| 5 | Answers to `CLIENT_OPEN_DECISIONS.md` | Production launch |

Once 1–4 are provided, `docs/PUBLIC_STAGING_DEPLOYMENT.md` §0–§7 is the
exact runbook; nothing else is missing technically.

## Security & integrity notes

- No secrets committed; rotated passwords exist only in this session and
  must be delivered to the client through a private channel.
- Demo DB is synthetic; no real customer data.
- `DEMO_MODE` keeps staging out of search indexes; unset it only for real
  production.
- Branch protection unchanged; this report and docs ship through a normal
  PR into main.
