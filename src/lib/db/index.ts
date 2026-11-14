import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";

const dbPath =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "autoauction.db");

const isMemory = dbPath === ":memory:";

if (!isMemory) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export const sqlite = new Database(dbPath);

// Durability & concurrency pragmas.
// - WAL: readers never block the single writer (and vice versa).
// - synchronous=FULL: every commit hits stable storage; in WAL mode the cost is
//   one fsync per commit batch — the right default for financial data.
// - foreign_keys: OFF by default in SQLite; required for our FK constraints.
// - busy_timeout: writers queue up to 5s instead of failing with SQLITE_BUSY.
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("synchronous = FULL");
sqlite.pragma("busy_timeout = 5000");

// The database stores password hashes and session tokens — restrict to owner.
if (!isMemory && fs.existsSync(dbPath)) {
  try {
    fs.chmodSync(dbPath, 0o600);
  } catch {
    /* non-POSIX fs */
  }
}

export const db = drizzle(sqlite, { schema });
export { schema };
export type Db = typeof db;
