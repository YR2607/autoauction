// Admin decisions on auction results + auction CRUD transitions.
// Every decision writes admin_audit_logs + auction_events — append-only.
import { randomUUID } from "node:crypto";
import { eq, and, notInArray, inArray, desc, asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Db } from "@/lib/db";
import { bus } from "@/lib/realtime/bus";
import { EngineError, transition, notify, notifyAdmins } from "./engine";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
const uuid = () => randomUUID();
const now = () => Date.now();

function audit(
  tx: Tx,
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
  reason?: string,
) {
  tx.insert(schema.adminAuditLogs)
    .values({
      id: uuid(),
      adminId,
      action,
      entityType,
      entityId,
      beforeJson: JSON.stringify(before ?? null),
      afterJson: JSON.stringify(after ?? null),
      reason,
      createdAt: now(),
    })
    .run();
}

// ---------- create / schedule ----------

export type CreateAuctionInput = {
  vehicleId: string;
  currency: "USD" | "EUR" | "GBP";
  startingPrice: number;
  bidIncrement: number;
  startsAt: number;
  endsAt: number;
  extensionWindowSec?: number | null;
  extensionDurationSec?: number | null;
  adminId: string;
};

export function createAuction(input: CreateAuctionInput): string {
  if (input.endsAt <= input.startsAt)
    throw new EngineError("BAD_TRANSITION", "endsAt must be after startsAt");
  const id = uuid();
  db.transaction((tx) => {
    const vehicle = tx
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, input.vehicleId))
      .get();
    if (!vehicle) throw new EngineError("NOT_FOUND", "Vehicle not found");
    if (vehicle.status !== "PUBLISHED")
      throw new EngineError(
        "BAD_TRANSITION",
        `Vehicle is ${vehicle.status} — only published vehicles can get an auction`,
      );
    const pendingBuyNow = tx
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.vehicleId, vehicle.id),
          eq(schema.orders.type, "BUY_NOW"),
          eq(schema.orders.status, "PENDING_APPROVAL"),
        ),
      )
      .get();
    if (pendingBuyNow)
      throw new EngineError("BAD_TRANSITION", "Vehicle has a pending Buy Now order");
    const existing = tx
      .select({ id: schema.auctions.id })
      .from(schema.auctions)
      .where(eq(schema.auctions.vehicleId, input.vehicleId))
      .get();
    if (existing) throw new EngineError("BAD_TRANSITION", "Vehicle already has an auction");
    // Combined listings: bids and the fixed price must be in one currency,
    // otherwise the "never sell below the current bid" rule is unenforceable.
    if (
      vehicle.saleType === "AUCTION_BUY_NOW" &&
      vehicle.buyNowPrice != null &&
      vehicle.buyNowCurrency != null &&
      vehicle.buyNowCurrency !== input.currency
    )
      throw new EngineError(
        "BAD_TRANSITION",
        `Auction currency (${input.currency}) must match the Buy Now currency (${vehicle.buyNowCurrency})`,
      );

    const t = now();
    tx.insert(schema.auctions)
      .values({
        id,
        vehicleId: input.vehicleId,
        status: "DRAFT",
        currency: input.currency,
        startingPrice: input.startingPrice,
        bidIncrement: input.bidIncrement,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        extensionWindowSec: input.extensionWindowSec ?? null,
        extensionDurationSec: input.extensionDurationSec ?? null,
        createdAt: t,
        updatedAt: t,
      })
      .run();
    recordCreatedEvent(tx, id, input.adminId);
    audit(tx, input.adminId, "auction.create", "auction", id, null, input);
  });
  return id;
}

function recordCreatedEvent(tx: Tx, auctionId: string, actorId: string) {
  tx.insert(schema.auctionEvents)
    .values({ id: uuid(), auctionId, fromStatus: null, toStatus: "DRAFT", actorId, createdAt: now() })
    .run();
}

export function scheduleAuction(auctionId: string, adminId: string) {
  db.transaction((tx) => {
    const a = tx.select().from(schema.auctions).where(eq(schema.auctions.id, auctionId)).get();
    if (!a) throw new EngineError("NOT_FOUND", "Auction not found");
    // A vehicle reserved by a pending Buy Now order must never go on schedule:
    // scheduling would let it become LIVE and accept bids while reserved.
    const vehicle = tx
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, a.vehicleId))
      .get();
    if (!vehicle) throw new EngineError("NOT_FOUND", "Vehicle not found");
    if (vehicle.status !== "PUBLISHED")
      throw new EngineError(
        "BAD_TRANSITION",
        `Vehicle is ${vehicle.status} — cannot schedule its auction`,
      );
    const pendingBuyNow = tx
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.vehicleId, vehicle.id),
          eq(schema.orders.type, "BUY_NOW"),
          eq(schema.orders.status, "PENDING_APPROVAL"),
        ),
      )
      .get();
    if (pendingBuyNow)
      throw new EngineError("BAD_TRANSITION", "Vehicle has a pending Buy Now order — cannot schedule");
    const before = { status: a.status };
    transition(tx, a, "SCHEDULED", adminId);
    audit(tx, adminId, "auction.schedule", "auction", auctionId, before, { status: "SCHEDULED" });
  });
  bus().publish(auctionId, "status", { status: "SCHEDULED" });
}

export function cancelAuction(auctionId: string, adminId: string, reason: string) {
  if (!reason?.trim()) throw new EngineError("BAD_TRANSITION", "Cancel reason required");
  db.transaction((tx) => {
    const a = tx.select().from(schema.auctions).where(eq(schema.auctions.id, auctionId)).get();
    if (!a) throw new EngineError("NOT_FOUND", "Auction not found");
    // Never cancel while a purchase decision is pending — the release below
    // would otherwise make a reserved vehicle publicly available.
    const pendingOrder = tx
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(
        and(eq(schema.orders.vehicleId, a.vehicleId), eq(schema.orders.status, "PENDING_APPROVAL")),
      )
      .get();
    if (pendingOrder)
      throw new EngineError(
        "BAD_TRANSITION",
        "Cannot cancel while a pending order exists — decide the order first",
      );
    const before = { status: a.status };
    transition(tx, a, "CANCELLED", adminId, reason);
    tx.update(schema.auctions)
      .set({ cancelReason: reason, updatedAt: now() })
      .where(eq(schema.auctions.id, auctionId))
      .run();
    // release vehicle if it was reserved only because of this auction flow
    tx.update(schema.vehicles)
      .set({ status: "PUBLISHED", updatedAt: now() })
      .where(and(eq(schema.vehicles.id, a.vehicleId), eq(schema.vehicles.status, "RESERVED")))
      .run();
    audit(tx, adminId, "auction.cancel", "auction", auctionId, before, { status: "CANCELLED" }, reason);
  });
  bus().publish(auctionId, "status", { status: "CANCELLED" });
}

// ---------- result approval ----------

export function approveResult(auctionId: string, adminId: string, expectedOrderId?: string) {
  const orderId = db.transaction((tx) => {
    const a = tx.select().from(schema.auctions).where(eq(schema.auctions.id, auctionId)).get();
    if (!a) throw new EngineError("NOT_FOUND", "Auction not found");
    if (a.status !== "AWAITING_ADMIN_APPROVAL")
      throw new EngineError("BAD_TRANSITION", "Nothing to approve");

    const order = tx
      .select()
      .from(schema.orders)
      .where(
        and(eq(schema.orders.auctionId, a.id), eq(schema.orders.status, "PENDING_APPROVAL")),
      )
      .get();
    if (!order) throw new EngineError("NO_ACTIVE_ORDER", "Pending order not found");
    // Stale-request guard: the caller addressed a specific order; refuse to
    // decide a different one that appeared since (e.g. a NEXT_BIDDER order).
    if (expectedOrderId && order.id !== expectedOrderId)
      throw new EngineError("BAD_TRANSITION", "Pending order changed — refresh and retry");

    const t = now();
    transition(tx, a, "APPROVED", adminId);
    transition(tx, a, "SOLD", adminId, "result approved");
    tx.update(schema.orders)
      .set({ status: "APPROVED", decidedById: adminId, decidedAt: t, updatedAt: t })
      .where(eq(schema.orders.id, order.id))
      .run();
    tx.update(schema.vehicles)
      .set({ status: "SOLD", updatedAt: t })
      .where(eq(schema.vehicles.id, a.vehicleId))
      .run();
    notify(tx, order.buyerId, "auction_won", "You won the auction",
      "Your winning bid was approved. The vehicle is yours — our team will contact you.",
      { auctionId: a.id, orderId: order.id });
    audit(tx, adminId, "auction.approve", "auction", auctionId,
      { status: "AWAITING_ADMIN_APPROVAL" }, { status: "SOLD" });
    return order.id;
  });
  bus().publish(auctionId, "status", { status: "SOLD" });
  return orderId;
}

export type RejectAction = "REOPEN" | "NEXT_BIDDER" | "UNSOLD";

export function rejectResult(
  auctionId: string,
  adminId: string,
  reason: string,
  action: RejectAction,
  newEndsAt?: number,
  expectedOrderId?: string,
) {
  if (!reason?.trim()) throw new EngineError("BAD_TRANSITION", "Reject reason required");
  db.transaction((tx) => {
    const a = tx.select().from(schema.auctions).where(eq(schema.auctions.id, auctionId)).get();
    if (!a) throw new EngineError("NOT_FOUND", "Auction not found");
    if (a.status !== "AWAITING_ADMIN_APPROVAL")
      throw new EngineError("BAD_TRANSITION", "Nothing to reject");

    const order = tx
      .select()
      .from(schema.orders)
      .where(
        and(eq(schema.orders.auctionId, a.id), eq(schema.orders.status, "PENDING_APPROVAL")),
      )
      .get();
    if (!order) throw new EngineError("NO_ACTIVE_ORDER", "Pending order not found");
    // Stale-request guard — see approveResult.
    if (expectedOrderId && order.id !== expectedOrderId)
      throw new EngineError("BAD_TRANSITION", "Pending order changed — refresh and retry");

    const t = now();
    transition(tx, a, "REJECTED", adminId, reason);
    tx.update(schema.orders)
      .set({ status: "REJECTED", adminNote: reason, decidedById: adminId, decidedAt: t, updatedAt: t })
      .where(eq(schema.orders.id, order.id))
      .run();
    notify(tx, order.buyerId, "result_rejected", "Auction result rejected",
      reason, { auctionId: a.id });

    if (action === "REOPEN") {
      const ends = newEndsAt ?? t + 24 * 3600 * 1000;
      if (ends <= t) throw new EngineError("BAD_TRANSITION", "newEndsAt must be in the future");
      transition(tx, a, "LIVE", adminId, `reopened after rejection`);
      tx.update(schema.auctions)
        .set({ endsAt: ends, winnerUserId: null, winningBidId: null, updatedAt: t })
        .where(eq(schema.auctions.id, a.id))
        .run();
      tx.update(schema.vehicles)
        .set({ status: "PUBLISHED", updatedAt: t })
        .where(eq(schema.vehicles.id, a.vehicleId))
        .run();
    } else if (action === "NEXT_BIDDER") {
      // Exclude EVERY buyer whose order on this auction was already rejected —
      // not just the one being rejected now — so a rejected winner is never
      // offered the lot again.
      const excluded = tx
        .select({ buyerId: schema.orders.buyerId })
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.auctionId, a.id),
            eq(schema.orders.status, "REJECTED"),
          ),
        )
        .all()
        .map((r) => r.buyerId);
      excluded.push(order.buyerId);
      const next = tx
        .select()
        .from(schema.bids)
        .where(
          and(
            eq(schema.bids.auctionId, a.id),
            eq(schema.bids.status, "ACCEPTED"),
            notInArray(schema.bids.userId, excluded),
          ),
        )
        .orderBy(desc(schema.bids.amount), asc(schema.bids.createdAt))
        .limit(1)
        .get();
      if (!next) {
        transition(tx, a, "UNSOLD", adminId, "no next eligible bidder");
        tx.update(schema.vehicles)
          .set({ status: "PUBLISHED", updatedAt: t })
          .where(eq(schema.vehicles.id, a.vehicleId))
          .run();
      } else {
        // back to awaiting approval with the new winner
        tx.update(schema.auctions)
          .set({ winnerUserId: next.userId, winningBidId: next.id, updatedAt: t })
          .where(eq(schema.auctions.id, a.id))
          .run();
        // REJECTED → ENDED not allowed; record via event + set directly to AWAITING
        tx.insert(schema.auctionEvents)
          .values({ id: uuid(), auctionId: a.id, fromStatus: "REJECTED", toStatus: "AWAITING_ADMIN_APPROVAL", actorId: adminId, reason: "awarded to next eligible bidder", createdAt: t })
          .run();
        tx.update(schema.auctions)
          .set({ status: "AWAITING_ADMIN_APPROVAL", updatedAt: t })
          .where(eq(schema.auctions.id, a.id))
          .run();
        const newOrderId = uuid();
        tx.insert(schema.orders)
          .values({
            id: newOrderId,
            vehicleId: a.vehicleId,
            auctionId: a.id,
            buyerId: next.userId,
            type: "AUCTION_WIN",
            amount: next.amount,
            currency: a.currency,
            status: "PENDING_APPROVAL",
            createdAt: t,
            updatedAt: t,
          })
          .run();
        notify(tx, next.userId, "result_pending", "Auction result pending approval",
          "You are now the leading bidder — result awaiting administrator approval.",
          { auctionId: a.id, orderId: newOrderId });
      }
    } else {
      transition(tx, a, "UNSOLD", adminId, reason);
      tx.update(schema.vehicles)
        .set({ status: "PUBLISHED", updatedAt: t })
        .where(eq(schema.vehicles.id, a.vehicleId))
        .run();
    }

    audit(tx, adminId, "auction.reject", "auction", auctionId,
      { status: "AWAITING_ADMIN_APPROVAL" }, { action }, reason);
  });
  bus().publish(auctionId, "status", { status: "updated" });
}

// ---------- order decisions (Buy Now purchase requests) ----------
// AUCTION_WIN orders are NEVER decided here — they belong to the auction
// result workflow (approveResult / rejectResult) so auction, order and
// vehicle states can never diverge. Generic calls delegate there.

export function approveOrder(orderId: string, adminId: string) {
  const head = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!head) throw new EngineError("NOT_FOUND", "Order not found");
  if (head.status !== "PENDING_APPROVAL")
    throw new EngineError("BAD_TRANSITION", "Order not pending");
  if (head.type === "AUCTION_WIN") {
    if (!head.auctionId) throw new EngineError("BAD_TRANSITION", "Auction order missing auction link");
    return approveResult(head.auctionId, adminId, head.id);
  }
  db.transaction((tx) => {
    const o = tx.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
    if (!o) throw new EngineError("NOT_FOUND", "Order not found");
    if (o.status !== "PENDING_APPROVAL")
      throw new EngineError("BAD_TRANSITION", "Order not pending");
    const t = now();
    tx.update(schema.orders)
      .set({ status: "APPROVED", decidedById: adminId, decidedAt: t, updatedAt: t })
      .where(eq(schema.orders.id, orderId))
      .run();
    tx.update(schema.vehicles)
      .set({ status: "SOLD", updatedAt: t })
      .where(eq(schema.vehicles.id, o.vehicleId))
      .run();
    if (o.auctionId) {
      const a = tx.select().from(schema.auctions).where(eq(schema.auctions.id, o.auctionId)).get();
      if (a && a.status === "ENDED") {
        transition(tx, a, "AWAITING_ADMIN_APPROVAL", adminId);
        transition(tx, a, "SOLD", adminId, "order approved");
      }
    }
    notify(tx, o.buyerId, "purchase_approved", "Purchase approved",
      "Your purchase was approved. Our team will contact you about next steps.",
      { orderId });
    audit(tx, adminId, "order.approve", "order", orderId, { status: "PENDING_APPROVAL" }, { status: "APPROVED" });
  });
}

export type OrderRejectAction = "REOPEN" | "UNSOLD";

/**
 * Reject a pending order. If the order's Buy Now purchase ended an auction
 * (closeReason = "buy_now"), the administrator must pick a recovery action:
 *  - REOPEN: auction goes back to LIVE with a new future endsAt (bid history
 *    fully preserved; default +24h when newEndsAt is omitted)
 *  - UNSOLD: auction marked UNSOLD (default)
 * Reopening is refused if the vehicle is already sold via another order.
 */
export function rejectOrder(
  orderId: string,
  adminId: string,
  reason: string,
  opts: { auctionAction?: OrderRejectAction; newEndsAt?: number; next?: RejectAction } = {},
) {
  if (!reason?.trim()) throw new EngineError("BAD_TRANSITION", "Reason required");
  const head = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!head) throw new EngineError("NOT_FOUND", "Order not found");
  if (head.status !== "PENDING_APPROVAL")
    throw new EngineError("BAD_TRANSITION", "Order not pending");
  if (head.type === "AUCTION_WIN") {
    // Delegate to the authoritative result workflow; requires the same
    // explicit next-step choice as /admin/approvals.
    if (!head.auctionId) throw new EngineError("BAD_TRANSITION", "Auction order missing auction link");
    const next = opts.next;
    if (!next) throw new EngineError("BAD_TRANSITION", "Auction result rejection requires next action");
    return rejectResult(head.auctionId, adminId, reason, next, opts.newEndsAt, head.id);
  }
  db.transaction((tx) => {
    const o = tx.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
    if (!o) throw new EngineError("NOT_FOUND", "Order not found");
    if (o.status !== "PENDING_APPROVAL")
      throw new EngineError("BAD_TRANSITION", "Order not pending");
    const t = now();
    tx.update(schema.orders)
      .set({ status: "REJECTED", adminNote: reason, decidedById: adminId, decidedAt: t, updatedAt: t })
      .where(eq(schema.orders.id, orderId))
      .run();
    tx.update(schema.vehicles)
      .set({ status: "PUBLISHED", updatedAt: t })
      .where(eq(schema.vehicles.id, o.vehicleId))
      .run();
    notify(tx, o.buyerId, "purchase_rejected", "Purchase request rejected",
      reason, { orderId });

    // Auction recovery when a rejected Buy Now had ended it.
    const a = o.auctionId
      ? tx.select().from(schema.auctions).where(eq(schema.auctions.id, o.auctionId)).get()
      : null;
    let auctionAction: OrderRejectAction | null = null;
    if (a && a.status === "ENDED" && a.closeReason === "buy_now") {
      // The admin must explicitly decide the auction's fate — no silent
      // default. The frontend always sends one; a raw API call without it
      // is a validation error.
      if (!opts.auctionAction)
        throw new EngineError(
          "BAD_TRANSITION",
          "Rejecting this Buy Now request requires auctionAction: REOPEN or UNSOLD",
        );
      auctionAction = opts.auctionAction;
      if (auctionAction === "REOPEN") {
        // Never reopen a vehicle that is already sold through another order.
        const soldOrder = tx
          .select({ id: schema.orders.id })
          .from(schema.orders)
          .where(
            and(
              eq(schema.orders.vehicleId, o.vehicleId),
              notInArray(schema.orders.id, [o.id]),
              inArray(schema.orders.status, ["APPROVED", "COMPLETED"]),
            ),
          )
          .get();
        if (soldOrder)
          throw new EngineError("BAD_TRANSITION", "Vehicle already sold — cannot reopen auction");
        const ends = opts.newEndsAt ?? t + 24 * 3600 * 1000;
        if (ends <= t)
          throw new EngineError("BAD_TRANSITION", "newEndsAt must be in the future");
        transition(tx, a, "LIVE", adminId, "reopened after buy-now rejection");
        tx.update(schema.auctions)
          .set({ endsAt: ends, finalizedAt: null, closeReason: null, updatedAt: t })
          .where(eq(schema.auctions.id, a.id))
          .run();
      } else {
        transition(tx, a, "UNSOLD", adminId, "buy-now order rejected");
      }
    }

    audit(tx, adminId, "order.reject", "order", orderId,
      { status: "PENDING_APPROVAL" },
      { status: "REJECTED", auctionAction },
      reason);
  });
}

export function completeOrder(orderId: string, adminId: string, paymentStatus?: "unpaid" | "paid" | "refunded") {
  db.transaction((tx) => {
    const o = tx.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
    if (!o) throw new EngineError("NOT_FOUND", "Order not found");
    if (o.status !== "APPROVED") throw new EngineError("BAD_TRANSITION", "Order not approved");
    const t = now();
    tx.update(schema.orders)
      .set({ status: "COMPLETED", paymentStatus: paymentStatus ?? o.paymentStatus, updatedAt: t })
      .where(eq(schema.orders.id, orderId))
      .run();
    notify(tx, o.buyerId, "purchase_completed", "Purchase completed",
      "Your purchase is complete. Thank you!", { orderId });
    audit(tx, adminId, "order.complete", "order", orderId, { status: "APPROVED" }, { status: "COMPLETED" });
  });
}

// re-export for convenience of API handlers
export { notifyAdmins };
