import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { accountDashboard } from "@/features/account/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/auctions/countdown";
import Link from "next/link";
import { formatMoney, type Currency } from "@/lib/currency";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard | AutoAuction" };

const STATS: {
  key: string;
  label: string;
  href: string;
  get: (d: ReturnType<typeof accountDashboard>) => number;
  num: string;
}[] = [
  { key: "active", label: "Active Bids", href: "/account/bids", get: (d) => d.activeBids, num: "text-white" },
  { key: "leading", label: "Leading", href: "/account/bids", get: (d) => d.leadingCount, num: "text-[#7fd48f]" },
  { key: "outbid", label: "Outbid", href: "/account/bids", get: (d) => d.outbidCount, num: "text-[#ff7a66]" },
  { key: "won", label: "Won", href: "/account/purchases", get: (d) => d.wonCount, num: "text-[#ffb81c]" },
  { key: "pending", label: "Pending", href: "/account/purchases", get: (d) => d.pendingOrders, num: "text-[#ffb81c]" },
  { key: "watchlist", label: "Watchlist", href: "/account/favorites", get: (d) => d.favorites, num: "text-white" },
];

function notifType(t: string) {
  return t.replace(/_/g, " ");
}

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const d = accountDashboard(user.id);
  const liveBids = d.bidEntries
    .filter((e) => e.auction.status === "LIVE")
    .sort((a, b) => a.auction.endsAt - b.auction.endsAt);

  return (
    <div>
      {/* account summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#0b3b60] pb-2">
        <h1 className="text-xl font-bold uppercase tracking-wider text-[#0b3b60]">Member Dashboard</h1>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">{user.email}</p>
      </div>

      {/* continuous stats strip — navy terminal bar */}
      <div className="mt-3 grid grid-cols-3 border border-[#072a47] bg-[#0b3b60] sm:grid-cols-6">
        {STATS.map((s) => {
          const v = s.get(d);
          return (
            <Link
              key={s.key}
              href={s.href}
              className="border-[#1e4f79] px-3 py-2.5 transition-colors hover:bg-[#072a47] [&:not(:last-child)]:border-r max-sm:[&:nth-child(-n+3)]:border-b"
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#94a3b8]">{s.label}</p>
              <p className={`tnum mt-0.5 text-[22px] font-black leading-none ${v === 0 && s.key === "outbid" ? "text-white/50" : s.num}`}>
                {v}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[7fr_5fr]">
        {/* Active bids — catalog rows */}
        <Card className="rounded-none">
          <div className="flex items-center justify-between border-b border-[#cbd5e1] bg-[#f8fafc] px-4 py-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0b3b60]">
              Active Bids <span className="ml-1 text-[#64748b]">({liveBids.length})</span>
            </h2>
            <Link href="/account/bids" className="text-xs font-bold text-[#0b3b60] hover:underline">View All</Link>
          </div>
          {liveBids.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[#64748b]">No active bids. <Link href="/auctions" className="font-bold text-[#0b3b60] underline">Browse live auctions</Link>.</p>
          ) : (
            <ul className="divide-y divide-[#f1f5f9]">
              {liveBids.slice(0, 5).map((e) => {
                const leading = e.auction.highestBidderId === user.id;
                return (
                  <li key={e.auction.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Link href={`/vehicles/${e.vehicle.slug}`} className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={e.coverUrl ?? ""}
                        alt={`${e.vehicle.make} ${e.vehicle.model}`}
                        className="h-[42px] w-[64px] object-cover"
                        loading="lazy"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                          Lot {e.vehicle.lotNumber}
                        </span>
                        <span className="tnum font-mono text-[10px] font-bold text-[#cc0000]">
                          <Countdown endsAt={e.auction.endsAt} />
                        </span>
                      </div>
                      <Link href={`/vehicles/${e.vehicle.slug}`} className="block truncate text-xs font-bold text-[#0b3b60] hover:underline">
                        {e.vehicle.year} {e.vehicle.make} {e.vehicle.model}
                      </Link>
                      <p className="tnum mt-0.5 text-[11px] text-[#64748b]">
                        My bid <span className="font-bold text-[#1e293b]">{formatMoney(e.bid.amount, e.auction.currency as Currency)}</span>
                        {" | "}Current <span className="font-bold text-[#1e293b]">{formatMoney(e.auction.currentBid, e.auction.currency as Currency)}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {leading ? (
                        <Badge tone="success">Leading</Badge>
                      ) : (
                        <Badge tone="live">Outbid</Badge>
                      )}
                      <Link
                        href={`/vehicles/${e.vehicle.slug}`}
                        className="text-[10px] font-bold uppercase tracking-wider text-[#0b3b60] underline hover:text-[#cc0000]"
                      >
                        {leading ? "View" : "Raise bid"}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Recent activity — compact log */}
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
                <li key={n.id} className="px-4 py-2 text-xs">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="shrink-0 font-mono text-[9.5px] font-bold uppercase tracking-wider text-[#94a3b8]">
                      {notifType(n.type)}
                    </span>
                    <span className="tnum shrink-0 font-mono text-[9.5px] text-[#94a3b8]">
                      {new Date(n.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className={`mt-0.5 ${!n.readAt ? "font-bold text-[#1e293b]" : "font-medium text-[#475569]"}`}>
                    {!n.readAt && <span className="mr-1.5 inline-block h-1.5 w-1.5 bg-[#ffb81c] align-middle" />}
                    {n.title}
                  </p>
                  {n.body && <p className="mt-0.5 text-[11px] leading-snug text-[#64748b]">{n.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
