import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { resetDb, makeUser, makeVehicle, makeAuction } from "./helpers";

const engine = () => import("@/features/auctions/engine");
const dbmod = () => import("@/lib/db");

beforeEach(resetDb);

describe("placeBid", () => {
  it("accepts the first bid at the starting price", async () => {
    const { placeBid } = await engine();
    const user = await makeUser();
    const vid = await makeVehicle();
    const aid = await makeAuction(vid);

    const r = placeBid({ auctionId: aid, userId: user, amountMinor: 10000_00, idempotencyKey: randomUUID() });
    expect(r.ok).toBe(true);

    const { db, schema } = await dbmod();
    const { eq } = await import("drizzle-orm");
    const a = db.select().from(schema.auctions).where(eq(schema.auctions.id, aid)).get()!;
    expect(a.currentBid).toBe(10000_00);
    expect(a.highestBidderId).toBe(user);
    expect(a.bidCount).toBe(1);
  });

  it("rejects a first bid below the starting price", async () => {
    const { placeBid } = await engine();
    const user = await makeUser();
    const aid = await makeAuction(await makeVehicle());

    const r = placeBid({ auctionId: aid, userId: user, amountMinor: 5000_00, idempotencyKey: randomUUID() });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/^below_minimum/);

    const { db, schema } = await dbmod();
    const { eq } = await import("drizzle-orm");
    const rejected = db.select().from(schema.bids).where(eq(schema.bids.status, "REJECTED")).all();
    expect(rejected).toHaveLength(1);
    const a = db.select().from(schema.auctions).where(eq(schema.auctions.id, aid)).get()!;
    expect(a.currentBid).toBeNull();
  });

  it("rejects a bid below current + increment", async () => {
    const { placeBid } = await engine();
    const [u1, u2] = [await makeUser(), await makeUser()];
    const aid = await makeAuction(await makeVehicle());
    placeBid({ auctionId: aid, userId: u1, amountMinor: 10000_00, idempotencyKey: randomUUID() });

    const low = placeBid({ auctionId: aid, userId: u2, amountMinor: 10100_00, idempotencyKey: randomUUID() });
    expect(low.ok).toBe(false);
    const ok = placeBid({ auctionId: aid, userId: u2, amountMinor: 10250_00, idempotencyKey: randomUUID() });
    expect(ok.ok).toBe(true);
  });

  it("is idempotent — same key returns the recorded outcome", async () => {
    const { placeBid } = await engine();
    const user = await makeUser();
    const aid = await makeAuction(await makeVehicle());
    const key = randomUUID();
    const r1 = placeBid({ auctionId: aid, userId: user, amountMinor: 10000_00, idempotencyKey: key });
    const r2 = placeBid({ auctionId: aid, userId: user, amountMinor: 10000_00, idempotencyKey: key });
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(r2.bidId).toBe(r1.bidId);

    const { db, schema } = await dbmod();
    const { eq } = await import("drizzle-orm");
    const all = db.select().from(schema.bids).where(eq(schema.bids.auctionId, aid)).all();
    expect(all).toHaveLength(1);
  });

  it("rejects bids after the end time", async () => {
    const { placeBid } = await engine();
    const user = await makeUser();
    const aid = await makeAuction(await makeVehicle(), { endsAt: Date.now() - 1000 });
    const r = placeBid({ auctionId: aid, userId: user, amountMinor: 10000_00, idempotencyKey: randomUUID() });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("auction_ended");
  });

  it("rejects bids on non-live auctions", async () => {
    const { placeBid } = await engine();
    const user = await makeUser();
    const aid = await makeAuction(await makeVehicle(), { status: "SCHEDULED" });
    const r = placeBid({ auctionId: aid, userId: user, amountMinor: 10000_00, idempotencyKey: randomUUID() });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("auction_not_live");
  });

  it("forbids admins from bidding", async () => {
    const { placeBid } = await engine();
    const admin = await makeUser("admin");
    const aid = await makeAuction(await makeVehicle());
    const r = placeBid({ auctionId: aid, userId: admin, userRole: "admin", amountMinor: 10000_00, idempotencyKey: randomUUID() });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("forbidden_role");
  });

  it("extends the auction when a bid lands inside the window", async () => {
    const { placeBid } = await engine();
    const user = await makeUser();
    const ends = Date.now() + 60_000; // 1 min left
    const aid = await makeAuction(await makeVehicle(), {
      endsAt: ends,
      extensionWindowSec: 120,
      extensionDurationSec: 120,
    });
    const r = placeBid({ auctionId: aid, userId: user, amountMinor: 10000_00, idempotencyKey: randomUUID() });
    expect(r.ok).toBe(true);
    expect(r.auction.endsAt).toBe(ends + 120_000);
  });

  it("serializes concurrent bids — only valid sequential ones are accepted", async () => {
    const { placeBid } = await engine();
    const users = await Promise.all([makeUser(), makeUser(), makeUser(), makeUser(), makeUser()]);
    const aid = await makeAuction(await makeVehicle());

    // 5 users all try to bid the SAME valid amount simultaneously
    const results = users.map((u) =>
      placeBid({ auctionId: aid, userId: u, amountMinor: 10000_00, idempotencyKey: randomUUID() }),
    );
    const accepted = results.filter((r) => r.ok);
    const rejected = results.filter((r) => !r.ok);
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(4);
    rejected.forEach((r) => expect(r.reason).toMatch(/^below_minimum/));

    const { db, schema } = await dbmod();
    const { eq } = await import("drizzle-orm");
    const a = db.select().from(schema.auctions).where(eq(schema.auctions.id, aid)).get()!;
    expect(a.bidCount).toBe(1);
    expect(a.currentBid).toBe(10000_00);
  });
});

describe("lifecycle", () => {
  it("promotes scheduled auctions and finalizes expired ones", async () => {
    const { activateDueAuctions, finalizeDueAuctions, placeBid } = await engine();
    const winner = await makeUser();
    const loser = await makeUser();

    const vScheduled = await makeVehicle();
    const aidScheduled = await makeAuction(vScheduled, { status: "SCHEDULED", startsAt: Date.now() - 1000 });
    expect(activateDueAuctions()).toBe(1);

    const vid = await makeVehicle();
    const aid = await makeAuction(vid, { endsAt: Date.now() + 60_000 });
    placeBid({ auctionId: aid, userId: loser, amountMinor: 10000_00, idempotencyKey: randomUUID() });
    placeBid({ auctionId: aid, userId: winner, amountMinor: 10500_00, idempotencyKey: randomUUID() });

    // expire it
    const { db, schema } = await dbmod();
    const { eq } = await import("drizzle-orm");
    db.update(schema.auctions).set({ endsAt: Date.now() - 1000 }).where(eq(schema.auctions.id, aid)).run();

    const finalized = finalizeDueAuctions();
    expect(finalized).toContain(aid);

    const a = db.select().from(schema.auctions).where(eq(schema.auctions.id, aid)).get()!;
    expect(a.status).toBe("AWAITING_ADMIN_APPROVAL");
    expect(a.winnerUserId).toBe(winner);

    const order = db.select().from(schema.orders).where(eq(schema.orders.auctionId, aid)).get()!;
    expect(order.status).toBe("PENDING_APPROVAL");
    expect(order.type).toBe("AUCTION_WIN");
    expect(order.amount).toBe(10500_00);

    const veh = db.select().from(schema.vehicles).where(eq(schema.vehicles.id, vid)).get()!;
    expect(veh.status).toBe("RESERVED");

    const sched = db.select().from(schema.auctions).where(eq(schema.auctions.id, aidScheduled)).get()!;
    expect(sched.status).toBe("LIVE");
  });

  it("marks auctions with no bids as UNSOLD", async () => {
    const { finalizeDueAuctions } = await engine();
    const aid = await makeAuction(await makeVehicle(), { endsAt: Date.now() - 1000 });
    finalizeDueAuctions();
    const { db, schema } = await dbmod();
    const { eq } = await import("drizzle-orm");
    expect(db.select().from(schema.auctions).where(eq(schema.auctions.id, aid)).get()!.status).toBe("UNSOLD");
  });
});

describe("buyNow", () => {
  it("reserves the vehicle atomically — second buyer fails", async () => {
    const { buyNow } = await engine();
    const [u1, u2] = [await makeUser(), await makeUser()];
    const vid = await makeVehicle({ saleType: "BUY_NOW", buyNowPrice: 25000_00, buyNowCurrency: "EUR" });

    const r1 = buyNow({ vehicleId: vid, userId: u1 });
    expect(r1.orderId).toBeTruthy();
    expect(() => buyNow({ vehicleId: vid, userId: u2 })).toThrowError(/not available/i);

    const { db, schema } = await dbmod();
    const { eq } = await import("drizzle-orm");
    const veh = db.select().from(schema.vehicles).where(eq(schema.vehicles.id, vid)).get()!;
    expect(veh.status).toBe("RESERVED");
    const orders = db.select().from(schema.orders).where(eq(schema.orders.vehicleId, vid)).all();
    expect(orders).toHaveLength(1);
    expect(orders[0].type).toBe("BUY_NOW");
  });

  it("closes a live auction on buy-now and preserves bid history", async () => {
    const { buyNow, placeBid } = await engine();
    const bidder = await makeUser();
    const buyer = await makeUser();
    const vid = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 50000_00, buyNowCurrency: "EUR" });
    const aid = await makeAuction(vid);

    placeBid({ auctionId: aid, userId: bidder, amountMinor: 10000_00, idempotencyKey: randomUUID() });
    const { orderId } = buyNow({ vehicleId: vid, userId: buyer });
    expect(orderId).toBeTruthy();

    const { db, schema } = await dbmod();
    const { eq } = await import("drizzle-orm");
    const a = db.select().from(schema.auctions).where(eq(schema.auctions.id, aid)).get()!;
    expect(a.status).toBe("ENDED");
    const bids = db.select().from(schema.bids).where(eq(schema.bids.auctionId, aid)).all();
    expect(bids).toHaveLength(1); // history preserved
    // bidding now impossible
    const late = await engine();
    const r = late.placeBid({ auctionId: aid, userId: buyer, amountMinor: 10250_00, idempotencyKey: randomUUID() });
    expect(r.ok).toBe(false);
  });
});
