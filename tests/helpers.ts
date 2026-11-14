import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/** Re-creates the full schema in the shared :memory: database. */
export async function resetDb() {
  const { sqlite } = await import("@/lib/db");
  const dir = path.join(process.cwd(), "drizzle");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const sql = files.map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
  sqlite.exec(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS bids; DROP TABLE IF EXISTS auction_events;
    DROP TABLE IF EXISTS auctions; DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS notifications; DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS admin_audit_logs; DROP TABLE IF EXISTS platform_settings;
    DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS user_profiles;
    DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS vehicle_images;
    DROP TABLE IF EXISTS vehicle_documents; DROP TABLE IF EXISTS vehicles;
    DROP TABLE IF EXISTS password_reset_tokens;
    PRAGMA foreign_keys = ON;
  `);
  sqlite.exec(sql);
}

export async function makeUser(role: "buyer" | "admin" = "buyer") {
  const { db, schema } = await import("@/lib/db");
  const id = randomUUID();
  db.insert(schema.users)
    .values({
      id,
      email: `${id.slice(0, 8)}@test.dev`,
      passwordHash: "x",
      role,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    .run();
  return id;
}

export async function makeVehicle(opts: Partial<{
  status: "DRAFT" | "PUBLISHED" | "RESERVED" | "SOLD" | "ARCHIVED";
  saleType: "BUY_NOW" | "AUCTION" | "AUCTION_BUY_NOW";
  buyNowPrice: number | null;
  buyNowCurrency: "USD" | "EUR" | "GBP" | null;
}> = {}) {
  const { db, schema } = await import("@/lib/db");
  const id = randomUUID();
  db.insert(schema.vehicles)
    .values({
      id,
      slug: `test-${id.slice(0, 8)}`,
      lotNumber: `T-${id.slice(0, 6)}`,
      make: "Test",
      model: "Car",
      year: 2022,
      saleType: opts.saleType ?? "AUCTION",
      buyNowPrice: opts.buyNowPrice ?? null,
      buyNowCurrency: opts.buyNowCurrency ?? null,
      status: opts.status ?? "PUBLISHED",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    .run();
  return id;
}

export async function makeAuction(vehicleId: string, opts: Partial<{
  status: "DRAFT" | "SCHEDULED" | "LIVE" | "ENDED";
  startsAt: number;
  endsAt: number;
  startingPrice: number;
  bidIncrement: number;
  currency: "USD" | "EUR" | "GBP";
  extensionWindowSec: number | null;
  extensionDurationSec: number | null;
}> = {}) {
  const { db, schema } = await import("@/lib/db");
  const id = randomUUID();
  const now = Date.now();
  db.insert(schema.auctions)
    .values({
      id,
      vehicleId,
      status: opts.status ?? "LIVE",
      currency: opts.currency ?? "EUR",
      startingPrice: opts.startingPrice ?? 10000_00,
      bidIncrement: opts.bidIncrement ?? 250_00,
      startsAt: opts.startsAt ?? now - 3600_000,
      endsAt: opts.endsAt ?? now + 3600_000,
      extensionWindowSec: opts.extensionWindowSec ?? 0,
      extensionDurationSec: opts.extensionDurationSec ?? 0,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return id;
}
