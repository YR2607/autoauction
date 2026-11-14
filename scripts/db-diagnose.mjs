// Database diagnostics — run against the live database: `pnpm db:diagnose`
// Uses better-sqlite3 (the app runtime), NOT the system sqlite3 CLI.
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "autoauction.db");

if (!fs.existsSync(dbPath)) {
  console.error(`Database not found: ${dbPath}`);
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true, fileMustExist: true });
const pragma = (name) => db.pragma(name, { simple: true });
const scalar = (sql) => db.prepare(sql).pluck().get();

console.log("=== AutoAuction DB diagnostics ===");
console.log("path              :", path.resolve(dbPath));
console.log("sqlite_version    :", scalar("SELECT sqlite_version()"));
console.log("journal_mode      :", pragma("journal_mode"));
console.log("synchronous       :", pragma("synchronous"), "(2=FULL)");
console.log("foreign_keys      :", pragma("foreign_keys"), "(app enables per-connection)");
console.log("busy_timeout      :", pragma("busy_timeout"), "(app sets 5000)");
console.log("integrity_check   :", scalar("PRAGMA integrity_check"));
console.log("quick_check       :", scalar("PRAGMA quick_check"));
console.log("page_size         :", pragma("page_size"));
console.log("page_count        :", pragma("page_count"));
console.log("freelist_count    :", pragma("freelist_count"));

const st = fs.statSync(dbPath);
console.log("file_size         :", st.size, "bytes");
console.log("file_mode         :", (st.mode & 0o777).toString(8), "(want 600)");
for (const suffix of ["-wal", "-shm"]) {
  const p = dbPath + suffix;
  if (fs.existsSync(p)) console.log(`${suffix} size     :`, fs.statSync(p).size, "bytes");
}

console.log("--- table counts ---");
for (const t of ["users", "sessions", "vehicles", "vehicle_images", "vehicle_documents",
  "auctions", "bids", "auction_events", "orders", "favorites", "notifications",
  "admin_audit_logs", "platform_settings"]) {
  try {
    console.log(t.padEnd(18), scalar(`SELECT count(*) FROM ${t}`));
  } catch {
    console.log(t.padEnd(18), "(missing)");
  }
}
db.close();
