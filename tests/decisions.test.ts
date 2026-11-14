import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { resetDb, makeUser, makeVehicle, makeAuction } from "./helpers";

const engine = () => import("@/features/auctions/engine");
const decisions = () => import("@/features/auctions/decisions");
const dbmod = () => import("@/lib/db");

beforeEach(resetDb);

async function endedAuctionWithBids() {
  const { placeBid, finalizeDueAuctions } = await engine();
  const winner = await makeUser();
  const other = await makeUser();
  const vid = await makeVehicle();
  const aid = await makeAuction(vid);
  placeBid({ auctionId: aid, userId: other, amountMinor: 10000_00, idempotencyKey: randomUUID() });
  placeBid({ auctionId: aid, userId: winner, amountMinor: 10250_00, idempotencyKey: randomUUID() });
  const { db, schema } = await dbmod();
  const { eq } = await import("drizzle-orm");
  db.update(schema.auctions).set({ endsAt: Date.now() - 1 }).where(eq(schema.auctions.id, aid)).run();
  finalizeDueAuctions();
  return { aid, vid, winner, other };
}

describe("admin approval flow", () => {
  it("approve → SOLD + order approved + vehicle SOLD", async () => {
    const admin = await makeUser("admin");
    const { aid, vid } = await endedAuctionWithBids();
    const { approveResult } = await decisions();
    approveResult(aid, admin);

    const { db, schema } = await dbmod();
    const { eq } = await import("drizzle-orm");
    expect(db.select().from(schema.auctions).where(eq(schema.auctions.id, aid)).get()!.status).toBe("SOLD");
    expect(db.select().from(schema.vehicles).where(eq(schema.vehicles.id, vid)).get()!.status).toBe("SOLD");
    const order = db.select().from(schema.orders).where(eq(schema.orders.auctionId, aid)).get()!;
    expect(order.status).toBe("APPROVED");
  });

  it("reject + UNSOLD frees the vehicle", async () => {
    const admin = await makeUser("admin");
    const { aid, vid } = await endedAuctionWithBids();
    const { rejectResult } = await decisions();
    rejectResult(aid, admin, "suspicious activity", "UNSOLD");

    const { db, schema } = await dbmod();
    const { eq } = await import("drizzle-orm");
    expect(db.select().from(schema.auctions).where(eq(schema.auctions.id, aid)).get()!.status).toBe("UNSOLD");
    expect(db.select().from(schema.vehicles).where(eq(schema.vehicles.id, vid)).get()!.status).toBe("PUBLISHED");
  });

  it("reject + NEXT_BIDDER creates a new pending order for runner-up", async () => {
    const admin = await makeUser("admin");
    const { aid, other } = await endedAuctionWithBids();
    const { rejectResult } = await decisions();
    rejectResult(aid, admin, "winner unresponsive", "NEXT_BIDDER");

    const { db, schema } = await dbmod();
    const { eq, and } = await import("drizzle-orm");
    const a = db.select().from(schema.auctions).where(eq(schema.auctions.id, aid)).get()!;
    expect(a.status).toBe("AWAITING_ADMIN_APPROVAL");
    expect(a.winnerUserId).toBe(other);
    const pending = db.select().from(schema.orders).where(and(eq(schema.orders.auctionId, aid), eq(schema.orders.status, "PENDING_APPROVAL"))).all();
    expect(pending).toHaveLength(1);
    expect(pending[0].buyerId).toBe(other);
    expect(pending[0].amount).toBe(10000_00);
  });

  it("reject requires a reason", async () => {
    const admin = await makeUser("admin");
    const { aid } = await endedAuctionWithBids();
    const { rejectResult } = await decisions();
    expect(() => rejectResult(aid, admin, "", "UNSOLD")).toThrow();
  });

  it("writes audit log entries for decisions", async () => {
    const admin = await makeUser("admin");
    const { aid } = await endedAuctionWithBids();
    const { approveResult } = await decisions();
    approveResult(aid, admin);
    const { db, schema } = await dbmod();
    const { eq } = await import("drizzle-orm");
    const logs = db.select().from(schema.adminAuditLogs).where(eq(schema.adminAuditLogs.entityId, aid)).all();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe("auction.approve");
  });
});

describe("order decisions (buy now)", () => {
  it("approveOrder marks vehicle SOLD", async () => {
    const { buyNow } = await engine();
    const { approveOrder } = await decisions();
    const admin = await makeUser("admin");
    const buyer = await makeUser();
    const vid = await makeVehicle({ saleType: "BUY_NOW", buyNowPrice: 10000_00, buyNowCurrency: "EUR" });
    const { orderId } = buyNow({ vehicleId: vid, userId: buyer });
    approveOrder(orderId, admin);
    const { db, schema } = await dbmod();
    const { eq } = await import("drizzle-orm");
    expect(db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get()!.status).toBe("APPROVED");
    expect(db.select().from(schema.vehicles).where(eq(schema.vehicles.id, vid)).get()!.status).toBe("SOLD");
  });

  it("rejectOrder releases the vehicle back to PUBLISHED", async () => {
    const { buyNow } = await engine();
    const { rejectOrder } = await decisions();
    const admin = await makeUser("admin");
    const buyer = await makeUser();
    const vid = await makeVehicle({ saleType: "BUY_NOW", buyNowPrice: 10000_00, buyNowCurrency: "EUR" });
    const { orderId } = buyNow({ vehicleId: vid, userId: buyer });
    rejectOrder(orderId, admin, "duplicate listing");
    const { db, schema } = await dbmod();
    const { eq } = await import("drizzle-orm");
    expect(db.select().from(schema.vehicles).where(eq(schema.vehicles.id, vid)).get()!.status).toBe("PUBLISHED");
  });
});
