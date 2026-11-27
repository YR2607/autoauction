import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { myBids } from "@/features/account/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { Countdown } from "@/components/auctions/countdown";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Bids | AutoAuction" };

export default async function MyBidsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const rows = myBids(user.id);

  const seen = new Map<string, (typeof rows)[0]>();
  for (const r of rows) {
    const cur = seen.get(r.auction.id);
    if (!cur || r.bid.amount > cur.bid.amount) seen.set(r.auction.id, r);
  }
  const items = [...seen.values()];

  return (
    <div>
      <h1 className="text-xl font-bold uppercase tracking-wider text-[#0b3b60]">My Bids</h1>
      {items.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="No bids yet"
          body="When you place a bid, it will show up here with its live status."
          action={<Link href="/auctions" className="rounded-none bg-[#0b3b60] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#072a47]">Browse auctions</Link>}
        />
      ) : (
        <Card className="mt-4 overflow-x-auto rounded-none">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="border-b border-[#cbd5e1] bg-[#f8fafc] text-left uppercase tracking-wider text-[#64748b]">
                <th className="px-4 py-2.5 font-bold">Vehicle</th>
                <th className="px-4 py-2.5 font-bold">My Bid</th>
                <th className="px-4 py-2.5 font-bold">Current</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
                <th className="px-4 py-2.5 font-bold">Time Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {items.map((r) => {
                const myStatus =
                  r.auction.status === "LIVE"
                    ? r.auction.highestBidderId === user.id
                      ? "Leading"
                      : "Outbid"
                    : r.auction.winnerUserId === user.id
                      ? r.auction.status === "SOLD"
                        ? "Won"
                        : "Pending Approval"
                      : "Ended";

                const tone =
                  myStatus === "Leading" || myStatus === "Won"
                    ? "success"
                    : myStatus === "Outbid"
                      ? "live"
                      : myStatus === "Pending Approval"
                        ? "warning"
                        : "neutral";

                return (
                  <tr key={r.auction.id} className="hover:bg-[#f8fafc]">
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
                    <td className="px-4 py-3 font-mono font-bold text-[#1e293b]">
                      {formatMoney(r.bid.amount, r.auction.currency as Currency)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-[#0b3b60]">
                      {formatMoney(r.auction.currentBid, r.auction.currency as Currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={tone}>{myStatus}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">
                      {r.auction.status === "LIVE" ? <Countdown endsAt={r.auction.endsAt} /> : "Concluded"}
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
