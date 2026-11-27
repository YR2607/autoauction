import { adminDashboard } from "@/features/admin/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/auctions/countdown";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin Dashboard | AutoAuction" };

export default function AdminDashboard() {
  const d = adminDashboard();

  return (
    <div>
      <h1 className="text-xl font-bold uppercase tracking-wider text-[#0b3b60]">Admin Dashboard</h1>

      <div className="mt-4 flex flex-wrap items-stretch gap-y-3 border-b border-[#cbd5e1] pb-4">
        <Stat label="Vehicles" value={d.vehicles} href="/admin/vehicles" />
        <Stat label="Published" value={d.published} href="/admin/vehicles" />
        <Stat label="Live Auctions" value={d.live} href="/admin/auctions" tone="text-[#cc0000]" />
        <Stat label="Upcoming" value={d.upcoming} href="/admin/auctions" />
        <Stat label="Awaiting Approval" value={d.awaiting} href="/admin/approvals" tone="text-[#b45309]" />
        <Stat label="Users" value={d.users} href="/admin/users" />
        <Stat label="Pending Orders" value={d.pendingOrders} href="/admin/orders" tone="text-[#b45309]" />
        <Stat label="Accepted Bids" value={d.totalBids} href="/admin/bids" />
        <Stat label="Sold Vehicles" value={d.sold} href="/admin/vehicles" tone="text-[#15803d]" />
      </div>

      <Card className="mt-4 p-4 rounded-none">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0b3b60]">Bid Activity (Last 14 Days)</h2>
        <div className="mt-4 flex h-28 items-end gap-1.5">
          {d.bidRows.length === 0 ? (
            <p className="text-xs text-[#64748b]">No bids recorded yet.</p>
          ) : (
            d.bidRows.map((r) => {
              const max = Math.max(...d.bidRows.map((x) => x.c), 1);
              return (
                <div key={r.day} className="group relative flex-1">
                  <div
                    className="w-full rounded-none bg-[#0b3b60] transition-colors group-hover:bg-[#ffb81c]"
                    style={{ height: `${Math.max(4, (r.c / max) * 100)}px` }}
                  />
                  <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-none bg-[#051a2e] px-1.5 py-0.5 text-[9px] font-bold text-white group-hover:block">
                    {r.day}: {r.c}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2 text-xs">
        <Card className="rounded-none">
          <div className="flex items-center justify-between border-b border-[#cbd5e1] bg-[#f8fafc] px-4 py-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0b3b60]">Live Auctions</h2>
            <Link href="/admin/auctions" className="text-xs font-bold text-[#0b3b60] hover:underline">Manage</Link>
          </div>
          {d.liveAuctions.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[#64748b]">Nothing live right now.</p>
          ) : (
            <ul className="divide-y divide-[#f1f5f9]">
              {d.liveAuctions.map((r) => (
                <li key={r.auction.id} className="flex items-center justify-between px-4 py-2.5">
                  <Link href={`/vehicles/${r.vehicle.slug}`} className="font-bold text-[#0b3b60] hover:underline">
                    {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{formatMoney(r.auction.currentBid ?? r.auction.startingPrice, r.auction.currency as Currency)}</span>
                    <span className="text-[11px] text-[#64748b]">{r.auction.bidCount} bids</span>
                    <Countdown endsAt={r.auction.endsAt} className="text-xs font-bold text-[#cc0000]" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="rounded-none">
          <div className="flex items-center justify-between border-b border-[#cbd5e1] bg-[#f8fafc] px-4 py-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0b3b60]">Pending Approvals</h2>
            <Link href="/admin/approvals" className="text-xs font-bold text-[#0b3b60] hover:underline">Review</Link>
          </div>
          {d.pendingApprovals.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[#64748b]">Queue is empty.</p>
          ) : (
            <ul className="divide-y divide-[#f1f5f9]">
              {d.pendingApprovals.map((r) => (
                <li key={r.auction.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="font-bold text-[#1e293b]">{r.vehicle.year} {r.vehicle.make} {r.vehicle.model}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0b3b60]">{formatMoney(r.order.amount, r.order.currency as Currency)}</span>
                    <Badge tone="warning">Review</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4 rounded-none">
        <div className="flex items-center justify-between border-b border-[#cbd5e1] bg-[#f8fafc] px-4 py-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0b3b60]">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs font-bold text-[#0b3b60] hover:underline">All Orders</Link>
        </div>
        {d.recentOrders.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-[#64748b]">No orders yet.</p>
        ) : (
          <table className="w-full text-xs">
            <tbody className="divide-y divide-[#f1f5f9]">
              {d.recentOrders.map((r) => (
                <tr key={r.order.id} className="hover:bg-[#f8fafc]">
                  <td className="px-4 py-2.5 font-bold text-[#0b3b60]">{r.vehicle.year} {r.vehicle.make} {r.vehicle.model}</td>
                  <td className="px-4 py-2.5 text-[#64748b]">{r.buyer.email}</td>
                  <td className="px-4 py-2.5 font-bold">{formatMoney(r.order.amount, r.order.currency as Currency)}</td>
                  <td className="px-4 py-2.5"><Badge tone={r.order.status === "PENDING_APPROVAL" ? "warning" : r.order.status === "APPROVED" || r.order.status === "COMPLETED" ? "success" : "neutral"}>{r.order.status.replace(/_/g, " ")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, href, tone }: { label: string; value: number; href: string; tone?: string }) {
  return (
    <Link
      href={href}
      className="flex items-baseline gap-2 border-l border-[#cbd5e1] px-4 first:border-l-0 first:pl-0 group"
    >
      <span className={`text-[26px] font-black leading-none ${tone ?? "text-[#0b3b60]"} group-hover:underline`}>
        {value}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] group-hover:text-[#0b3b60]">
        {label}
      </span>
    </Link>
  );
}
