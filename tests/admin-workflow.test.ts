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
const getOrder = async (id: string) => {
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");
  return db.select().from(schema.orders).where(eq(schema.orders.id, id)).get()!;
};
const ordersForAuction = async (auctionId: string) => {
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");
  return db.select().from(schema.orders).where(eq(schema.orders.auctionId, auctionId)).all();
};

async function setupEndedWithWinner() {
  const { placeBid, finalizeDueAuctions } = await import("@/features/auctions/engine");
  const admin = await makeUser("admin");
  const winner = await makeUser();
  const v = await makeVehicle();
  const a = await makeAuction(v, { endsAt: Date.now() + 1000 });
  placeBid({ auctionId: a, userId: winner, amountMinor: 10000_00, idempotencyKey: "w" });
  finalizeDueAuctions(Date.now() + 2000);
  const order = (await ordersForAuction(a)).find((o) => o.status === "PENDING_APPROVAL")!;
  return { admin, winner, v, a, order };
}

describe("single authoritative approval workflow", () => {
  it("approveOrder on an AUCTION_WIN order delegates to approveResult — consistent states", async () => {
    const { approveOrder } = await import("@/features/auctions/decisions");
    const { admin, v, a, order } = await setupEndedWithWinner();
    approveOrder(order.id, admin);

    expect((await getOrder(order.id)).status).toBe("APPROVED");
    expect((await getAuction(a)).status).toBe("SOLD");
    expect((await getVehicle(v)).status).toBe("SOLD");
  });

  it("rejectOrder on an AUCTION_WIN order without a next action is refused", async () => {
    const { rejectOrder } = await import("@/features/auctions/decisions");
    const { admin, a, order } = await setupEndedWithWinner();
    expect(() => rejectOrder(order.id, admin, "bad result")).toThrow(/next action/i);
    // nothing changed — auction still awaiting, order still pending
    expect((await getAuction(a)).status).toBe("AWAITING_ADMIN_APPROVAL");
    expect((await getOrder(order.id)).status).toBe("PENDING_APPROVAL");
  });

  it("rejectOrder on an AUCTION_WIN order with next=UNSOLD delegates correctly", async () => {
    const { rejectOrder } = await import("@/features/auctions/decisions");
    const { admin, v, a, order } = await setupEndedWithWinner();
    rejectOrder(order.id, admin, "bad result", { next: "UNSOLD" });

    expect((await getOrder(order.id)).status).toBe("REJECTED");
    expect((await getAuction(a)).status).toBe("UNSOLD");
    expect((await getVehicle(v)).status).toBe("PUBLISHED");
    // no orphan: no auction remains awaiting without a pending order
    const pending = (await ordersForAuction(a)).filter((o) => o.status === "PENDING_APPROVAL");
    expect(pending).toHaveLength(0);
  });

  it("rejectOrder on an AUCTION_WIN order with next=NEXT_BIDDER awards the runner-up", async () => {
    const { placeBid, finalizeDueAuctions } = await import("@/features/auctions/engine");
    const { rejectOrder } = await import("@/features/auctions/decisions");
    const admin = await makeUser("admin");
    const [w1, w2] = await Promise.all([makeUser(), makeUser()]);
    const v = await makeVehicle();
    const a = await makeAuction(v, { startingPrice: 10000_00, bidIncrement: 250_00, endsAt: Date.now() + 1000 });
    placeBid({ auctionId: a, userId: w1, amountMinor: 10000_00, idempotencyKey: "a" });
    placeBid({ auctionId: a, userId: w2, amountMinor: 10500_00, idempotencyKey: "b" });
    finalizeDueAuctions(Date.now() + 2000);
    const order = (await ordersForAuction(a)).find((o) => o.status === "PENDING_APPROVAL")!;

    rejectOrder(order.id, admin, "winner dropped", { next: "NEXT_BIDDER" });
    const auction = await getAuction(a);
    expect(auction.status).toBe("AWAITING_ADMIN_APPROVAL");
    expect(auction.winnerUserId).toBe(w1);
    const pending = (await ordersForAuction(a)).filter((o) => o.status === "PENDING_APPROVAL");
    expect(pending).toHaveLength(1);
    expect(pending[0].buyerId).toBe(w1);
  });

  it("double approval through either path is idempotent-safe (second call fails)", async () => {
    const { approveOrder, approveResult } = await import("@/features/auctions/decisions");
    const { admin, a, order } = await setupEndedWithWinner();
    approveOrder(order.id, admin);
    expect(() => approveResult(a, admin)).toThrow(/nothing to approve/i);
  });
});

describe("Buy Now pricing rules", () => {
  it("Buy Now refused when the current bid meets the fixed price", async () => {
    const { placeBid, buyNow } = await import("@/features/auctions/engine");
    const [bidder, shopper] = await Promise.all([makeUser(), makeUser()]);
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 20000_00, buyNowCurrency: "EUR" });
    const a = await makeAuction(v, { startingPrice: 10000_00, bidIncrement: 250_00 });
    placeBid({ auctionId: a, userId: bidder, amountMinor: 20000_00, idempotencyKey: "x" });

    expect(() => buyNow({ vehicleId: v, userId: shopper })).toThrow(/current bid/i);
    // auction untouched
    expect((await getAuction(a)).status).toBe("LIVE");
    expect((await getVehicle(v)).status).toBe("PUBLISHED");
  });

  it("Buy Now refused when the current bid exceeds the fixed price", async () => {
    const { placeBid, buyNow } = await import("@/features/auctions/engine");
    const [bidder, shopper] = await Promise.all([makeUser(), makeUser()]);
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 20000_00, buyNowCurrency: "EUR" });
    const a = await makeAuction(v, { startingPrice: 10000_00, bidIncrement: 250_00 });
    placeBid({ auctionId: a, userId: bidder, amountMinor: 25000_00, idempotencyKey: "x" });
    expect(() => buyNow({ vehicleId: v, userId: shopper })).toThrow(/current bid/i);
  });

  it("Buy Now still allowed while the bid is below the fixed price", async () => {
    const { placeBid, buyNow } = await import("@/features/auctions/engine");
    const [bidder, shopper] = await Promise.all([makeUser(), makeUser()]);
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 20000_00, buyNowCurrency: "EUR" });
    const a = await makeAuction(v, { startingPrice: 10000_00, bidIncrement: 250_00 });
    placeBid({ auctionId: a, userId: bidder, amountMinor: 15000_00, idempotencyKey: "x" });
    const { orderId } = buyNow({ vehicleId: v, userId: shopper });
    expect(orderId).toBeTruthy();
    expect((await getOrder(orderId)).amount).toBe(20000_00);
  });

  it("createAuction rejects a currency that differs from the Buy Now currency", async () => {
    const { createAuction } = await import("@/features/auctions/decisions");
    const admin = await makeUser("admin");
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 20000_00, buyNowCurrency: "EUR" });
    expect(() =>
      createAuction({
        vehicleId: v, currency: "USD", startingPrice: 10000_00, bidIncrement: 250_00,
        startsAt: Date.now(), endsAt: Date.now() + 3600_000, adminId: admin,
      }),
    ).toThrow(/must match/i);
  });

  it("buyNow refuses a pre-existing currency mismatch (defensive check)", async () => {
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const { buyNow } = await import("@/features/auctions/engine");
    const shopper = await makeUser();
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 20000_00, buyNowCurrency: "EUR" });
    const a = await makeAuction(v, { currency: "USD" }); // legacy/misconfigured row
    expect((await getAuction(a)).currency).toBe("USD");
    expect(() => buyNow({ vehicleId: v, userId: shopper })).toThrow(/currency/i);
    void db; void eq; void schema;
  });
});

describe("buy-now rejection parity between admin entry points", () => {
  it("rejectOrder REOPEN honors the selected new end time", async () => {
    const { buyNow, placeBid } = await import("@/features/auctions/engine");
    const { rejectOrder } = await import("@/features/auctions/decisions");
    const admin = await makeUser("admin");
    const [bidder, shopper] = await Promise.all([makeUser(), makeUser()]);
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 40000_00, buyNowCurrency: "EUR" });
    const a = await makeAuction(v, { status: "LIVE" });
    placeBid({ auctionId: a, userId: bidder, amountMinor: 10000_00, idempotencyKey: "b" });
    const { orderId } = buyNow({ vehicleId: v, userId: shopper });

    const newEnd = Date.now() + 48 * 3600_000;
    rejectOrder(orderId, admin, "fraudulent request", { auctionAction: "REOPEN", newEndsAt: newEnd });
    const auction = await getAuction(a);
    expect(auction.status).toBe("LIVE");
    expect(auction.endsAt).toBe(newEnd);
  });

  it("rejected Buy Now cannot produce a duplicate pending order", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    const { rejectOrder } = await import("@/features/auctions/decisions");
    const admin = await makeUser("admin");
    const shopper = await makeUser();
    const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 40000_00, buyNowCurrency: "EUR" });
    const a = await makeAuction(v, { status: "LIVE" });
    const { orderId } = buyNow({ vehicleId: v, userId: shopper });
    rejectOrder(orderId, admin, "bad", { auctionAction: "UNSOLD" });
    const { db, schema } = await import("@/lib/db");
    const { and, eq } = await import("drizzle-orm");
    const pending = db
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.vehicleId, v), eq(schema.orders.status, "PENDING_APPROVAL")))
      .all();
    expect(pending).toHaveLength(0);
    // a new buy-now attempt works and creates exactly one new order
    const shopper2 = await makeUser();
    buyNow({ vehicleId: v, userId: shopper2 });
    const all = db.select().from(schema.orders).where(eq(schema.orders.vehicleId, v)).all();
    expect(all.filter((o) => o.status === "PENDING_APPROVAL")).toHaveLength(1);
  });
});
