import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { myBids } from "@/features/account/queries";
import { Pagination } from "@/components/vehicles/pagination";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Countdown } from "@/components/auctions/countdown";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Bids" };

export default async function MyBidsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const perPage = 20;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const rows = myBids(user.id);

  // keep only the latest bid per auction
  const seen = new Map<string, (typeof rows)[0]>();
  for (const r of rows) {
    const cur = seen.get(r.auction.id);
    if (!cur || r.bid.amount > cur.bid.amount) seen.set(r.auction.id, r);
  }
  const items = [...seen.values()];
  const total = items.length;
  const paged = items.slice((page - 1) * perPage, page * perPage);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">My Bids</h1>
      {items.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No bids yet"
          body="When you place a bid, it will show up here with its live status."
          action={<Link href="/auctions" className="rounded-md bg-cta px-5 py-2.5 text-sm font-semibold text-white">Browse auctions</Link>}
        />
      ) : (
        <Card className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-bg/60 text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-semibold">Vehicle</th>
                <th className="px-5 py-3 font-semibold">My bid</th>
                <th className="px-5 py-3 font-semibold">Current</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Time left</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => {
                const myStatus =
                  r.auction.status === "LIVE"
                    ? r.auction.highestBidderId === user.id
                      ? "Leading"
                      : "Outbid"
                    : r.auction.winnerUserId === user.id
                      ? r.auction.status === "SOLD"
                        ? "Won"
                        : "Pending approval"
                      : "Ended";
                return (
                  <tr key={r.bid.id} className="border-b border-line/60 last:border-0">
                    <td className="px-5 py-3.5">
                      <Link href={`/vehicles/${r.vehicle.slug}`} className="flex items-center gap-3">
                        {r.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.coverUrl} alt="" className="h-11 w-16 shrink-0 rounded-md object-cover" />
                        ) : (
                          <span className="h-11 w-16 shrink-0 rounded-md bg-graphite/5" />
                        )}
                        <span className="font-bold hover:text-primary">
                          {r.vehicle.make} {r.vehicle.model} {r.vehicle.year}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-semibold">{formatMoney(r.bid.amount, r.auction.currency as Currency)}</td>
                    <td className="px-5 py-3.5 font-semibold">{formatMoney(r.auction.currentBid, r.auction.currency as Currency)}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={myStatus === "Leading" ? "success" : myStatus === "Outbid" ? "live" : myStatus === "Won" ? "success" : "neutral"}>
                        {myStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {r.auction.status === "LIVE" ? <Countdown endsAt={r.auction.endsAt} /> : "Ended"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination page={page} perPage={perPage} total={total} params={sp} basePath="/account/bids" />
    </div>
  );
}
