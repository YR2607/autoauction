import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { pendingOrderRows } from "@/features/admin/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { ApprovalActions } from "@/components/admin/approval-actions";
import { OrderActions } from "@/components/admin/order-actions";
import { formatMoney, type Currency } from "@/lib/currency";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Approvals · Admin" };

export default function ApprovalsPage() {
  const auctionResults = db
    .select({ auction: schema.auctions, vehicle: schema.vehicles, order: schema.orders, buyer: schema.users })
    .from(schema.auctions)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.auctions.vehicleId))
    .innerJoin(schema.orders, and(eq(schema.orders.auctionId, schema.auctions.id), eq(schema.orders.status, "PENDING_APPROVAL")))
    .innerJoin(schema.users, eq(schema.users.id, schema.orders.buyerId))
    .where(eq(schema.auctions.status, "AWAITING_ADMIN_APPROVAL"))
    .all();

  const buyNowPending = pendingOrderRows().filter((r) => r.order.type === "BUY_NOW");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Approvals</h1>
      <p className="mt-1 text-sm text-muted">Auction results and purchase requests awaiting review.</p>

      <h2 className="mt-8 font-display text-lg font-bold">Auction results ({auctionResults.length})</h2>
      {auctionResults.length === 0 ? (
        <EmptyState className="mt-4" title="No auction results pending" />
      ) : (
        <div className="mt-4 space-y-4">
          {auctionResults.map((r) => (
            <Card key={r.auction.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-base font-bold">
                    {r.vehicle.make} {r.vehicle.model} {r.vehicle.year}
                    <span className="ml-2 text-xs font-semibold text-muted">Lot {r.vehicle.lotNumber}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Winner: <b className="text-graphite">{r.buyer.email}</b> · Final bid{" "}
                    <b className="text-graphite">{formatMoney(r.order.amount, r.order.currency as Currency)}</b> ·{" "}
                    {r.auction.bidCount} bids · ended {new Date(r.auction.finalizedAt ?? r.auction.endsAt).toLocaleString("en-GB")}
                  </p>
                </div>
                <Badge tone="warning">Awaiting approval</Badge>
              </div>
              <ApprovalActions auctionId={r.auction.id} endsAt={r.auction.endsAt} />
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-10 font-display text-lg font-bold">Buy Now requests ({buyNowPending.length})</h2>
      {buyNowPending.length === 0 ? (
        <EmptyState className="mt-4" title="No purchase requests pending" />
      ) : (
        <div className="mt-4 space-y-4">
          {buyNowPending.map((r) => (
            <Card key={r.order.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-base font-bold">
                    {r.vehicle.make} {r.vehicle.model} {r.vehicle.year}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Buyer: <b className="text-graphite">{r.buyer.email}</b> ·{" "}
                    <b className="text-graphite">{formatMoney(r.order.amount, r.order.currency as Currency)}</b> ·{" "}
                    {new Date(r.order.createdAt).toLocaleString("en-GB")}
                  </p>
                </div>
                <Badge tone="warning">Pending</Badge>
              </div>
              <OrderActions
                orderId={r.order.id}
                endedByBuyNow={
                  r.order.type === "BUY_NOW" &&
                  r.auction?.status === "ENDED" &&
                  r.auction?.closeReason === "buy_now"
                }
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
