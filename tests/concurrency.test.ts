import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, makeUser, makeVehicle, makeAuction } from "./helpers";

beforeEach(resetDb);

describe("idempotency scope", () => {
  it("scopes idempotency keys per bidder — another user's same key is an independent bid", async () => {
    const { placeBid } = await import("@/features/auctions/engine");
    const [u1, u2] = await Promise.all([makeUser(), makeUser()]);
    const v = await makeVehicle();
    const a = await makeAuction(v, { startingPrice: 10000_00, bidIncrement: 250_00 });

    const r1 = placeBid({ auctionId: a, userId: u1, amountMinor: 10000_00, idempotencyKey: "shared-key" });
    expect(r1.ok).toBe(true);

    // u2 sends the same key — must NOT get u1's bid back.
    const r2 = placeBid({ auctionId: a, userId: u2, amountMinor: 10500_00, idempotencyKey: "shared-key" });
    expect(r2.ok).toBe(true);
    expect(r2.bidId).not.toBe(r1.bidId);
    expect(r2.auction.currentBid).toBe(10500_00);
    expect(r2.auction.highestBidderId).toBe(u2);
  });

  it("same user + same key retry returns the same bid, never a duplicate", async () => {
    const { placeBid } = await import("@/features/auctions/engine");
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const u = await makeUser();
    const v = await makeVehicle();
    const a = await makeAuction(v);

    const r1 = placeBid({ auctionId: a, userId: u, amountMinor: 10000_00, idempotencyKey: "k1" });
    const r2 = placeBid({ auctionId: a, userId: u, amountMinor: 99999_00, idempotencyKey: "k1" });
    expect(r2.bidId).toBe(r1.bidId);
    const count = db.select().from(schema.bids).where(eq(schema.bids.auctionId, a)).all().length;
    expect(count).toBe(1);
    expect(r2.auction.currentBid).toBe(10000_00); // not the second attempt's amount
  });

  it("rejected outcome is also idempotent — replay returns the same rejection", async () => {
    const { placeBid } = await import("@/features/auctions/engine");
    const u = await makeUser();
    const v = await makeVehicle();
    const a = await makeAuction(v, { startingPrice: 10000_00 });
    const r1 = placeBid({ auctionId: a, userId: u, amountMinor: 500_00, idempotencyKey: "low" });
    const r2 = placeBid({ auctionId: a, userId: u, amountMinor: 500_00, idempotencyKey: "low" });
    expect(r1.ok).toBe(false);
    expect(r2.bidId).toBe(r1.bidId);
    expect(r2.reason).toBe(r1.reason);
  });
});

describe("races", () => {
  it("bid vs buy-now: whoever commits first wins; bids stay in history", async () => {
    const { placeBid, buyNow } = await import("@/features/auctions/engine");
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const [bidder, buyer] = await Promise.all([makeUser(), makeUser()]);
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 50000_00, buyNowCurrency: "EUR" });
    const a = await makeAuction(v, { status: "LIVE" });

    const bid = placeBid({ auctionId: a, userId: bidder, amountMinor: 10000_00, idempotencyKey: "b1" });
    expect(bid.ok).toBe(true);
    const { orderId } = buyNow({ vehicleId: v, userId: buyer });
    expect(orderId).toBeTruthy();

    const auction = db.select().from(schema.auctions).where(eq(schema.auctions.id, a)).get()!;
    expect(["ENDED"]).toContain(auction.status);
    const bids = db.select().from(schema.bids).where(eq(schema.bids.auctionId, a)).all();
    expect(bids.filter((b) => b.status === "ACCEPTED")).toHaveLength(1);

    // A bid after buy-now is rejected — the auction is over.
    const late = placeBid({ auctionId: a, userId: bidder, amountMinor: 20000_00, idempotencyKey: "b2" });
    expect(late.ok).toBe(false);
  });

  it("concurrent buy-now: exactly one order is created", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const users = await Promise.all([makeUser(), makeUser(), makeUser(), makeUser(), makeUser()]);
    const v = await makeVehicle({ saleType: "BUY_NOW", buyNowPrice: 30000_00, buyNowCurrency: "EUR" });

    const results = users.map((u) => {
      try {
        return { ok: true as const, orderId: buyNow({ vehicleId: v, userId: u }).orderId };
      } catch {
        return { ok: false as const };
      }
    });
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const orders = db.select().from(schema.orders).where(eq(schema.orders.vehicleId, v)).all();
    expect(orders).toHaveLength(1);
  });

  it("buy-now retry by the same buyer returns the same pending order", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const u = await makeUser();
    const v = await makeVehicle({ saleType: "BUY_NOW", buyNowPrice: 30000_00, buyNowCurrency: "EUR" });
    const first = buyNow({ vehicleId: v, userId: u });
    const second = buyNow({ vehicleId: v, userId: u });
    expect(second.orderId).toBe(first.orderId);
    const orders = db.select().from(schema.orders).where(eq(schema.orders.vehicleId, v)).all();
    expect(orders).toHaveLength(1);
  });

  it("finalize is idempotent — second run creates no duplicate orders", async () => {
    const { placeBid, finalizeDueAuctions } = await import("@/features/auctions/engine");
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const u = await makeUser();
    const v = await makeVehicle();
    const a = await makeAuction(v, { endsAt: Date.now() + 1000 });
    placeBid({ auctionId: a, userId: u, amountMinor: 10000_00, idempotencyKey: "x" });

    const t = Date.now() + 2000;
    const first = finalizeDueAuctions(t);
    const second = finalizeDueAuctions(t + 1000);
    expect(first).toContain(a);
    expect(second).toHaveLength(0);
    const orders = db.select().from(schema.orders).where(eq(schema.orders.auctionId, a)).all();
    expect(orders).toHaveLength(1);
  });

  it("approving a result twice fails on the second attempt", async () => {
    const { placeBid, finalizeDueAuctions } = await import("@/features/auctions/engine");
    const { approveResult } = await import("@/features/auctions/decisions");
    const u = await makeUser();
    const admin = await makeUser("admin");
    const v = await makeVehicle();
    const a = await makeAuction(v, { endsAt: Date.now() + 1000 });
    placeBid({ auctionId: a, userId: u, amountMinor: 10000_00, idempotencyKey: "x" });
    finalizeDueAuctions(Date.now() + 2000);
    approveResult(a, admin);
    expect(() => approveResult(a, admin)).toThrow();
  });

  it("simulated restart: expired auctions finalize correctly after downtime", async () => {
    const { placeBid, finalizeDueAuctions } = await import("@/features/auctions/engine");
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const u = await makeUser();
    const v = await makeVehicle();
    // Auction ends while the process is "down" — next tick finalizes it.
    const a = await makeAuction(v, { endsAt: Date.now() + 1000 });
    placeBid({ auctionId: a, userId: u, amountMinor: 10000_00, idempotencyKey: "x" });

    const afterDowntime = Date.now() + 60 * 60_000;
    finalizeDueAuctions(afterDowntime);
    const auction = db.select().from(schema.auctions).where(eq(schema.auctions.id, a)).get()!;
    expect(auction.status).toBe("AWAITING_ADMIN_APPROVAL");
    expect(auction.winnerUserId).toBe(u);
  });
});

describe("scheduler housekeeping", () => {
  it("removes expired sessions", async () => {
    const { cleanupExpiredAuth } = await import("@/features/auctions/engine");
    const { db, schema } = await import("@/lib/db");
    const { eq, count } = await import("drizzle-orm");
    const u = await makeUser();
    const t = Date.now();
    db.insert(schema.sessions).values([
      { id: "expired", userId: u, expiresAt: t - 1000, createdAt: t - 10000 },
      { id: "live", userId: u, expiresAt: t + 10000, createdAt: t },
    ]).run();
    cleanupExpiredAuth(t);
    const left = db.select({ c: count() }).from(schema.sessions).where(eq(schema.sessions.userId, u)).get()!.c;
    expect(left).toBe(1);
  });
});
