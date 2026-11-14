// Restore a backup into the live database path. STOP THE APP FIRST —
// SQLite allows concurrent readers, but restoring under a running writer
// risks clobbering. Usage: pnpm db:restore <backup-file>
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const src = process.argv[2];
const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "autoauction.db");

if (!src || !fs.existsSync(src)) {
  console.error("Usage: pnpm db:restore <backup-file>");
  process.exit(1);
}

// 1. Verify the backup is a valid SQLite db.
const check = new Database(src, { readonly: true });
const integrity = check.prepare("PRAGMA integrity_check").pluck().get();
check.close();
if (integrity !== "ok") {
  console.error(`Backup failed integrity_check: ${integrity}`);
  process.exit(1);
}

// 2. Snapshot the current db before overwriting (if it exists).
if (fs.existsSync(dbPath)) {
  const pre = `${dbPath}.pre-restore-${Date.now()}`;
  fs.copyFileSync(dbPath, pre);
  console.log(`current db saved → ${pre}`);
}

// 3. Copy the backup over (remove stale WAL/SHM first).
for (const suffix of ["-wal", "-shm"]) {
  const p = dbPath + suffix;
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
fs.copyFileSync(src, dbPath);
fs.chmodSync(dbPath, 0o600);

// 4. Post-restore verification.
const verify = new Database(dbPath, { readonly: true });
const post = verify.prepare("PRAGMA integrity_check").pluck().get();
verify.close();
if (post !== "ok") {
  console.error(`Restored db failed integrity_check: ${post}`);
  process.exit(1);
}
console.log(`restored ${src} → ${dbPath} (integrity ok)`);
console.log("Restart the app to pick up the restored database.");
