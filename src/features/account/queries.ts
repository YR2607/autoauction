import { db, schema } from "@/lib/db";
import { and, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";

/** Dashboard aggregates for one buyer. */
export function accountDashboard(userId: string) {
  const myBids = db
    .select({
      bid: schema.bids,
      auction: schema.auctions,
      vehicle: schema.vehicles,
      coverUrl: sql<string>`(SELECT url FROM vehicle_images vi WHERE vi.vehicle_id = ${schema.vehicles.id} ORDER BY vi.is_cover DESC, vi.sort_order ASC LIMIT 1)`,
    })
    .from(schema.bids)
    .innerJoin(schema.auctions, eq(schema.auctions.id, schema.bids.auctionId))
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.bids.vehicleId))
    .where(and(eq(schema.bids.userId, userId), eq(schema.bids.status, "ACCEPTED")))
    .orderBy(desc(schema.bids.createdAt))
    .all();

  // latest per auction
  const latestByAuction = new Map<string, (typeof myBids)[0]>();
  for (const row of myBids) {
    const cur = latestByAuction.get(row.auction.id);
    if (!cur || row.bid.amount > cur.bid.amount) latestByAuction.set(row.auction.id, row);
  }
  const entries = [...latestByAuction.values()];
  const active = entries.filter((e) => e.auction.status === "LIVE");
  const leading = active.filter((e) => e.auction.highestBidderId === userId);
  const outbid = active.filter((e) => e.auction.highestBidderId !== userId);

  const orders = db
    .select({ order: schema.orders, vehicle: schema.vehicles })
    .from(schema.orders)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.orders.vehicleId))
    .where(eq(schema.orders.buyerId, userId))
    .orderBy(desc(schema.orders.createdAt))
    .all();

  const unread = db
    .select({ c: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, userId), isNull(schema.notifications.readAt)))
    .get()?.c ?? 0;

  const favorites = db
    .select({ c: sql<number>`count(*)` })
    .from(schema.favorites)
    .where(eq(schema.favorites.userId, userId))
    .get()?.c ?? 0;

  const recentNotifications = db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, userId))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(8)
    .all();

  return {
    activeBids: active.length,
    leadingCount: leading.length,
    outbidCount: outbid.length,
    wonCount: orders.filter((o) => o.order.status !== "CANCELLED" && o.order.status !== "REJECTED").length,
    pendingOrders: orders.filter((o) => o.order.status === "PENDING_APPROVAL").length,
    favorites,
    unread,
    bidEntries: entries,
    orders,
    recentNotifications,
  };
}

export function myBids(userId: string) {
  return db
    .select({
      bid: schema.bids,
      auction: schema.auctions,
      vehicle: schema.vehicles,
      coverUrl: sql<string>`(SELECT url FROM vehicle_images vi WHERE vi.vehicle_id = ${schema.vehicles.id} ORDER BY vi.is_cover DESC, vi.sort_order ASC LIMIT 1)`,
    })
    .from(schema.bids)
    .innerJoin(schema.auctions, eq(schema.auctions.id, schema.bids.auctionId))
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.bids.vehicleId))
    .where(and(eq(schema.bids.userId, userId), eq(schema.bids.status, "ACCEPTED")))
    .orderBy(desc(schema.bids.createdAt))
    .all();
}

export function myOrders(userId: string) {
  return db
    .select({ order: schema.orders, vehicle: schema.vehicles, coverUrl: sql<string>`(SELECT url FROM vehicle_images vi WHERE vi.vehicle_id = ${schema.vehicles.id} ORDER BY vi.is_cover DESC, vi.sort_order ASC LIMIT 1)` })
    .from(schema.orders)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.orders.vehicleId))
    .where(eq(schema.orders.buyerId, userId))
    .orderBy(desc(schema.orders.createdAt))
    .all();
}

export function myFavorites(userId: string) {
  return db
    .select({ vehicle: schema.vehicles, coverUrl: sql<string>`(SELECT url FROM vehicle_images vi WHERE vi.vehicle_id = ${schema.vehicles.id} ORDER BY vi.is_cover DESC, vi.sort_order ASC LIMIT 1)` })
    .from(schema.favorites)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.favorites.vehicleId))
    .where(eq(schema.favorites.userId, userId))
    .orderBy(desc(schema.favorites.createdAt))
    .all();
}

export function myNotifications(userId: string) {
  return db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, userId))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(100)
    .all();
}
