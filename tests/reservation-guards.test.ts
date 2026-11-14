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

async function setupDraftPlusBuyNow() {
  const { buyNow } = await import("@/features/auctions/engine");
  const admin = await makeUser("admin");
  const buyer = await makeUser();
  const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 30000_00, buyNowCurrency: "EUR" });
  const a = await makeAuction(v, { status: "DRAFT" });
  const { orderId } = buyNow({ vehicleId: v, userId: buyer }); // DRAFT is purchasable
  return { admin, buyer, v, a, orderId };
}

describe("auction guards vs pending Buy Now reservation", () => {
  it("Buy Now on a vehicle with a DRAFT auction reserves it and leaves the draft intact", async () => {
    const { admin: _a, v, a, orderId } = await setupDraftPlusBuyNow();
    expect((await getOrder(orderId)).status).toBe("PENDING_APPROVAL");
    expect((await getVehicle(v)).status).toBe("RESERVED");
    expect((await getAuction(a)).status).toBe("DRAFT");
  });

  it("scheduling the DRAFT afterwards is rejected — nothing mutates", async () => {
    const { scheduleAuction } = await import("@/features/auctions/decisions");
    const { admin, v, a, orderId } = await setupDraftPlusBuyNow();
    expect(() => scheduleAuction(a, admin)).toThrow(/RESERVED|pending Buy Now/i);
    expect((await getAuction(a)).status).toBe("DRAFT");
    expect((await getVehicle(v)).status).toBe("RESERVED");
    expect((await getOrder(orderId)).status).toBe("PENDING_APPROVAL");
  });

  it("createAuction refuses a RESERVED vehicle", async () => {
    const { createAuction } = await import("@/features/auctions/decisions");
    const admin = await makeUser("admin");
    const v = await makeVehicle({ status: "RESERVED" });
    expect(() =>
      createAuction({
        vehicleId: v, currency: "EUR", startingPrice: 10000_00, bidIncrement: 250_00,
        startsAt: Date.now(), endsAt: Date.now() + 3600_000, adminId: admin,
      }),
    ).toThrow(/published/i);
  });

  it("cancelling while a Buy Now order is pending is refused — reservation kept", async () => {
    const { cancelAuction } = await import("@/features/auctions/decisions");
    const { admin, v, a } = await setupDraftPlusBuyNow();
    expect(() => cancelAuction(a, admin, "cleanup")).toThrow(/pending order/i);
    expect((await getAuction(a)).status).toBe("DRAFT");
    expect((await getVehicle(v)).status).toBe("RESERVED");
  });

  it("normal cancel without pending orders still works", async () => {
    const { cancelAuction } = await import("@/features/auctions/decisions");
    const admin = await makeUser("admin");
    const v = await makeVehicle();
    const a = await makeAuction(v, { status: "DRAFT" });
    cancelAuction(a, admin, "not needed");
    expect((await getAuction(a)).status).toBe("CANCELLED");
  });

  it("a new bid is rejected when the vehicle is RESERVED", async () => {
    const { placeBid } = await import("@/features/auctions/engine");
    const bidder = await makeUser();
    const v = await makeVehicle({ status: "RESERVED" });
    const a = await makeAuction(v); // LIVE auction on reserved vehicle (bad-state)
    const r = placeBid({ auctionId: a, userId: bidder, amountMinor: 10000_00, idempotencyKey: "k" });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("vehicle_unavailable");
    // idempotent replay returns the same recorded outcome
    const r2 = placeBid({ auctionId: a, userId: bidder, amountMinor: 10000_00, idempotencyKey: "k" });
    expect(r2.ok).toBe(false);
    expect(r2.bidId).toBe(r.bidId);
  });

  it("a scheduled auction auto-cancels instead of going LIVE on a reserved vehicle", async () => {
    const { activateDueAuctions } = await import("@/features/auctions/engine");
    const v = await makeVehicle({ status: "RESERVED" });
    const a = await makeAuction(v, { status: "SCHEDULED", startsAt: Date.now() - 1000 });
    const n = activateDueAuctions();
    expect(n).toBe(0);
    const auction = await getAuction(a);
    expect(auction.status).toBe("CANCELLED");
    expect(auction.cancelReason).toMatch(/auto-cancelled/i);
    expect((await getVehicle(v)).status).toBe("RESERVED");
  });

  it("normal DRAFT → SCHEDULED → LIVE flow is unaffected", async () => {
    const { scheduleAuction } = await import("@/features/auctions/decisions");
    const { activateDueAuctions, placeBid } = await import("@/features/auctions/engine");
    const admin = await makeUser("admin");
    const bidder = await makeUser();
    const v = await makeVehicle();
    const a = await makeAuction(v, { status: "DRAFT" });
    scheduleAuction(a, admin);
    expect((await getAuction(a)).status).toBe("SCHEDULED");
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    db.update(schema.auctions).set({ startsAt: Date.now() - 1000 }).where(eq(schema.auctions.id, a)).run();
    expect(activateDueAuctions()).toBe(1);
    expect((await getAuction(a)).status).toBe("LIVE");
    expect(placeBid({ auctionId: a, userId: bidder, amountMinor: 10000_00, idempotencyKey: "x" }).ok).toBe(true);
  });

  it("normal Buy Now on SCHEDULED and LIVE auctions still works", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    for (const status of ["SCHEDULED", "LIVE"] as const) {
      const buyer = await makeUser();
      const v = await makeVehicle({ saleType: "AUCTION_BUY_NOW", buyNowPrice: 30000_00, buyNowCurrency: "EUR" });
      const a = await makeAuction(v, { status });
      buyNow({ vehicleId: v, userId: buyer });
      expect((await getAuction(a)).status).toBe("ENDED");
      expect((await getVehicle(v)).status).toBe("RESERVED");
    }
  });

  it("sequential: reject buy-now UNSOLD → schedule still refused by auction state, cancel allowed", async () => {
    const { rejectOrder, cancelAuction, scheduleAuction } = await import("@/features/auctions/decisions");
    const { admin, v, a, orderId } = await setupDraftPlusBuyNow();
    // Order rejected (no buy-now-ended auction here — draft untouched) → vehicle PUBLISHED
    rejectOrder(orderId, admin, "bad buyer");
    expect((await getVehicle(v)).status).toBe("PUBLISHED");
    // Draft can now be scheduled normally again
    scheduleAuction(a, admin);
    expect((await getAuction(a)).status).toBe("SCHEDULED");
    // and cancelled without pending orders
    cancelAuction(a, admin, "changed mind");
    expect((await getAuction(a)).status).toBe("CANCELLED");
  });
});
