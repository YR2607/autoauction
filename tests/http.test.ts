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

function insertAuction(
  vehicleId: string,
  endsAt: number,
  opts: { status?: string; winnerUserId?: string | null; currentBid?: number | null; closeReason?: string | null } = {},
) {
  const id = uid();
  db.prepare(
    `INSERT INTO auctions (id,vehicle_id,status,currency,starting_price,bid_increment,bid_count,current_bid,winner_user_id,close_reason,finalized_at,starts_at,ends_at,version,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(id, vehicleId, opts.status ?? "LIVE", "EUR", 10000_00, 250_00, 0,
    opts.currentBid ?? null, opts.winnerUserId ?? null, opts.closeReason ?? null,
    opts.status === "AWAITING_ADMIN_APPROVAL" || opts.status === "ENDED" ? now() : null,
    now() - 3600_000, endsAt, 0, now(), now());
  return id;
}

function insertOrder(vehicleId: string, buyerId: string, type: "AUCTION_WIN" | "BUY_NOW", auctionId: string | null, status = "PENDING_APPROVAL") {
  const id = uid();
  db.prepare(
    `INSERT INTO orders (id,vehicle_id,auction_id,buyer_id,type,amount,currency,status,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
  ).run(id, vehicleId, auctionId, buyerId, type, 10500_00, "EUR", status, now(), now());
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
    env: {
      ...process.env,
      DATABASE_PATH: DB_PATH,
      DOCUMENTS_DIR: path.join(CWD, "tests", "tmp", "documents"),
      EMAIL_TRANSPORT: "outbox",
      EMAIL_ALLOW_OUTBOX: "1", // next start runs NODE_ENV=production
      APP_BASE_URL: `http://localhost:${PORT}`,
      ALLOW_LOCALHOST_DEPLOY: "1", // prod-config validation: localhost needs the explicit opt-in
    },
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

describe("HTTP / documents", () => {
  it("enforces access policy on private documents", async () => {
    const vid = insertVehicle();
    const docDir = path.join(CWD, "tests", "tmp", "documents", vid);
    fs.mkdirSync(docDir, { recursive: true });
    fs.writeFileSync(path.join(docDir, "doc1.pdf"), "%PDF-1.4 test");
    const docId = uid();
    db.prepare(
      "INSERT INTO vehicle_documents (id,vehicle_id,title,url,kind,is_public,created_at) VALUES (?,?,?,?,?,?,?)",
    ).run(docId, vid, "Private doc", `${vid}/doc1.pdf`, "ownership", 0, now());

    expect((await req("GET", `/api/documents/${docId}`)).status).toBe(401);
    expect((await req("GET", `/api/documents/${docId}`, { cookie: buyerCookie })).status).toBe(403);
    expect((await req("GET", `/api/documents/${docId}`, { cookie: adminCookie })).status).toBe(200);
  });

  it("serves public documents to guests", async () => {
    const vid = insertVehicle();
    const docDir = path.join(CWD, "tests", "tmp", "documents", vid);
    fs.mkdirSync(docDir, { recursive: true });
    fs.writeFileSync(path.join(docDir, "pub.pdf"), "%PDF-1.4 public");
    const docId = uid();
    db.prepare(
      "INSERT INTO vehicle_documents (id,vehicle_id,title,url,kind,is_public,created_at) VALUES (?,?,?,?,?,?,?)",
    ).run(docId, vid, "Public report", `${vid}/pub.pdf`, "inspection", 1, now());
    const r = await req("GET", `/api/documents/${docId}`);
    expect(r.status).toBe(200);
  });

  it("rejects document uploads from buyers", async () => {
    const vid = insertVehicle();
    const form = new FormData();
    form.append("file", new File([Buffer.from("%PDF-1.4 x")], "d.pdf", { type: "application/pdf" }));
    const r = await req("POST", `/api/admin/vehicles/${vid}/documents`, { cookie: buyerCookie, form });
    expect(r.status).toBe(403);
  });
});

describe("HTTP / password reset", () => {
  it("full flow: forgot → token in outbox → reset → old password dead, new works", async () => {
    const outbox = path.join(CWD, "data", "outbox.log");
    fs.rmSync(outbox, { force: true });

    const f = await req("POST", "/api/auth/password/forgot", { body: { email: "buyer@test.dev" } });
    expect(f.status).toBe(200);
    // non-existent account → still 200 (no enumeration)
    const f2 = await req("POST", "/api/auth/password/forgot", { body: { email: "nobody@test.dev" } });
    expect(f2.status).toBe(200);

    const log = fs.readFileSync(outbox, "utf8");
    const token = log.match(/token=([a-f0-9]{64})/)?.[1];
    expect(token).toBeTruthy();

    const r = await req("POST", "/api/auth/password/reset", {
      body: { token, password: "brand-new-pass1" },
    });
    expect(r.status).toBe(200);

    expect((await login("buyer@test.dev", "buyer12345")).status).toBe(401);
    expect((await login("buyer@test.dev", "brand-new-pass1")).status).toBe(200);

    // token replay → rejected
    const replay = await req("POST", "/api/auth/password/reset", {
      body: { token, password: "yet-another-1" },
    });
    expect(replay.status).toBe(400);

    // restore for other tests
    db.prepare("UPDATE users SET password_hash=? WHERE email='buyer@test.dev'")
      .run(hashPassword("buyer12345"));
  });
});

describe("HTTP / image management", () => {
  it("reorders images and sets a cover", async () => {
    const vid = insertVehicle("BUY_NOW", "PUBLISHED", 10000_00);
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      const form = new FormData();
      form.append("file", new File([png], `p${i}.png`, { type: "image/png" }));
      const r = await req("POST", `/api/admin/vehicles/${vid}/images`, { cookie: adminCookie, form });
      ids.push(r.body.id);
    }
    const reorder = await req("PATCH", `/api/admin/vehicles/${vid}/images`, {
      cookie: adminCookie,
      body: { order: [ids[2], ids[0], ids[1]], coverId: ids[2] },
    });
    expect(reorder.status).toBe(200);
    const rows = db.prepare("SELECT id,sort_order,is_cover FROM vehicle_images WHERE vehicle_id=? ORDER BY sort_order").all(vid) as any[];
    expect(rows.map((r) => r.id)).toEqual([ids[2], ids[0], ids[1]]);
    expect(rows[0].is_cover).toBe(1);
  });
});

describe("HTTP / admin approval workflow", () => {
  function buyerId() {
    return db.prepare("SELECT id FROM users WHERE email='buyer@test.dev'").pluck().get() as string;
  }

  it("approves an auction win via the auctions endpoint — all states consistent", async () => {
    const vid = insertVehicle("AUCTION", "RESERVED");
    const aid = insertAuction(vid, now() - 1000, {
      status: "AWAITING_ADMIN_APPROVAL",
      winnerUserId: buyerId(),
      currentBid: 10500_00,
      closeReason: "expired",
    });
    const oid = insertOrder(vid, buyerId(), "AUCTION_WIN", aid);

    const r = await req("POST", `/api/admin/auctions/${aid}`, {
      cookie: adminCookie,
      body: { action: "approve" },
    });
    expect(r.status).toBe(200);
    expect(db.prepare("SELECT status FROM auctions WHERE id=?").pluck().get(aid)).toBe("SOLD");
    expect(db.prepare("SELECT status FROM orders WHERE id=?").pluck().get(oid)).toBe("APPROVED");
    expect(db.prepare("SELECT status FROM vehicles WHERE id=?").pluck().get(vid)).toBe("SOLD");
  });

  it("generic approve on an AUCTION_WIN order delegates to the result workflow", async () => {
    const vid = insertVehicle("AUCTION", "RESERVED");
    const aid = insertAuction(vid, now() - 1000, {
      status: "AWAITING_ADMIN_APPROVAL",
      winnerUserId: buyerId(),
      currentBid: 10500_00,
      closeReason: "expired",
    });
    const oid = insertOrder(vid, buyerId(), "AUCTION_WIN", aid);

    const r = await req("POST", `/api/admin/orders/${oid}`, {
      cookie: adminCookie,
      body: { action: "approve" },
    });
    expect(r.status).toBe(200);
    // NOT the old inconsistency: auction must be SOLD, not still AWAITING
    expect(db.prepare("SELECT status FROM auctions WHERE id=?").pluck().get(aid)).toBe("SOLD");
    expect(db.prepare("SELECT status FROM orders WHERE id=?").pluck().get(oid)).toBe("APPROVED");
  });

  it("generic reject on an AUCTION_WIN order without `next` is refused", async () => {
    const vid = insertVehicle("AUCTION", "RESERVED");
    const aid = insertAuction(vid, now() - 1000, {
      status: "AWAITING_ADMIN_APPROVAL",
      winnerUserId: buyerId(),
      currentBid: 10500_00,
    });
    const oid = insertOrder(vid, buyerId(), "AUCTION_WIN", aid);

    const r = await req("POST", `/api/admin/orders/${oid}`, {
      cookie: adminCookie,
      body: { action: "reject", reason: "bad result" },
    });
    expect(r.status).toBe(400);
    expect(db.prepare("SELECT status FROM auctions WHERE id=?").pluck().get(aid)).toBe("AWAITING_ADMIN_APPROVAL");
    expect(db.prepare("SELECT status FROM orders WHERE id=?").pluck().get(oid)).toBe("PENDING_APPROVAL");
  });

  it("generic reject on an AUCTION_WIN order with next=UNSOLD delegates correctly", async () => {
    const vid = insertVehicle("AUCTION", "RESERVED");
    const aid = insertAuction(vid, now() - 1000, {
      status: "AWAITING_ADMIN_APPROVAL",
      winnerUserId: buyerId(),
      currentBid: 10500_00,
    });
    const oid = insertOrder(vid, buyerId(), "AUCTION_WIN", aid);

    const r = await req("POST", `/api/admin/orders/${oid}`, {
      cookie: adminCookie,
      body: { action: "reject", reason: "bad result", next: "UNSOLD" },
    });
    expect(r.status).toBe(200);
    expect(db.prepare("SELECT status FROM auctions WHERE id=?").pluck().get(aid)).toBe("UNSOLD");
    expect(db.prepare("SELECT status FROM orders WHERE id=?").pluck().get(oid)).toBe("REJECTED");
    expect(db.prepare("SELECT status FROM vehicles WHERE id=?").pluck().get(vid)).toBe("PUBLISHED");
    // no pending order left for the auction
    const pend = db
      .prepare("SELECT count(*) c FROM orders WHERE auction_id=? AND status='PENDING_APPROVAL'")
      .get(aid) as { c: number };
    expect(pend.c).toBe(0);
  });

  it("orders page renders pending auction wins as read-only with an Approvals link", async () => {
    const vid = insertVehicle("AUCTION", "RESERVED");
    const aid = insertAuction(vid, now() - 1000, {
      status: "AWAITING_ADMIN_APPROVAL",
      winnerUserId: buyerId(),
      currentBid: 10500_00,
    });
    insertOrder(vid, buyerId(), "AUCTION_WIN", aid);

    const r = await fetch(`${BASE}/admin/orders`, { headers: { cookie: adminCookie } });
    const html = await r.text();
    expect(r.status).toBe(200);
    expect(html).toContain("Go to Approvals");
    expect(html).toContain("Review and decide");
  });

  it("buy-now rejection via orders endpoint honors REOPEN with a chosen end time", async () => {
    const vid = insertVehicle("AUCTION_BUY_NOW", "RESERVED", 40000_00);
    const aid = insertAuction(vid, now() - 1000, { status: "ENDED", closeReason: "buy_now" });
    const oid = insertOrder(vid, buyerId(), "BUY_NOW", aid);

    const newEnd = now() + 48 * 3600_000;
    const r = await req("POST", `/api/admin/orders/${oid}`, {
      cookie: adminCookie,
      body: { action: "reject", reason: "buyer backed out", auctionAction: "REOPEN", newEndsAt: newEnd },
    });
    expect(r.status).toBe(200);
    const row = db.prepare("SELECT status, ends_at, close_reason FROM auctions WHERE id=?").get(aid) as any;
    expect(row.status).toBe("LIVE");
    expect(row.ends_at).toBe(newEnd);
    expect(row.close_reason).toBeNull();
  });

  it("buy-now rejection without an explicit auctionAction is a 400", async () => {
    const vid = insertVehicle("AUCTION_BUY_NOW", "RESERVED", 40000_00);
    const aid = insertAuction(vid, now() - 1000, { status: "ENDED", closeReason: "buy_now" });
    const oid = insertOrder(vid, buyerId(), "BUY_NOW", aid);

    const r = await req("POST", `/api/admin/orders/${oid}`, {
      cookie: adminCookie,
      body: { action: "reject", reason: "no recovery choice given" },
    });
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/auctionAction/i);
    // nothing changed — no silent UNSOLD default
    expect(db.prepare("SELECT status FROM auctions WHERE id=?").pluck().get(aid)).toBe("ENDED");
    expect(db.prepare("SELECT status FROM orders WHERE id=?").pluck().get(oid)).toBe("PENDING_APPROVAL");
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
