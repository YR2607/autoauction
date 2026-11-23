import { allBids, bidsCount } from "@/features/admin/queries";
import { Pagination } from "@/components/vehicles/pagination";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney, type Currency } from "@/lib/currency";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bids · Admin" };

export default async function BidsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const perPage = 25;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const total = bidsCount();
  const rows = allBids(perPage, (page - 1) * perPage);
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Bid history</h1>
      <p className="mt-1 text-sm text-muted">Accepted and rejected bid events across all auctions.</p>
      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line bg-bg/60 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Time</th>
              <th className="px-5 py-3 font-semibold">Vehicle</th>
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">Amount</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.bid.id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3 text-muted">{new Date(r.bid.createdAt).toLocaleString("en-GB")}</td>
                <td className="px-5 py-3 font-bold">{r.vehicle.make} {r.vehicle.model}</td>
                <td className="px-5 py-3 text-muted">{r.user.email}</td>
                <td className="px-5 py-3 font-semibold">{formatMoney(r.bid.amount, r.auction.currency as Currency)}</td>
                <td className="px-5 py-3">
                  <Badge tone={r.bid.status === "ACCEPTED" ? "success" : "live"}>{r.bid.status}</Badge>
                  {r.bid.rejectReason && <span className="ml-2 text-xs text-muted">{r.bid.rejectReason}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Pagination page={page} perPage={perPage} total={total} params={sp} basePath="/admin/bids" />
    </div>
  );
}

