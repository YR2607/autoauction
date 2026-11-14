import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { accountDashboard } from "@/features/account/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatMoney, type Currency } from "@/lib/currency";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const d = accountDashboard(user.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Welcome back, {user.email}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Active bids" value={d.activeBids} href="/account/bids" />
        <Stat label="Leading" value={d.leadingCount} href="/account/bids" tone="success" />
        <Stat label="Outbid" value={d.outbidCount} href="/account/bids" tone="error" />
        <Stat label="Won" value={d.wonCount} href="/account/purchases" />
        <Stat label="Pending" value={d.pendingOrders} href="/account/purchases" tone="warning" />
        <Stat label="Favorites" value={d.favorites} href="/account/favorites" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-base font-bold">Active bids</h2>
            <Link href="/account/bids" className="text-xs font-bold text-primary">View all →</Link>
          </div>
          {d.bidEntries.filter((e) => e.auction.status === "LIVE").length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">No active bids — <Link href="/auctions" className="font-semibold text-primary">browse auctions</Link>.</p>
          ) : (
            <ul className="divide-y divide-line/60">
              {d.bidEntries
                .filter((e) => e.auction.status === "LIVE")
                .slice(0, 5)
                .map((e) => (
                  <li key={e.auction.id} className="flex items-center justify-between px-5 py-3.5">
                    <Link href={`/vehicles/${e.vehicle.slug}`} className="min-w-0">
                      <p className="truncate text-sm font-bold">{e.vehicle.make} {e.vehicle.model} {e.vehicle.year}</p>
                      <p className="text-xs text-muted">
                        My bid {formatMoney(e.bid.amount, e.auction.currency as Currency)} · Current {formatMoney(e.auction.currentBid, e.auction.currency as Currency)}
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

        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-base font-bold">Recent activity</h2>
            <Link href="/account/notifications" className="text-xs font-bold text-primary">
              All {d.unread > 0 && `(${d.unread} new)`} →
            </Link>
          </div>
          {d.recentNotifications.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Nothing yet.</p>
          ) : (
            <ul className="divide-y divide-line/60">
              {d.recentNotifications.map((n) => (
                <li key={n.id} className="px-5 py-3.5">
                  <p className="text-sm font-bold">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-muted">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-muted/70">{new Date(n.createdAt).toLocaleString("en-GB")}</p>
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
  const color = tone === "success" ? "text-success" : tone === "error" ? "text-error" : tone === "warning" ? "text-warning" : "text-graphite";
  return (
    <Link href={href} className="rounded-[14px] border border-line bg-white p-4 transition-shadow hover:shadow-md">
      <p className={`font-display text-2xl font-extrabold ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-muted">{label}</p>
    </Link>
  );
}
