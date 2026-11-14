// HTTP-level integration tests — spawn a real `next dev` server against a
// throwaway file database and exercise the API over the wire.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { hashPassword } from "@/lib/auth/password";

const PORT = 3300 + Math.floor(Math.random() * 500);
const BASE = `http://localhost:${PORT}`;
const CWD = process.cwd();
const DB_PATH = path.join(CWD, "tests", "tmp", "http.db");
const UPLOADS = path.join(CWD, "public", "uploads", "vehicles");

let server: ChildProcess;
let db: Database.Database;
let buyerCookie = "";
let adminCookie = "";

const uid = () => randomUUID();
const now = () => Date.now();

function applySchema() {
  const files = fs
    .readdirSync(path.join(CWD, "drizzle"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of files) {
    db.exec(fs.readFileSync(path.join(CWD, "drizzle", f), "utf8"));
  }
}

function insertUser(email: string, password: string, role = "buyer", status = "active") {
  const id = uid();
  db.prepare(
    "INSERT INTO users (id,email,password_hash,role,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
  ).run(id, email, hashPassword(password), role, status, now(), now());
  return id;
}

function insertVehicle(saleType = "AUCTION", status = "PUBLISHED", buyNowPrice: number | null = null) {
  const id = uid();
  db.prepare(
    `INSERT INTO vehicles (id,slug,lot_number,make,model,year,sale_type,buy_now_price,buy_now_currency,status,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(id, `t-${id.slice(0, 8)}`, `T-${id.slice(0, 6)}`, "Test", "Car", 2022, saleType, buyNowPrice,
    buyNowPrice ? "EUR" : null, status, now(), now());
  return id;
}

function insertAuction(vehicleId: string, endsAt: number) {
  const id = uid();
  db.prepare(
    `INSERT INTO auctions (id,vehicle_id,status,currency,starting_price,bid_increment,bid_count,starts_at,ends_at,version,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(id, vehicleId, "LIVE", "EUR", 10000_00, 250_00, 0, now() - 3600_000, endsAt, 0, now(), now());
  return id;
}

type Resp = { status: number; body: any; cookies: string[] };

async function req(method: string, url: string, opts: { body?: unknown; cookie?: string; form?: FormData } = {}): Promise<Resp> {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers.cookie = opts.cookie;
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const r = await fetch(`${BASE}${url}`, { method, headers, body, redirect: "manual" });
  return {
    status: r.status,
    body: await r.json().catch(() => null),
    cookies: r.headers.getSetCookie?.() ?? [],
  };
}

function sessionCookie(cookies: string[]) {
  const c = cookies.find((c) => c.startsWith("aa_session="));
  return c ? c.split(";")[0] : null;
}

async function login(email: string, password: string) {
  const r = await req("POST", "/api/auth/login", { body: { email, password } });
  return { ...r, cookie: sessionCookie(r.cookies) };
}

beforeAll(async () => {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  for (const s of ["", "-wal", "-shm"]) fs.rmSync(DB_PATH + s, { force: true });
  fs.rmSync(UPLOADS, { recursive: true, force: true });

  db = new Database(DB_PATH);
  applySchema();
  insertUser("buyer@test.dev", "buyer12345");
  insertUser("admin@test.dev", "admin12345", "admin");
  insertUser("banned@test.dev", "banned12345", "buyer", "suspended");
  insertUser("ratelimited@test.dev", "rate12345");
  // High per-IP limit so tests don't trip the shared bucket; the per-account
  // limit (hardcoded 10) is what the rate-limit test exercises.
  db.prepare("INSERT OR REPLACE INTO platform_settings (key,value) VALUES ('rate.authPerMin','100000')").run();

  // Production build required — `next start` mirrors the real deployment and
  // avoids the single-dev-server lock. Run `pnpm build` before this suite.
  server = spawn(path.join(CWD, "node_modules", ".bin", "next"), ["start", "-p", String(PORT)], {
    cwd: CWD,
    env: { ...process.env, DATABASE_PATH: DB_PATH },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stderr?.on("data", (d) => process.stderr.write(`[next] ${d}`));

  // Wait for the health endpoint.
  const deadline = Date.now() + 90_000;
  for (;;) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) break;
    } catch { /* not up yet */ }
    if (Date.now() > deadline) throw new Error("test server did not start");
    await new Promise((r) => setTimeout(r, 500));
  }
  buyerCookie = (await login("buyer@test.dev", "buyer12345")).cookie!;
  adminCookie = (await login("admin@test.dev", "admin12345")).cookie!;
}, 120_000);

afterAll(async () => {
  if (server && !server.killed) {
    server.kill("SIGKILL");
    await new Promise((r) => server.once("exit", r));
  }
  db?.close();
});

describe("HTTP / health", () => {
  it("health endpoint reports db ok", async () => {
    const r = await req("GET", "/api/health");
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.db).toBe("ok");
  });
});

describe("HTTP / auth", () => {
  it("registers a new account and sets an httpOnly session cookie", async () => {
    const r = await req("POST", "/api/auth/register", {
      body: { email: `u${uid().slice(0, 8)}@test.dev`, password: "password123" },
    });
    expect(r.status).toBe(200);
    const raw = r.cookies.find((c) => c.startsWith("aa_session="))!;
    expect(raw).toContain("HttpOnly");
    expect(raw.toLowerCase()).toContain("samesite=lax");
  });

  it("rejects duplicate registration and weak passwords", async () => {
    const dup = await req("POST", "/api/auth/register", {
      body: { email: "buyer@test.dev", password: "password123" },
    });
    expect(dup.status).toBe(409);
    const weak = await req("POST", "/api/auth/register", {
      body: { email: `u${uid().slice(0, 8)}@test.dev`, password: "short" },
    });
    expect(weak.status).toBe(400);
  });

  it("rejects wrong credentials with a generic error", async () => {
    const r = await login("buyer@test.dev", "wrong-password");
    expect(r.status).toBe(401);
    expect(r.cookie).toBeNull();
  });

  it("logs in, reads own profile, logs out", async () => {
    const { status, cookie } = await login("buyer@test.dev", "buyer12345");
    expect(status).toBe(200);
    expect(cookie).toBeTruthy();
    const me = await req("GET", "/api/profile", { cookie: cookie! });
    expect(me.status).toBe(200);

    const out = await req("POST", "/api/auth/logout", { cookie: cookie! });
    expect(out.status).toBe(200);
    const after = await req("GET", "/api/profile", { cookie: cookie! });
    expect(after.status).toBe(401);
  });

  it("rejects expired sessions", async () => {
    const userId = db.prepare("SELECT id FROM users WHERE email='buyer@test.dev'").pluck().get() as string;
    const raw = `expired-${uid()}`;
    const token = createHash("sha256").update(raw).digest("hex");
    db.prepare("INSERT INTO sessions (id,user_id,expires_at,created_at) VALUES (?,?,?,?)")
      .run(token, userId, now() - 1000, now() - 10000);
    const r = await req("GET", "/api/profile", { cookie: `aa_session=${raw}` });
    expect(r.status).toBe(401);
  });

  it("rejects suspended users at login", async () => {
    const r = await login("banned@test.dev", "banned12345");
    expect(r.status).toBe(403);
  });

  it("blocks a suspended user's existing session from bidding", async () => {
    const cookie = buyerCookie;
    const vid = insertVehicle();
    const aid = insertAuction(vid, now() + 3600_000);
    db.prepare("UPDATE users SET status='suspended' WHERE email='buyer@test.dev'").run();
    const r = await req("POST", `/api/auctions/${aid}/bid`, {
      cookie: cookie!,
      body: { amountMinor: 10000_00, idempotencyKey: uid() },
    });
    expect(r.status).toBe(403);
    db.prepare("UPDATE users SET status='active' WHERE email='buyer@test.dev'").run();
  });
});

describe("HTTP / authorization", () => {
  it("401 for unauthenticated privileged calls", async () => {
    const r = await req("POST", "/api/admin/vehicles", { body: {} });
    expect(r.status).toBe(401);
  });

  it("403 for buyers on admin API", async () => {
    const r = await req("POST", "/api/admin/vehicles", { cookie: buyerCookie, body: {} });
    expect(r.status).toBe(403);
  });

  it("admin can reach admin API", async () => {
    const r = await req("POST", "/api/admin/vehicles", {
      cookie: adminCookie,
      body: { make: "Audit", model: "Car", year: 2020, saleType: "BUY_NOW", buyNowPrice: 10000_00, buyNowCurrency: "EUR" },
    });
    expect([200, 400]).toContain(r.status); // 400 only if extra required fields exist
    if (r.status === 200) expect(r.body.ok).toBe(true);
  });
});

describe("HTTP / bids & buy-now", () => {
  it("401 bidding without a session", async () => {
    const r = await req("POST", `/api/auctions/${uid()}/bid`, {
      body: { amountMinor: 1, idempotencyKey: "12345678" },
    });
    expect(r.status).toBe(401);
  });

  it("places a bid over HTTP and rejects a low one", async () => {
    const cookie = buyerCookie;
    const vid = insertVehicle();
    const aid = insertAuction(vid, now() + 3600_000);
    const ok = await req("POST", `/api/auctions/${aid}/bid`, {
      cookie: cookie!,
      body: { amountMinor: 10000_00, idempotencyKey: uid() },
    });
    expect(ok.status).toBe(200);
    expect(ok.body.ok).toBe(true);
    const low = await req("POST", `/api/auctions/${aid}/bid`, {
      cookie: cookie!,
      body: { amountMinor: 10001_00, idempotencyKey: uid() },
    });
    expect(low.status).toBe(422);
    expect(low.body.ok).toBe(false);
  });

  it("401 buy-now without a session", async () => {
    const r = await req("POST", `/api/vehicles/${uid()}/buy-now`);
    expect(r.status).toBe(401);
  });
});

describe("HTTP / rate limiting", () => {
  it("rate-limits repeated login attempts on one account", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      const r = await login("ratelimited@test.dev", "nope");
      statuses.push(r.status);
    }
    expect(statuses).toContain(429);
  });
});

describe("HTTP / upload validation", () => {
  it("rejects a non-image file disguised as image/png", async () => {
    const cookie = adminCookie;
    const vid = insertVehicle("BUY_NOW", "PUBLISHED", 10000_00);
    const form = new FormData();
    form.append("file", new File([Buffer.from("<html><script>alert(1)</script></html>")], "x.png", { type: "image/png" }));
    const r = await req("POST", `/api/admin/vehicles/${vid}/images`, { cookie: cookie!, form });
    expect(r.status).toBe(400);
  });

  it("accepts a real PNG upload", async () => {
    const cookie = adminCookie;
    const vid = insertVehicle("BUY_NOW", "PUBLISHED", 10000_00);
    // minimal valid 1x1 PNG
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const form = new FormData();
    form.append("file", new File([png], "pixel.png", { type: "image/png" }));
    const r = await req("POST", `/api/admin/vehicles/${vid}/images`, { cookie: cookie!, form });
    expect(r.status).toBe(200);
    expect(r.body.url).toMatch(/^\/uploads\/vehicles\//);
  });
});
