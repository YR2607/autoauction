// Auction engine — all state transitions and bid acceptance live here.
// Executed inside better-sqlite3 serialized transactions: writers queue on the
// SQLite writer lock, so concurrent bids can never interleave.
import { randomUUID } from "node:crypto";
import { eq, desc, and, inArray, lte, asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { bus } from "@/lib/realtime/bus";
import type { AuctionStatus } from "@/lib/db/schema";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export class EngineError extends Error {
  constructor(
    public code:
      | "NOT_FOUND"
      | "NOT_LIVE"
      | "ENDED"
      | "LOW_AMOUNT"
      | "FORBIDDEN_ROLE"
      | "VEHICLE_NOT_AVAILABLE"
      | "BUY_NOW_UNAVAILABLE"
      | "BAD_TRANSITION"
      | "NO_ACTIVE_ORDER",
    message: string,
  ) {
    super(message);
  }
}

// ---------- helpers ----------

const uuid = () => randomUUID();
const now = () => Date.now();

function loadAuction(tx: Tx, auctionId: string) {
  return tx
    .select()
    .from(schema.auctions)
    .where(eq(schema.auctions.id, auctionId))
    .get();
}

function recordEvent(
  tx: Tx,
  auctionId: string,
  from: string | null,
  to: string,
  actorId: string | null,
  reason?: string,
) {
  tx.insert(schema.auctionEvents)
    .values({ id: uuid(), auctionId, fromStatus: from, toStatus: to, actorId, reason, createdAt: now() })
    .run();
}

const ALLOWED: Record<AuctionStatus, AuctionStatus[]> = {
  DRAFT: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["LIVE", "CANCELLED"],
  LIVE: ["ENDED", "CANCELLED"],
  ENDED: ["AWAITING_ADMIN_APPROVAL", "UNSOLD", "LIVE"], // LIVE = admin reopen
  AWAITING_ADMIN_APPROVAL: ["APPROVED", "REJECTED", "SOLD"],
  APPROVED: ["SOLD"],
  REJECTED: ["LIVE", "UNSOLD"], // LIVE = reopen, or next bidder → AWAITING… via reopen path
  SOLD: [],
  UNSOLD: [],
  CANCELLED: [],
};

export function transition(
  tx: Tx,
  auction: typeof schema.auctions.$inferSelect,
  to: AuctionStatus,
  actorId: string | null,
  reason?: string,
) {
  if (!ALLOWED[auction.status].includes(to)) {
    throw new EngineError("BAD_TRANSITION", `${auction.status} → ${to} not allowed`);
  }
  tx.update(schema.auctions)
    .set({ status: to, updatedAt: now() })
    .where(eq(schema.auctions.id, auction.id))
    .run();
  recordEvent(tx, auction.id, auction.status, to, actorId, reason);
  auction.status = to;
}

export function notify(
  tx: Tx,
  userId: string,
  type: string,
  title: string,
  body: string,
  payload?: unknown,
) {
  tx.insert(schema.notifications)
    .values({ id: uuid(), userId, type, title, body, payloadJson: JSON.stringify(payload ?? {}), createdAt: now() })
    .run();
}

export function notifyAdmins(tx: Tx, type: string, title: string, body: string, payload?: unknown) {
  const admins = tx
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.role, "admin"), eq(schema.users.status, "active")))
    .all();
  for (const a of admins) notify(tx, a.id, type, title, body, payload);
}

export function minNextBid(auction: typeof schema.auctions.$inferSelect): number {
  return auction.currentBid == null
    ? auction.startingPrice
    : auction.currentBid + auction.bidIncrement;
}

export function publicAuctionState(auction: typeof schema.auctions.$inferSelect) {
  return {
    id: auction.id,
    vehicleId: auction.vehicleId,
    status: auction.status,
    currency: auction.currency,
    startingPrice: auction.startingPrice,
    bidIncrement: auction.bidIncrement,
    currentBid: auction.currentBid,
    bidCount: auction.bidCount,
    startsAt: auction.startsAt,
    endsAt: auction.endsAt,
    minNextBid: minNextBid(auction),
    serverTime: now(),
  };
}

// ---------- placeBid ----------

export type PlaceBidInput = {
  auctionId: string;
  userId: string;
  amountMinor: number;
  idempotencyKey: string;
  userRole?: "buyer" | "admin";
};

export type PlaceBidResult = {
  ok: boolean;
  bidId: string;
  reason?: string;
  auction: typeof schema.auctions.$inferSelect;
};

export function placeBid(input: PlaceBidInput): PlaceBidResult {
  const t = now();
  let previousLeader: string | null = null;

  const result = db.transaction((tx) => {
    const auction = loadAuction(tx, input.auctionId);
    if (!auction) throw new EngineError("NOT_FOUND", "Auction not found");

    // Idempotent retry — return the already-recorded outcome.
    const existing = tx
      .select()
      .from(schema.bids)
      .where(
        and(
          eq(schema.bids.auctionId, auction.id),
          eq(schema.bids.idempotencyKey, input.idempotencyKey),
        ),
      )
      .get();
    if (existing) {
      return { ok: existing.status === "ACCEPTED", bidId: existing.id, reason: existing.rejectReason ?? undefined, auction };
    }

    const reject = (reason: string): PlaceBidResult => {
      const bidId = uuid();
      tx.insert(schema.bids)
        .values({
          id: bidId,
          auctionId: auction.id,
          vehicleId: auction.vehicleId,
          userId: input.userId,
          amount: input.amountMinor,
          status: "REJECTED",
          rejectReason: reason,
          idempotencyKey: input.idempotencyKey,
          createdAt: t,
        })
        .run();
      return { ok: false, bidId, reason, auction };
    };

    if (input.userRole === "admin") return reject("forbidden_role");
    if (auction.status !== "LIVE") return reject("auction_not_live");
    if (t >= auction.endsAt) return reject("auction_ended");

    const min = minNextBid(auction);
    if (input.amountMinor < min) return reject(`below_minimum:${min}`);

    // Anti-sniping extension (configurable; window <= 0 disables).
    const winSec =
      auction.extensionWindowSec ?? getSetting<number>("auction.extensionWindowSec") ?? 0;
    const durSec =
      auction.extensionDurationSec ?? getSetting<number>("auction.extensionDurationSec") ?? 0;
    let newEndsAt = auction.endsAt;
    if (winSec > 0 && durSec > 0 && auction.endsAt - t <= winSec * 1000) {
      newEndsAt = auction.endsAt + durSec * 1000;
    }

    previousLeader = auction.highestBidderId;
    const bidId = uuid();
    tx.insert(schema.bids)
      .values({
        id: bidId,
        auctionId: auction.id,
        vehicleId: auction.vehicleId,
        userId: input.userId,
        amount: input.amountMinor,
        status: "ACCEPTED",
        idempotencyKey: input.idempotencyKey,
        createdAt: t,
      })
      .run();
    tx.update(schema.auctions)
      .set({
        currentBid: input.amountMinor,
        highestBidderId: input.userId,
        bidCount: auction.bidCount + 1,
        endsAt: newEndsAt,
        version: auction.version + 1,
        updatedAt: t,
      })
      .where(eq(schema.auctions.id, auction.id))
      .run();

    Object.assign(auction, {
      currentBid: input.amountMinor,
      highestBidderId: input.userId,
      bidCount: auction.bidCount + 1,
      endsAt: newEndsAt,
      version: auction.version + 1,
    });

    if (previousLeader && previousLeader !== input.userId) {
      notify(tx, previousLeader, "outbid", "You have been outbid", `A higher bid was placed.`, {
        auctionId: auction.id,
      });
    }
    return { ok: true, bidId, auction };
  });

  bus().publish(input.auctionId, "bid", {
    auction: publicAuctionState(result.auction),
    extended: result.auction.endsAt,
  });
  return result;
}

// ---------- buyNow ----------

export type BuyNowInput = { vehicleId: string; userId: string; userRole?: "buyer" | "admin" };

export function buyNow(input: BuyNowInput): { orderId: string } {
  const t = now();
  const { orderId, auctionId } = db.transaction((tx) => {
    const vehicle = tx
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, input.vehicleId))
      .get();
    if (!vehicle) throw new EngineError("NOT_FOUND", "Vehicle not found");
    if (input.userRole === "admin") throw new EngineError("FORBIDDEN_ROLE", "Admins cannot purchase");
    if (vehicle.status !== "PUBLISHED")
      throw new EngineError("VEHICLE_NOT_AVAILABLE", "Vehicle is not available");
    if (
      (vehicle.saleType !== "BUY_NOW" && vehicle.saleType !== "AUCTION_BUY_NOW") ||
      vehicle.buyNowPrice == null ||
      vehicle.buyNowCurrency == null
    )
      throw new EngineError("BUY_NOW_UNAVAILABLE", "Buy Now not available");

    // Atomically close a running/scheduled auction on this vehicle.
    const auction = tx
      .select()
      .from(schema.auctions)
      .where(eq(schema.auctions.vehicleId, vehicle.id))
      .get();
    if (auction && (auction.status === "LIVE" || auction.status === "SCHEDULED")) {
      transition(tx, auction, "ENDED", input.userId, "buy-now purchase");
      tx.update(schema.auctions)
        .set({ finalizedAt: t })
        .where(eq(schema.auctions.id, auction.id))
        .run();
    }

    const orderId = uuid();
    tx.insert(schema.orders)
      .values({
        id: orderId,
        vehicleId: vehicle.id,
        auctionId: auction?.id ?? null,
        buyerId: input.userId,
        type: "BUY_NOW",
        amount: vehicle.buyNowPrice,
        currency: vehicle.buyNowCurrency,
        status: "PENDING_APPROVAL",
        createdAt: t,
        updatedAt: t,
      })
      .run();

    tx.update(schema.vehicles)
      .set({ status: "RESERVED", updatedAt: t })
      .where(eq(schema.vehicles.id, vehicle.id))
      .run();

    notify(tx, input.userId, "buy_now_request", "Purchase request received",
      `Your Buy Now request for ${vehicle.make} ${vehicle.model} is pending approval.`,
      { orderId, vehicleId: vehicle.id });
    notifyAdmins(tx, "buy_now_admin", "New Buy Now request",
      `${vehicle.make} ${vehicle.model} ${vehicle.year} — purchase request pending.`,
      { orderId, vehicleId: vehicle.id });

    return { orderId, auctionId: auction?.id ?? null };
  });

  if (auctionId) bus().publish(auctionId, "auction-ended", { reason: "buy-now" });
  bus().publish("*", "vehicle-reserved", { vehicleId: input.vehicleId });
  return { orderId };
}

// ---------- scheduler / lifecycle ----------

/** Promote due SCHEDULED auctions to LIVE. Returns count. */
export function activateDueAuctions(t = now()): number {
  return db.transaction((tx) => {
    const due = tx
      .select()
      .from(schema.auctions)
      .where(and(eq(schema.auctions.status, "SCHEDULED"), lte(schema.auctions.startsAt, t)))
      .all();
    for (const a of due) transition(tx, a, "LIVE", null, "scheduled start");
    return due.length;
  });
}

/**
 * Finalize expired LIVE auctions: pick the highest ACCEPTED bid, then
 * AWAITING_ADMIN_APPROVAL (+ pending order) or UNSOLD.
 */
export function finalizeDueAuctions(t = now()): string[] {
  const finished: { id: string; winner: string | null }[] = db.transaction((tx) => {
    const expired = tx
      .select()
      .from(schema.auctions)
      .where(and(eq(schema.auctions.status, "LIVE"), lte(schema.auctions.endsAt, t)))
      .all();
    const out: { id: string; winner: string | null }[] = [];

    for (const a of expired) {
      transition(tx, a, "ENDED", null, "auction expired");
      const top = tx
        .select()
        .from(schema.bids)
        .where(and(eq(schema.bids.auctionId, a.id), eq(schema.bids.status, "ACCEPTED")))
        .orderBy(desc(schema.bids.amount), asc(schema.bids.createdAt))
        .limit(1)
        .get();

      if (!top) {
        transition(tx, a, "UNSOLD", null, "no valid bids");
        tx.update(schema.vehicles)
          .set({ status: "PUBLISHED", updatedAt: t })
          .where(eq(schema.vehicles.id, a.vehicleId))
          .run();
        out.push({ id: a.id, winner: null });
        continue;
      }

      tx.update(schema.auctions)
        .set({ winnerUserId: top.userId, winningBidId: top.id, finalizedAt: t, updatedAt: t })
        .where(eq(schema.auctions.id, a.id))
        .run();
      transition(tx, a, "AWAITING_ADMIN_APPROVAL", null, "winner selected");

      const orderId = uuid();
      tx.insert(schema.orders)
        .values({
          id: orderId,
          vehicleId: a.vehicleId,
          auctionId: a.id,
          buyerId: top.userId,
          type: "AUCTION_WIN",
          amount: top.amount,
          currency: a.currency,
          status: "PENDING_APPROVAL",
          createdAt: t,
          updatedAt: t,
        })
        .run();
      tx.update(schema.vehicles)
        .set({ status: "RESERVED", updatedAt: t })
        .where(eq(schema.vehicles.id, a.vehicleId))
        .run();

      notify(tx, top.userId, "result_pending", "Auction result pending approval",
        `Your winning bid is awaiting administrator approval.`,
        { auctionId: a.id, orderId });
      notifyAdmins(tx, "approval_needed", "Auction result awaiting approval",
        `Auction ${a.id} ended — result needs review.`,
        { auctionId: a.id, orderId });
      out.push({ id: a.id, winner: top.userId });
    }
    return out;
  });

  for (const f of finished) bus().publish(f.id, "auction-finalized", { winner: f.winner != null });
  return finished.map((f) => f.id);
}

/** Periodic tick — call from instrumentation or a job runner. */
export function schedulerTick() {
  activateDueAuctions();
  finalizeDueAuctions();
}
