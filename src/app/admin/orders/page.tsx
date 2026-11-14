import { allOrders } from "@/features/admin/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderActions } from "@/components/admin/order-actions";
import { formatMoney, type Currency } from "@/lib/currency";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Orders · Admin" };

const tone: Record<string, "warning" | "success" | "live" | "neutral"> = {
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  COMPLETED: "success",
  REJECTED: "live",
  CANCELLED: "neutral",
};

export default function OrdersPage() {
  const rows = allOrders();
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Orders</h1>
      <p className="mt-1 text-sm text-muted">All purchase requests — auction wins and Buy Now.</p>
      <div className="mt-6 space-y-4">
        {rows.map((r) => (
          <Card key={r.order.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-base font-bold">
                  {r.vehicle.make} {r.vehicle.model} {r.vehicle.year}
                  <span className="ml-2 text-xs font-semibold text-muted">Lot {r.vehicle.lotNumber}</span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  {r.order.type === "BUY_NOW" ? "Buy Now" : "Auction win"} ·{" "}
                  <b className="text-graphite">{r.buyer.email}</b> ·{" "}
                  {new Date(r.order.createdAt).toLocaleString("en-GB")} · payment: {r.order.paymentStatus}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-lg font-extrabold">
                  {formatMoney(r.order.amount, r.order.currency as Currency)}
                </span>
                <Badge tone={tone[r.order.status]}>{r.order.status.replace(/_/g, " ")}</Badge>
              </div>
            </div>
            {(r.order.status === "PENDING_APPROVAL" || r.order.status === "APPROVED") && (
              <OrderActions orderId={r.order.id} approved={r.order.status === "APPROVED"} />
            )}
          </Card>
        ))}
        {rows.length === 0 && (
          <p className="rounded-[14px] border border-dashed border-line bg-white px-6 py-10 text-center text-sm text-muted">
            No orders yet.
          </p>
        )}
      </div>
    </div>
  );
}
