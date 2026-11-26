import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { accountDashboard } from "@/features/account/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatMoney, type Currency } from "@/lib/currency";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard | AutoAuction" };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const d = accountDashboard(user.id);

  return (
    <div>
      <h1 className="text-xl font-bold uppercase tracking-wider text-[#0b3b60]">Member Dashboard</h1>
      <p className="mt-1 text-xs text-[#64748b]">Account: {user.email}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Active Bids" value={d.activeBids} href="/account/bids" />
        <Stat label="Leading" value={d.leadingCount} href="/account/bids" tone="success" />
        <Stat label="Outbid" value={d.outbidCount} href="/account/bids" tone="error" />
        <Stat label="Won" value={d.wonCount} href="/account/purchases" />
        <Stat label="Pending" value={d.pendingOrders} href="/account/purchases" tone="warning" />
        <Stat label="Watchlist" value={d.favorites} href="/account/favorites" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="rounded-none">
          <div className="flex items-center justify-between border-b border-[#cbd5e1] bg-[#f8fafc] px-4 py-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0b3b60]">Active Bids</h2>
            <Link href="/account/bids" className="text-xs font-bold text-[#0b3b60] hover:underline">View All</Link>
          </div>
          {d.bidEntries.filter((e) => e.auction.status === "LIVE").length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[#64748b]">No active bids. <Link href="/auctions" className="font-bold text-[#0b3b60] underline">Browse live auctions</Link>.</p>
          ) : (
            <ul className="divide-y divide-[#f1f5f9]">
              {d.bidEntries
                .filter((e) => e.auction.status === "LIVE")
                .slice(0, 5)
                .map((e) => (
                  <li key={e.auction.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                    <Link href={`/vehicles/${e.vehicle.slug}`} className="min-w-0 hover:underline">
                      <p className="truncate font-bold text-[#0b3b60]">{e.vehicle.year} {e.vehicle.make} {e.vehicle.model}</p>
                      <p className="text-[11px] text-[#64748b]">
                        My bid: {formatMoney(e.bid.amount, e.auction.currency as Currency)} | Current: {formatMoney(e.auction.currentBid, e.auction.currency as Currency)}
                      </p>
                    </Link>
                    {e.auction.highestBidderId === user.id ? (
                      <Badge tone="success">Leading</Badge>
                    ) : (
                      <Badge tone="live">Outbid</Badge>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card className="rounded-none">
          <div className="flex items-center justify-between border-b border-[#cbd5e1] bg-[#f8fafc] px-4 py-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0b3b60]">Recent Activity</h2>
            <Link href="/account/notifications" className="text-xs font-bold text-[#0b3b60] hover:underline">
              All {d.unread > 0 && `(${d.unread} new)`}
            </Link>
          </div>
          {d.recentNotifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[#64748b]">No recent notifications.</p>
          ) : (
            <ul className="divide-y divide-[#f1f5f9]">
              {d.recentNotifications.map((n) => (
                <li key={n.id} className="px-4 py-2.5 text-xs">
                  <p className="font-bold text-[#1e293b]">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-[11px] text-[#64748b]">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-[#94a3b8]">{new Date(n.createdAt).toLocaleString("en-US")}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, href, tone }: { label: string; value: number; href: string; tone?: "success" | "error" | "warning" }) {
  const color = tone === "success" ? "text-[#15803d]" : tone === "error" ? "text-[#cc0000]" : tone === "warning" ? "text-[#b45309]" : "text-[#0b3b60]";
  return (
    <Link
      href={href}
      className="block rounded-none border border-[#cbd5e1] bg-white p-3 hover:border-[#0b3b60] transition-colors"
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">{label}</p>
      <p className={`mt-1 text-2xl font-black ${color}`}>{value}</p>
    </Link>
  );
}
