import { db, schema } from "@/lib/db";
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";

export function adminDashboard() {
  const count = (q: { get(): { c: number } | undefined }) => q.get()?.c ?? 0;
  const c = (col: unknown) => sql<number>`count(*)`;

  const vehicles = count(db.select({ c: c(schema.vehicles.id) }).from(schema.vehicles));
  const published = count(db.select({ c: c(schema.vehicles.id) }).from(schema.vehicles).where(eq(schema.vehicles.status, "PUBLISHED")));
  const live = count(db.select({ c: c(schema.auctions.id) }).from(schema.auctions).where(eq(schema.auctions.status, "LIVE")));
  const upcoming = count(db.select({ c: c(schema.auctions.id) }).from(schema.auctions).where(eq(schema.auctions.status, "SCHEDULED")));
  const awaiting = count(db.select({ c: c(schema.auctions.id) }).from(schema.auctions).where(eq(schema.auctions.status, "AWAITING_ADMIN_APPROVAL")));
  const users = count(db.select({ c: c(schema.users.id) }).from(schema.users));
  const pendingOrders = count(db.select({ c: c(schema.orders.id) }).from(schema.orders).where(eq(schema.orders.status, "PENDING_APPROVAL")));
  const totalBids = count(db.select({ c: c(schema.bids.id) }).from(schema.bids).where(eq(schema.bids.status, "ACCEPTED")));
  const sold = count(db.select({ c: c(schema.vehicles.id) }).from(schema.vehicles).where(eq(schema.vehicles.status, "SOLD")));

  const liveAuctions = db
    .select({ auction: schema.auctions, vehicle: schema.vehicles })
    .from(schema.auctions)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.auctions.vehicleId))
    .where(eq(schema.auctions.status, "LIVE"))
    .orderBy(schema.auctions.endsAt)
    .all();

  const pendingApprovals = db
    .select({ auction: schema.auctions, vehicle: schema.vehicles, order: schema.orders })
    .from(schema.auctions)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.auctions.vehicleId))
    .innerJoin(schema.orders, and(eq(schema.orders.auctionId, schema.auctions.id), eq(schema.orders.status, "PENDING_APPROVAL")))
    .where(eq(schema.auctions.status, "AWAITING_ADMIN_APPROVAL"))
    .all();

  const recentOrders = db
    .select({ order: schema.orders, vehicle: schema.vehicles, buyer: schema.users })
    .from(schema.orders)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.orders.vehicleId))
    .innerJoin(schema.users, eq(schema.users.id, schema.orders.buyerId))
    .orderBy(desc(schema.orders.createdAt))
    .limit(8)
    .all();

  // bids per day (last 14 days) for the activity chart
  const since = Date.now() - 14 * 86400_000;
  const bidRows = db
    .select({ day: sql<string>`date(${schema.bids.createdAt} / 1000, 'unixepoch')`, c: sql<number>`count(*)` })
    .from(schema.bids)
    .where(and(eq(schema.bids.status, "ACCEPTED"), gte(schema.bids.createdAt, since)))
    .groupBy(sql`date(${schema.bids.createdAt} / 1000, 'unixepoch')`)
    .all();

  return { vehicles, published, live, upcoming, awaiting, users, pendingOrders, totalBids, sold, liveAuctions, pendingApprovals, recentOrders, bidRows };
}

export function pendingOrderRows() {
  return db
    .select({ order: schema.orders, vehicle: schema.vehicles, buyer: schema.users })
    .from(schema.orders)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.orders.vehicleId))
    .innerJoin(schema.users, eq(schema.users.id, schema.orders.buyerId))
    .where(eq(schema.orders.status, "PENDING_APPROVAL"))
    .orderBy(desc(schema.orders.createdAt))
    .all();
}

export function allOrders() {
  return db
    .select({
      order: schema.orders,
      vehicle: schema.vehicles,
      buyer: schema.users,
      auction: schema.auctions,
    })
    .from(schema.orders)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.orders.vehicleId))
    .innerJoin(schema.users, eq(schema.users.id, schema.orders.buyerId))
    .leftJoin(schema.auctions, eq(schema.auctions.id, schema.orders.auctionId))
    .orderBy(desc(schema.orders.createdAt))
    .limit(300)
    .all();
}

export function allBids(limit = 300) {
  return db
    .select({ bid: schema.bids, vehicle: schema.vehicles, user: schema.users, auction: schema.auctions })
    .from(schema.bids)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.bids.vehicleId))
    .innerJoin(schema.users, eq(schema.users.id, schema.bids.userId))
    .innerJoin(schema.auctions, eq(schema.auctions.id, schema.bids.auctionId))
    .orderBy(desc(schema.bids.createdAt))
    .limit(limit)
    .all();
}

export function allUsers() {
  return db
    .select({ user: schema.users, profile: schema.userProfiles, bidCount: sql<number>`(SELECT count(*) FROM bids b WHERE b.user_id = ${schema.users.id} AND b.status = 'ACCEPTED')` })
    .from(schema.users)
    .leftJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.users.id))
    .orderBy(desc(schema.users.createdAt))
    .all();
}
