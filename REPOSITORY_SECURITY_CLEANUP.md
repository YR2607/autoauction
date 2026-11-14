# Repository Security Cleanup — 2026-11-14

## What was exposed

The public GitHub repository contained **tracked SQLite database artifacts**
in its history — committed accidentally in `44edf97` (via `git add -A` before
`.gitignore` covered `data/backups/` and pre-restore snapshots):

| Path | Contents | Introduced | Removed (tree) |
|---|---|---|---|
| `data/autoauction.db.pre-restore-1794685426700` | full DB snapshot | `44edf97` | `a439d74` |
| `data/backups/autoauction-2026-11-14T19-43-28-891Z.db` (+ `-wal`, `-shm`) | online backup | `44edf97` | `a439d74` |
| `data/backups/autoauction-pre-migrate-2026-11-14T19-44-09-582Z.db` | pre-migration backup | `44edf97` | `a439d74` |
| `tests/tmp/http.db` | test DB | `5c046b4` | `c150b20` |

## Content exposure assessment

The dumped development database contained (metadata only — contents were not
copied into this report):

- 4 user rows — all seeded development accounts (`*@autoauction.dev`) with
  scrypt hashes of **publicly documented weak dev passwords**
  (`admin12345`, `buyer12345` — they are also in `src/lib/db/seed.ts`).
- 3 session rows — stored as SHA-256 hashes of tokens; raw tokens are NOT
  recoverable from the dump (lookup is by hash).
- 1 order, bids, notifications, vehicle rows — seed/demo data only.
- No production users, no real personal data, no API keys, no `.env`
  (verified: `.env` never appeared in git history).

**Impact: LOW for production (there is none yet), MEDIUM for credential
hygiene** — the dev password hashes are brute-forceable in seconds, but the
passwords themselves were already public in `seed.ts`.

## Actions taken

1. **Recoverable backup created** before any history rewrite:
   - `git bundle` → `/tmp/autoauction-backup-pre-purge.bundle` (all refs)
   - full directory copy → `/tmp/autoauction-repo-backup`
2. **Identified refs**: single branch `main`, no tags, no other branches.
   Affected historical commits: `44edf97, e5fd711, 5c046b4, 2233e73, c150b20`.
3. **Untracked all artifacts** (commit `a439d74`) — current tree contains no
   DB files (verified: `git ls-files | grep data/` → 0).
4. **History purged with BFG** (`--delete-files {*.db,*.db-wal,*.db-shm,
   *.pre-restore-*}`) on a mirror clone; `reflog expire` + `gc --prune=now
   --aggressive`; **force-pushed** rewritten `main`.
   - Commit hashes changed (documented): `44edf97→cdefc1d`,
     `e5fd711→6a3e346`, `5c046b4→dc55a98`, `2233e73→975bc0d`,
     `c150b20→7874c85`, `a439d74→015be87`.
   - Only legitimate files removed; no source files touched
     (`scripts/backup.mjs` retained intentionally).
5. **Verified post-cleanup**:
   - `git rev-list --objects --all | grep -E '\.db|backup|wal|shm'` → only
     `scripts/backup.mjs` remains.
   - `git log --all -- data` → empty.
   - `.gitignore` verified against freshly created artifacts
     (`data/*.db`, `data/backups/`, `data/documents/`, `data/outbox.log`,
     `data/*.db-*`, `tests/tmp/`) — all ignored.
   - Local working DB intact and untracked.
6. **Credential/session hygiene**:
   - All rows in local `sessions` deleted (revocation).
   - Dev account passwords should be rotated if this DB is used anywhere
     beyond local development; production deployments must create their own
     admin account (dev seed is production-blocked since M2).

## Residual risk

- GitHub may retain **dangling objects reachable by old commit SHAs** for a
  while (cached web views / forks). Anyone who cloned or forked between
  `44edf97` (Nov 14) and the force-push retains a local copy — treat the dev
  password hashes as permanently public (they encode public seed passwords
  anyway). To fully purge GitHub-side caches, contact GitHub Support for
  a cache clear — optional given the low sensitivity.
- Prevented going forward by `.gitignore` + the seed prod-guard; consider a
  pre-commit check (`git ls-files | grep '\.db'` → abort) if accidents recur.
