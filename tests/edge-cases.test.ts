import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, makeUser, makeVehicle, makeAuction } from "./helpers";

beforeEach(resetDb);

const getAuction = async (id: string) => {
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");
  return db.select().from(schema.auctions).where(eq(schema.auctions.id, id)).get()!;
};
const getOrder = async (id: string) => {
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");
  return db.select().from(schema.orders).where(eq(schema.orders.id, id)).get()!;
};
const getVehicle = async (id: string) => {
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");
  return db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id)).get()!;
};
const pendingOrders = async (auctionId: string) => {
  const { db, schema } = await import("@/lib/db");
  const { and, eq } = await import("drizzle-orm");
  return db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.auctionId, auctionId), eq(schema.orders.status, "PENDING_APPROVAL")))
    .all();
};

async function setupTwoBidderAwaiting() {
  const { placeBid, finalizeDueAuctions } = await import("@/features/auctions/engine");
  const admin = await makeUser("admin");
  const [w1, w2] = await Promise.all([makeUser(), makeUser()]);
  const v = await makeVehicle();
  const a = await makeAuction(v, { startingPrice: 10000_00, bidIncrement: 250_00, endsAt: Date.now() + 1000 });
  placeBid({ auctionId: a, userId: w1, amountMinor: 10000_00, idempotencyKey: "a" });
  placeBid({ auctionId: a, userId: w2, amountMinor: 10500_00, idempotencyKey: "b" });
  finalizeDueAuctions(Date.now() + 2000);
  const order = (await pendingOrders(a))[0];
  return { admin, w1, w2, v, a, order };
}

describe("stale order protection", () => {
  it("a rejected order cannot approve the NEXT_BIDDER order that replaced it", async () => {
    const { rejectResult, approveOrder } = await import("@/features/auctions/decisions");
    const { admin, w1, a, order } = await setupTwoBidderAwaiting();
    // admin rejects w2 → NEXT_BIDDER creates a new pending order for w1
    rejectResult(a, admin, "winner dropped", "NEXT_BIDDER");
    const next = (await pendingOrders(a))[0];
    expect(next.buyerId).toBe(w1);
    expect(next.id).not.toBe(order.id);

    // stale request referencing the OLD rejected order must not touch the new one
    expect(() => approveOrder(order.id, admin)).toThrow(/not pending/i);
    expect((await getOrder(next.id)).status).toBe("PENDING_APPROVAL");
    expect((await getAuction(a)).status).toBe("AWAITING_ADMIN_APPROVAL");
  });

  it("a rejected order cannot reject the NEXT_BIDDER order that replaced it", async () => {
    const { rejectResult, rejectOrder } = await import("@/features/auctions/decisions");
    const { admin, a, order } = await setupTwoBidderAwaiting();
    rejectResult(a, admin, "winner dropped", "NEXT_BIDDER");
    const next = (await pendingOrders(a))[0];

    expect(() =>
      rejectOrder(order.id, admin, "stale reject", { next: "UNSOLD" }),
    ).toThrow(/not pending/i);
    expect((await getOrder(next.id)).status).toBe("PENDING_APPROVAL");
  });

  it("expectedOrderId guard refuses a mismatched pending order", async () => {
    const { rejectResult, approveResult } = await import("@/features/auctions/decisions");
    const { admin, a, order } = await setupTwoBidderAwaiting();
    rejectResult(a, admin, "winner dropped", "NEXT_BIDDER");
    const next = (await pendingOrders(a))[0];

    // direct call addressing the stale order id against the auction
    expect(() => approveResult(a, admin, order.id)).toThrow(/changed|refresh/i);
    expect((await getOrder(next.id)).status).toBe("PENDING_APPROVAL");
    expect(() => rejectResult(a, admin, "x".repeat(5), "UNSOLD", undefined, order.id)).toThrow(
      /changed|refresh/i,
    );
  });

  it("the correct current pending order can still be approved and rejected", async () => {
    const { approveOrder, rejectOrder } = await import("@/features/auctions/decisions");
    const { admin, a, order } = await setupTwoBidderAwaiting();
    approveOrder(order.id, admin);
    expect((await getOrder(order.id)).status).toBe("APPROVED");
    expect((await getAuction(a)).status).toBe("SOLD");

    const s = await setupTwoBidderAwaiting();
    rejectOrder(s.order.id, admin, "fair reject", { next: "UNSOLD" });
    expect((await getOrder(s.order.id)).status).toBe("REJECTED");
    expect((await getAuction(s.a)).status).toBe("UNSOLD");
  });
});

describe("explicit buy-now recovery required", () => {
  async function setupBuyNowEnded() {
    const { buyNow } = await import("@/features/auctions/engine");
    const admin = await makeUser("admin");
    const buyer = await makeUser();
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 40000_00, buyNowCurrency: "EUR" });
    const a = await makeAuction(v, { status: "LIVE" });
    const { orderId } = buyNow({ vehicleId: v, userId: buyer });
    return { admin, v, a, orderId };
  }

  it("rejecting a buy-now-ended auction without auctionAction is refused", async () => {
    const { rejectOrder } = await import("@/features/auctions/decisions");
    const { admin, a, orderId } = await setupBuyNowEnded();
    expect(() => rejectOrder(orderId, admin, "backing out")).toThrow(/auctionAction/i);
    // nothing changed
    expect((await getOrder(orderId)).status).toBe("PENDING_APPROVAL");
    expect((await getAuction(a)).status).toBe("ENDED");
  });

  it("explicit UNSOLD works and frees the vehicle", async () => {
    const { rejectOrder } = await import("@/features/auctions/decisions");
    const { admin, v, a, orderId } = await setupBuyNowEnded();
    rejectOrder(orderId, admin, "backing out", { auctionAction: "UNSOLD" });
    expect((await getAuction(a)).status).toBe("UNSOLD");
    expect((await getVehicle(v)).status).toBe("PUBLISHED");
  });

  it("a buy-now order that did NOT close an auction rejects normally without auctionAction", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    const { rejectOrder } = await import("@/features/auctions/decisions");
    const admin = await makeUser("admin");
    const buyer = await makeUser();
    const v = await makeVehicle({ saleType: "BUY_NOW", buyNowPrice: 30000_00, buyNowCurrency: "EUR" });
    const { orderId } = buyNow({ vehicleId: v, userId: buyer });
    rejectOrder(orderId, admin, "not eligible");
    expect((await getOrder(orderId)).status).toBe("REJECTED");
    expect((await getVehicle(v)).status).toBe("PUBLISHED");
  });
});

describe("buy-now availability across all auction states", () => {
  const setupCombined = async (auctionOpts: Parameters<typeof makeAuction>[1]) => {
    const shopper = await makeUser();
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 20000_00, buyNowCurrency: "EUR" });
    const a = await makeAuction(v, auctionOpts);
    return { shopper, v, a };
  };

  it("UNSOLD auction with currentBid >= buyNowPrice → refused", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    const { shopper, v } = await setupCombined({ status: "UNSOLD", currentBid: 20000_00 });
    expect(() => buyNow({ vehicleId: v, userId: shopper })).toThrow(/current bid/i);
    expect((await getVehicle(v)).status).toBe("PUBLISHED");
  });

  it("CANCELLED auction with currentBid >= buyNowPrice → refused", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    const { shopper, v } = await setupCombined({ status: "CANCELLED", currentBid: 25000_00 });
    expect(() => buyNow({ vehicleId: v, userId: shopper })).toThrow(/current bid/i);
  });

  it("UNSOLD auction with currentBid below buyNowPrice → allowed, auction untouched", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    const { shopper, v, a } = await setupCombined({ status: "UNSOLD", currentBid: 15000_00 });
    const { orderId } = buyNow({ vehicleId: v, userId: shopper });
    expect(orderId).toBeTruthy();
    expect((await getAuction(a)).status).toBe("UNSOLD");
    expect((await getVehicle(v)).status).toBe("RESERVED");
    expect((await getOrder(orderId)).type).toBe("BUY_NOW");
  });

  it("currency mismatch is refused in any auction state", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    const { shopper, v } = await setupCombined({ status: "UNSOLD", currency: "USD", currentBid: null });
    expect(() => buyNow({ vehicleId: v, userId: shopper })).toThrow(/currency/i);
  });

  it("in-flight terminal states are never purchasable", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    for (const status of ["AWAITING_ADMIN_APPROVAL", "ENDED", "SOLD"] as const) {
      const { shopper, v } = await setupCombined({ status, currentBid: 5000_00 });
      // vehicle PUBLISHED but auction mid-resolution — must still refuse
      expect(() => buyNow({ vehicleId: v, userId: shopper }), status).toThrow();
    }
  });

  it("sold vehicle cannot be bought again via buyNow", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    const shopper = await makeUser();
    const v = await makeVehicle({
      status: "SOLD", saleType: "AUCTION_BUY_NOW", buyNowPrice: 20000_00, buyNowCurrency: "EUR",
    });
    await makeAuction(v, { status: "SOLD", currentBid: 21000_00 });
    expect(() => buyNow({ vehicleId: v, userId: shopper })).toThrow();
    expect((await getVehicle(v)).status).toBe("SOLD");
  });
});
