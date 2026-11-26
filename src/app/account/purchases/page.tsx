import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { myOrders } from "@/features/account/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Purchases | AutoAuction" };

const STATUS_LABELS: Record<string, { label: string; tone: "warning" | "success" | "live" | "neutral" }> = {
  PENDING_APPROVAL: { label: "Pending Approval", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Rejected", tone: "live" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export default async function PurchasesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const orders = myOrders(user.id);

  return (
    <div>
      <h1 className="text-xl font-bold uppercase tracking-wider text-[#0b3b60]">Purchases and Orders</h1>
      {orders.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="No purchases yet"
          body="Vehicles won at auction or bought via Buy It Now will appear here."
          action={<Link href="/buy-now" className="rounded-none bg-[#0b3b60] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#072a47]">Browse Buy It Now</Link>}
        />
      ) : (
        <Card className="mt-4 overflow-x-auto rounded-none">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="border-b border-[#cbd5e1] bg-[#f8fafc] text-left uppercase tracking-wider text-[#64748b]">
                <th className="px-4 py-2.5 font-bold">Vehicle</th>
                <th className="px-4 py-2.5 font-bold">Type</th>
                <th className="px-4 py-2.5 font-bold">Price</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
                <th className="px-4 py-2.5 font-bold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {orders.map((r) => {
                const s = STATUS_LABELS[r.order.status] ?? { label: r.order.status, tone: "neutral" as const };
                return (
                  <tr key={r.order.id} className="hover:bg-[#f8fafc]">
                    <td className="px-4 py-3">
                      <Link href={`/vehicles/${r.vehicle.slug}`} className="flex items-center gap-3 hover:underline">
                        {r.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.coverUrl} alt="" className="h-10 w-16 shrink-0 rounded-none object-cover" />
                        ) : (
                          <span className="h-10 w-16 shrink-0 rounded-none bg-[#e2e8f0]" />
                        )}
                        <div>
                          <p className="font-bold text-[#0b3b60]">{r.vehicle.year} {r.vehicle.make} {r.vehicle.model}</p>
                          <p className="text-[11px] text-[#64748b]">Lot {r.vehicle.lotNumber}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold uppercase text-[#64748b]">
                      {r.order.type === "BUY_NOW" ? "Buy It Now" : "Auction Win"}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-[#0b3b60]">
                      {formatMoney(r.order.amount, r.order.currency as Currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">
                      {new Date(r.order.createdAt).toLocaleDateString("en-US")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
