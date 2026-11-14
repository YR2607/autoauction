import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, makeUser, makeVehicle, makeAuction } from "./helpers";

beforeEach(resetDb);

const getAuction = async (id: string) => {
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");
  return db.select().from(schema.auctions).where(eq(schema.auctions.id, id)).get()!;
};
const getVehicle = async (id: string) => {
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");
  return db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id)).get()!;
};
const ordersFor = async (vehicleId: string) => {
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");
  return db.select().from(schema.orders).where(eq(schema.orders.vehicleId, vehicleId)).all();
};

describe("buyNow on scheduled auctions", () => {
  it("Buy Now before a scheduled auction starts closes it and reserves the vehicle", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    const buyer = await makeUser();
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 40000_00, buyNowCurrency: "EUR" });
    const a = await makeAuction(v, { status: "SCHEDULED", startsAt: Date.now() + 3600_000, endsAt: Date.now() + 7200_000 });

    const { orderId } = buyNow({ vehicleId: v, userId: buyer });
    const auction = await getAuction(a);
    expect(auction.status).toBe("ENDED");
    expect(auction.closeReason).toBe("buy_now");
    const vehicle = await getVehicle(v);
    expect(vehicle.status).toBe("RESERVED");
    const orders = await ordersFor(v);
    expect(orders).toHaveLength(1);
    expect(orders[0].id).toBe(orderId);
    expect(orders[0].type).toBe("BUY_NOW");
  });

  it("Buy Now after auction expiration is refused — vehicle already reserved by winner", async () => {
    const { placeBid, buyNow, finalizeDueAuctions } = await import("@/features/auctions/engine");
    const [bidder, lateBuyer] = await Promise.all([makeUser(), makeUser()]);
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 40000_00, buyNowCurrency: "EUR" });
    const a = await makeAuction(v, { endsAt: Date.now() + 1000 });
    placeBid({ auctionId: a, userId: bidder, amountMinor: 10000_00, idempotencyKey: "x" });
    finalizeDueAuctions(Date.now() + 2000);

    await expect(getAuction(a)).resolves.toMatchObject({ status: "AWAITING_ADMIN_APPROVAL" });
    expect(() => buyNow({ vehicleId: v, userId: lateBuyer })).toThrow(/not available/i);
    expect((await ordersFor(v)).filter((o) => o.status === "PENDING_APPROVAL")).toHaveLength(1);
  });

  it("concurrent Buy Now + bid on a scheduled auction never double-sells", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    const users = await Promise.all([makeUser(), makeUser(), makeUser()]);
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 40000_00, buyNowCurrency: "EUR" });
    await makeAuction(v, { status: "SCHEDULED", startsAt: Date.now() + 3600_000, endsAt: Date.now() + 7200_000 });

    const results = users.map((u) => {
      try {
        return { ok: true as const, orderId: buyNow({ vehicleId: v, userId: u }).orderId };
      } catch {
        return { ok: false as const };
      }
    });
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await ordersFor(v)).toHaveLength(1);
  });
});

describe("rejected Buy Now recovery", () => {
  async function setupBuyNowEndedAuction() {
    const { buyNow } = await import("@/features/auctions/engine");
    const admin = await makeUser("admin");
    const buyer = await makeUser();
    const bidder = await makeUser();
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 40000_00, buyNowCurrency: "EUR" });
    const a = await makeAuction(v, { status: "LIVE" });
    const { placeBid } = await import("@/features/auctions/engine");
    placeBid({ auctionId: a, userId: bidder, amountMinor: 10000_00, idempotencyKey: "b1" });
    const { orderId } = buyNow({ vehicleId: v, userId: buyer });
    return { admin, buyer, bidder, v, a, orderId };
  }

  it("reject + UNSOLD marks the auction unsold and frees the vehicle", async () => {
    const { rejectOrder } = await import("@/features/auctions/decisions");
    const { admin, v, a, orderId } = await setupBuyNowEndedAuction();
    rejectOrder(orderId, admin, "buyer backed out", { auctionAction: "UNSOLD" });

    expect((await getAuction(a)).status).toBe("UNSOLD");
    expect((await getVehicle(v)).status).toBe("PUBLISHED");
    // bid history preserved
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const bids = db.select().from(schema.bids).where(eq(schema.bids.auctionId, a)).all();
    expect(bids.filter((b) => b.status === "ACCEPTED")).toHaveLength(1);
  });

  it("reject + REOPEN resumes the auction with bids preserved", async () => {
    const { rejectOrder } = await import("@/features/auctions/decisions");
    const { admin, v, a, orderId } = await setupBuyNowEndedAuction();
    const newEnd = Date.now() + 3600_000;
    rejectOrder(orderId, admin, "buyer backed out", { auctionAction: "REOPEN", newEndsAt: newEnd });

    const auction = await getAuction(a);
    expect(auction.status).toBe("LIVE");
    expect(auction.endsAt).toBe(newEnd);
    expect(auction.closeReason).toBeNull();
    // the preserved bid still counts — next bid must beat it
    const { placeBid } = await import("@/features/auctions/engine");
    const bidder2 = await makeUser();
    const r = placeBid({ auctionId: a, userId: bidder2, amountMinor: 10100_00, idempotencyKey: "b2" });
    expect(r.ok).toBe(false); // below min 10250
    expect(placeBid({ auctionId: a, userId: bidder2, amountMinor: 10250_00, idempotencyKey: "b3" }).ok).toBe(true);
    expect((await getVehicle(v)).status).toBe("PUBLISHED");
  });

  it("reject + REOPEN with a past end time is refused", async () => {
    const { rejectOrder } = await import("@/features/auctions/decisions");
    const { admin, a, orderId } = await setupBuyNowEndedAuction();
    expect(() =>
      rejectOrder(orderId, admin, "backed out", { auctionAction: "REOPEN", newEndsAt: Date.now() - 1000 }),
    ).toThrow(/future/i);
    expect((await getAuction(a)).status).toBe("ENDED");
  });

  it("audit + event trail records the recovery decision", async () => {
    const { rejectOrder } = await import("@/features/auctions/decisions");
    const { admin, a, orderId } = await setupBuyNowEndedAuction();
    rejectOrder(orderId, admin, "backed out", { auctionAction: "REOPEN" });
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const events = db.select().from(schema.auctionEvents).where(eq(schema.auctionEvents.auctionId, a)).all();
    expect(events.map((e) => e.toStatus)).toEqual(
      expect.arrayContaining(["ENDED", "LIVE"]),
    );
    const audits = db.select().from(schema.adminAuditLogs).all();
    expect(audits.some((l) => l.action === "order.reject")).toBe(true);
  });
});

describe("NEXT_BIDDER consecutive rejections", () => {
  async function setupThreeBidders() {
    const { placeBid, finalizeDueAuctions } = await import("@/features/auctions/engine");
    const admin = await makeUser("admin");
    const [w1, w2, w3] = await Promise.all([makeUser(), makeUser(), makeUser()]);
    const v = await makeVehicle();
    const a = await makeAuction(v, { startingPrice: 10000_00, bidIncrement: 250_00, endsAt: Date.now() + 1000 });
    placeBid({ auctionId: a, userId: w1, amountMinor: 10000_00, idempotencyKey: "a" });
    placeBid({ auctionId: a, userId: w2, amountMinor: 10500_00, idempotencyKey: "b" });
    placeBid({ auctionId: a, userId: w3, amountMinor: 11000_00, idempotencyKey: "c" });
    finalizeDueAuctions(Date.now() + 2000);
    return { admin, w1, w2, w3, v, a };
  }

  it("three consecutive rejects walk down the ladder, never re-offering a rejected winner", async () => {
    const { rejectResult } = await import("@/features/auctions/decisions");
    const { admin, w1, w2, w3, a } = await setupThreeBidders();
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");

    // w3 (highest) rejected → offer goes to w2
    let auction = await getAuction(a);
    expect(auction.winnerUserId).toBe(w3);
    rejectResult(a, admin, "w3 dropped", "NEXT_BIDDER");
    auction = await getAuction(a);
    expect(auction.winnerUserId).toBe(w2);
    expect(auction.status).toBe("AWAITING_ADMIN_APPROVAL");

    // w2 rejected → offer goes to w1 — NOT back to w3
    rejectResult(a, admin, "w2 dropped", "NEXT_BIDDER");
    auction = await getAuction(a);
    expect(auction.winnerUserId).toBe(w1);

    // w1 rejected → nobody left → UNSOLD
    rejectResult(a, admin, "w1 dropped", "NEXT_BIDDER");
    auction = await getAuction(a);
    expect(auction.status).toBe("UNSOLD");

    const orders = db.select().from(schema.orders).where(eq(schema.orders.auctionId, a)).all();
    // exactly 3 orders: one per offered winner, all REJECTED, none duplicated
    expect(orders).toHaveLength(3);
    expect(new Set(orders.map((o) => o.buyerId)).size).toBe(3);
    expect(orders.filter((o) => o.status === "PENDING_APPROVAL")).toHaveLength(0);
    expect(orders.every((o) => o.status === "REJECTED")).toBe(true);
  });

  it("no eligible bidder → UNSOLD immediately", async () => {
    const { placeBid, finalizeDueAuctions } = await import("@/features/auctions/engine");
    const { rejectResult } = await import("@/features/auctions/decisions");
    const admin = await makeUser("admin");
    const u = await makeUser();
    const v = await makeVehicle();
    const a = await makeAuction(v, { endsAt: Date.now() + 1000 });
    placeBid({ auctionId: a, userId: u, amountMinor: 10000_00, idempotencyKey: "x" });
    finalizeDueAuctions(Date.now() + 2000);
    rejectResult(a, admin, "dropped", "NEXT_BIDDER");
    expect((await getAuction(a)).status).toBe("UNSOLD");
    expect((await getVehicle(v)).status).toBe("PUBLISHED");
  });
});
