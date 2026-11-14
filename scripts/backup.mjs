// Online backup — safe to run while the app is live (uses SQLite backup API,
// consistent under WAL). Usage: pnpm db:backup [destDir]
// Env: DATABASE_PATH (default ./data/autoauction.db), BACKUP_KEEP (default 10)
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "autoauction.db");
const destDir = process.argv[2] ?? path.join(path.dirname(dbPath), "backups");
const keep = Number(process.env.BACKUP_KEEP ?? 10);

if (!fs.existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = path.join(destDir, `autoauction-${stamp}.db`);

const db = new Database(dbPath, { readonly: true, fileMustExist: true });
await db.backup(dest);
db.close();

// Verify the backup opens and passes a quick integrity check.
const check = new Database(dest, { readonly: true });
const ok = check.prepare("PRAGMA quick_check").pluck().get() === "ok";
const size = fs.statSync(dest).size;
check.close();
// Opening the backup can leave stray WAL/SHM sidecars — remove them.
for (const suffix of ["-wal", "-shm"]) {
  const p = dest + suffix;
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

if (!ok) {
  fs.unlinkSync(dest);
  console.error("Backup failed integrity check — removed.");
  process.exit(1);
}
console.log(`backup → ${dest} (${size} bytes, integrity ok)`);

// Rotate: keep newest `keep` backups.
const files = fs
  .readdirSync(destDir)
  .filter((f) => f.startsWith("autoauction-") && f.endsWith(".db"))
  .sort()
  .reverse();
for (const old of files.slice(keep)) {
  fs.unlinkSync(path.join(destDir, old));
  console.log(`rotated out ${old}`);
}
