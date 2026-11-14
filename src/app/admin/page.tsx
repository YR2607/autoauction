import { adminDashboard } from "@/features/admin/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/auctions/countdown";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminDashboard() {
  const d = adminDashboard();

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <Stat label="Vehicles" value={d.vehicles} href="/admin/vehicles" />
        <Stat label="Published" value={d.published} href="/admin/vehicles" />
        <Stat label="Live auctions" value={d.live} href="/admin/auctions" tone="text-error" />
        <Stat label="Upcoming" value={d.upcoming} href="/admin/auctions" />
        <Stat label="Awaiting approval" value={d.awaiting} href="/admin/approvals" tone="text-warning" />
        <Stat label="Users" value={d.users} href="/admin/users" />
        <Stat label="Pending orders" value={d.pendingOrders} href="/admin/orders" tone="text-warning" />
        <Stat label="Accepted bids" value={d.totalBids} href="/admin/bids" />
        <Stat label="Sold vehicles" value={d.sold} href="/admin/vehicles" tone="text-success" />
      </div>

      {/* activity chart */}
      <Card className="mt-6 p-6">
        <h2 className="font-display text-base font-bold">Bid activity — last 14 days</h2>
        <div className="mt-5 flex h-32 items-end gap-1.5">
          {d.bidRows.length === 0 ? (
            <p className="text-sm text-muted">No bids yet.</p>
          ) : (
            d.bidRows.map((r) => {
              const max = Math.max(...d.bidRows.map((x) => x.c), 1);
              return (
                <div key={r.day} className="group relative flex-1">
                  <div
                    className="w-full rounded-t-md bg-primary/80 transition-colors group-hover:bg-primary"
                    style={{ height: `${Math.max(4, (r.c / max) * 120)}px` }}
                  />
                  <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-0.5 text-[10px] font-bold text-white group-hover:block">
                    {r.day}: {r.c}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-base font-bold">Live auctions</h2>
            <Link href="/admin/auctions" className="text-xs font-bold text-primary">Manage →</Link>
          </div>
          {d.liveAuctions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Nothing live right now.</p>
          ) : (
            <ul className="divide-y divide-line/60">
              {d.liveAuctions.map((r) => (
                <li key={r.auction.id} className="flex items-center justify-between px-5 py-3">
                  <Link href={`/vehicles/${r.vehicle.slug}`} className="text-sm font-bold hover:text-primary">
                    {r.vehicle.make} {r.vehicle.model} {r.vehicle.year}
                  </Link>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-bold">{formatMoney(r.auction.currentBid ?? r.auction.startingPrice, r.auction.currency as Currency)}</span>
                    <span className="text-xs text-muted">{r.auction.bidCount} bids</span>
                    <Countdown endsAt={r.auction.endsAt} className="text-xs font-bold text-error" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-base font-bold">Pending approvals</h2>
            <Link href="/admin/approvals" className="text-xs font-bold text-primary">Review →</Link>
          </div>
          {d.pendingApprovals.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Queue is empty.</p>
          ) : (
            <ul className="divide-y divide-line/60">
              {d.pendingApprovals.map((r) => (
                <li key={r.auction.id} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm font-bold">{r.vehicle.make} {r.vehicle.model} {r.vehicle.year}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{formatMoney(r.order.amount, r.order.currency as Currency)}</span>
                    <Badge tone="warning">Review</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-base font-bold">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs font-bold text-primary">All orders →</Link>
        </div>
        {d.recentOrders.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {d.recentOrders.map((r) => (
                <tr key={r.order.id} className="border-b border-line/60 last:border-0">
                  <td className="px-5 py-3 font-bold">{r.vehicle.make} {r.vehicle.model}</td>
                  <td className="px-5 py-3 text-muted">{r.buyer.email}</td>
                  <td className="px-5 py-3 font-bold">{formatMoney(r.order.amount, r.order.currency as Currency)}</td>
                  <td className="px-5 py-3"><Badge tone={r.order.status === "PENDING_APPROVAL" ? "warning" : r.order.status === "APPROVED" || r.order.status === "COMPLETED" ? "success" : "neutral"}>{r.order.status.replace(/_/g, " ")}</Badge></td>
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
    <Link href={href} className="rounded-[14px] border border-line bg-white p-4 transition-shadow hover:shadow-md">
      <p className={`font-display text-2xl font-extrabold ${tone ?? "text-graphite"}`}>{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-muted">{label}</p>
    </Link>
  );
}
