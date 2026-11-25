import { adminDashboard } from "@/features/admin/queries";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/auctions/countdown";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminDashboard() {
  const d = adminDashboard();
  const maxBids = Math.max(...d.bidRows.map((x) => x.c), 1);

  return (
    <div className="space-y-8">
      {/* OPERATIONS DESK — dark auction-floor bar + thin archival ledger */}
      <section className="border border-ink bg-white">
        <div className="bg-ink px-6 py-6 text-white sm:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/50">
                <span className="h-1.5 w-1.5 bg-primary" aria-hidden />
                Operations desk
              </p>
              <h1 className="mt-2 font-display text-[28px] font-medium leading-tight">
                Auction house control
              </h1>
            </div>
            <Link
              href="/admin/vehicles/new"
              className="border border-white/30 px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-primary hover:bg-primary"
            >
              + New lot
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-white/15 pt-5 sm:grid-cols-4">
            <Link href="/admin/auctions" className="group">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                Live auctions
              </p>
              <p className="tnum mt-1.5 font-mono text-[30px] font-semibold leading-none text-primary group-hover:underline">
                {d.live}
              </p>
            </Link>
            <Link href="/admin/auctions" className="group">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                Upcoming
              </p>
              <p className="tnum mt-1.5 font-mono text-[30px] font-semibold leading-none text-white group-hover:underline">
                {d.upcoming}
              </p>
            </Link>
            <Link href="/admin/approvals" className="group">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                Awaiting approval
              </p>
              <p
                className={`tnum mt-1.5 font-mono text-[30px] font-semibold leading-none group-hover:underline ${
                  d.awaiting > 0 ? "text-amber-400" : "text-white/75"
                }`}
              >
                {d.awaiting}
              </p>
            </Link>
            <Link href="/admin/orders" className="group">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                Pending orders
              </p>
              <p
                className={`tnum mt-1.5 font-mono text-[30px] font-semibold leading-none group-hover:underline ${
                  d.pendingOrders > 0 ? "text-amber-400" : "text-white/75"
                }`}
              >
                {d.pendingOrders}
              </p>
            </Link>
          </div>
        </div>

        {/* Thin archival ledger row */}
        <div className="flex flex-wrap items-center divide-y divide-line border-t border-line sm:divide-x sm:divide-y-0">
          {[
            { label: "Total vehicles", value: d.vehicles, href: "/admin/vehicles" },
            { label: "Published", value: d.published, href: "/admin/vehicles" },
            { label: "Sold", value: d.sold, href: "/admin/vehicles" },
            { label: "Accepted bids", value: d.totalBids, href: "/admin/bids" },
            { label: "Users", value: d.users, href: "/admin/users" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-1 basis-[140px] items-baseline justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-bg"
            >
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-tech">
                {item.label}
              </span>
              <span className="tnum font-mono text-lg font-semibold text-ink">
                {item.value}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* BID ACTIVITY */}
      <section className="border border-line bg-white p-6">
        <div className="flex items-baseline justify-between border-b border-line pb-3">
          <h2 className="font-display text-[20px] font-medium text-ink">
            Bid activity (last 14 days)
          </h2>
          <span className="tnum font-mono text-[11px] uppercase tracking-[0.12em] text-tech">
            Peak {maxBids} / day
          </span>
        </div>
        <div className="mt-6 flex h-32 items-end gap-1.5">
          {d.bidRows.length === 0 ? (
            <p className="text-sm text-muted">No bids yet.</p>
          ) : (
            d.bidRows.map((r) => (
              <div key={r.day} className="group relative flex-1">
                <div
                  className="w-full bg-ink/80 transition-colors group-hover:bg-primary"
                  style={{ height: `${Math.max(4, (r.c / maxBids) * 120)}px` }}
                />
                <span className="tnum absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap bg-ink px-2 py-0.5 font-mono text-[10px] font-semibold text-white group-hover:block">
                  {r.day}: {r.c}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* LIVE AUCTIONS + PENDING APPROVALS */}
      <div className="grid gap-8 xl:grid-cols-2">
        <section>
          <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
            <h2 className="font-display text-[20px] font-medium text-ink">Live auctions</h2>
            <Link
              href="/admin/auctions"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink hover:text-primary"
            >
              Manage →
            </Link>
          </div>
          {d.liveAuctions.length === 0 ? (
            <p className="border-b border-line bg-white px-5 py-8 text-center text-sm text-muted">
              Nothing live right now.
            </p>
          ) : (
            <ul className="divide-y divide-line border-b border-line bg-white">
              {d.liveAuctions.map((r) => (
                <li key={r.auction.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <Link
                    href={`/vehicles/${r.vehicle.slug}`}
                    className="min-w-0 truncate text-sm font-semibold text-ink hover:text-primary"
                  >
                    {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                  </Link>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="tnum font-mono text-sm font-semibold text-ink">
                      {formatMoney(
                        r.auction.currentBid ?? r.auction.startingPrice,
                        r.auction.currency as Currency,
                      )}
                    </span>
                    <span className="tnum font-mono text-[11px] text-tech">
                      {r.auction.bidCount} bids
                    </span>
                    <Countdown
                      endsAt={r.auction.endsAt}
                      className="tnum font-mono text-xs font-semibold text-primary"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
            <h2 className="font-display text-[20px] font-medium text-ink">Pending approvals</h2>
            <Link
              href="/admin/approvals"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink hover:text-primary"
            >
              Review →
            </Link>
          </div>
          {d.pendingApprovals.length === 0 ? (
            <p className="border-b border-line bg-white px-5 py-8 text-center text-sm text-muted">
              Queue is empty.
            </p>
          ) : (
            <ul className="divide-y divide-line border-b border-line bg-white">
              {d.pendingApprovals.map((r) => (
                <li key={r.auction.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <span className="min-w-0 truncate text-sm font-semibold text-ink">
                    {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                  </span>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="tnum font-mono text-sm font-semibold text-ink">
                      {formatMoney(r.order.amount, r.order.currency as Currency)}
                    </span>
                    <Badge tone="warning">Review</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* RECENT ORDERS */}
      <section>
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <h2 className="font-display text-[20px] font-medium text-ink">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink hover:text-primary"
          >
            All orders →
          </Link>
        </div>
        {d.recentOrders.length === 0 ? (
          <p className="border-b border-line bg-white px-5 py-8 text-center text-sm text-muted">
            No orders yet.
          </p>
        ) : (
          <div className="overflow-x-auto border-b border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg text-left text-tech">
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Buyer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {d.recentOrders.map((r) => (
                  <tr key={r.order.id} className="hover:bg-bg/60">
                    <td className="px-5 py-3 font-semibold text-ink">
                      {r.vehicle.make} {r.vehicle.model}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted">{r.buyer.email}</td>
                    <td className="tnum px-5 py-3 font-mono font-semibold text-ink">
                      {formatMoney(r.order.amount, r.order.currency as Currency)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        tone={
                          r.order.status === "PENDING_APPROVAL"
                            ? "warning"
                            : r.order.status === "APPROVED" || r.order.status === "COMPLETED"
                              ? "success"
                              : "neutral"
                        }
                      >
                        {r.order.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
