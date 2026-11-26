import { allOrders } from "@/features/admin/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderActions } from "@/components/admin/order-actions";
import { formatMoney, type Currency } from "@/lib/currency";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Orders | Admin" };

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
      <h1 className="text-xl font-bold uppercase tracking-wider text-[#0b3b60]">Orders</h1>
      <p className="mt-1 text-xs text-[#64748b]">All purchase requests (auction wins and Buy Now).</p>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <Card key={r.order.id} className="p-4 rounded-none">
            <div className="flex flex-wrap items-start justify-between gap-4 text-xs">
              <div>
                <p className="text-sm font-bold text-[#0b3b60]">
                  {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                  <span className="ml-2 text-xs font-semibold text-[#64748b]">Lot {r.vehicle.lotNumber}</span>
                </p>
                <p className="mt-1 text-xs text-[#64748b]">
                  {r.order.type === "BUY_NOW" ? "Buy Now" : "Auction Win"} |{" "}
                  <b className="text-[#1e293b]">{r.buyer.email}</b> |{" "}
                  {new Date(r.order.createdAt).toLocaleDateString("en-US")} | Payment: {r.order.paymentStatus}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#0b3b60]">
                  {formatMoney(r.order.amount, r.order.currency as Currency)}
                </span>
                <Badge tone={tone[r.order.status]}>{r.order.status.replace(/_/g, " ")}</Badge>
              </div>
            </div>
            {r.order.status === "PENDING_APPROVAL" && r.order.type === "AUCTION_WIN" ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-none border border-[#f59e0b] bg-[#fefce8] p-3 text-xs">
                <span className="font-bold text-[#b45309]">
                  Auction result pending review. Review and decide in Auction Approvals.
                </span>
                <a href="/admin/approvals" className="font-bold text-[#0b3b60] hover:underline">
                  Go to Approvals
                </a>
              </div>
            ) : (
              (r.order.status === "PENDING_APPROVAL" || r.order.status === "APPROVED") && (
                <OrderActions
                  orderId={r.order.id}
                  approved={r.order.status === "APPROVED"}
                  endedByBuyNow={
                    r.order.type === "BUY_NOW" &&
                    r.auction?.status === "ENDED" &&
                    r.auction?.closeReason === "buy_now"
                  }
                />
              )
            )}
          </Card>
        ))}
        {rows.length === 0 && (
          <p className="rounded-none border border-dashed border-[#cbd5e1] bg-white p-8 text-center text-xs text-[#64748b]">
            No orders yet.
          </p>
        )}
      </div>
    </div>
  );
}
