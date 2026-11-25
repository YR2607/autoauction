import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { myBids } from "@/features/account/queries";
import { Pagination } from "@/components/vehicles/pagination";
import { EmptyState } from "@/components/ui/empty";
import { Countdown } from "@/components/auctions/countdown";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Bids" };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "leading", label: "Leading" },
  { key: "outbid", label: "Outbid" },
  { key: "won", label: "Won" },
  { key: "ended", label: "Ended" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

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
  const filter: Filter = FILTERS.some((f) => f.key === sp.f) ? (sp.f as Filter) : "all";

  const rows = myBids(user.id);
  const seen = new Map<string, (typeof rows)[0]>();
  for (const r of rows) {
    const cur = seen.get(r.auction.id);
    if (!cur || r.bid.amount > cur.bid.amount) seen.set(r.auction.id, r);
  }

  const statusOf = (r: (typeof rows)[0]) =>
    r.auction.status === "LIVE"
      ? r.auction.highestBidderId === user.id
        ? ("LEADING" as const)
        : ("OUTBID" as const)
      : r.auction.winnerUserId === user.id
        ? r.auction.status === "SOLD"
          ? ("WON" as const)
          : ("PENDING" as const)
        : ("ENDED" as const);

  const items = [...seen.values()]
    .map((r) => ({ ...r, st: statusOf(r) }))
    .filter((r) =>
      filter === "all"
        ? true
        : filter === "leading"
          ? r.st === "LEADING"
          : filter === "outbid"
            ? r.st === "OUTBID"
            : filter === "won"
              ? r.st === "WON" || r.st === "PENDING"
              : r.st === "ENDED",
    )
    .sort((a, b) =>
      a.auction.status === "LIVE" && b.auction.status === "LIVE"
        ? a.auction.endsAt - b.auction.endsAt
        : a.auction.status === "LIVE"
          ? -1
          : b.auction.status === "LIVE"
            ? 1
            : b.bid.createdAt - a.bid.createdAt,
    );
  const total = items.length;
  const paged = items.slice((page - 1) * perPage, page * perPage);

  const stLabel: Record<string, { text: string; cls: string }> = {
    LEADING: { text: "● Leading", cls: "text-success" },
    OUTBID: { text: "● Outbid", cls: "text-primary" },
    WON: { text: "● Won", cls: "text-gold" },
    PENDING: { text: "● Pending approval", cls: "text-amber-700" },
    ENDED: { text: "○ Ended", cls: "text-muted" },
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-4">
        <h1 className="font-display text-[28px] font-medium text-ink">My bids</h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-tech">
          {total} lot{total === 1 ? "" : "s"}
        </p>
      </div>

      {/* segmented filter */}
      <nav className="flex gap-0 overflow-x-auto border-b border-line/70" aria-label="Bid status filter">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/account/bids" : `/account/bids?f=${f.key}`}
            className={`shrink-0 border-b-2 px-4 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] transition-colors ${
              filter === f.key
                ? "border-primary text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={filter === "all" ? "No bids yet" : `No ${filter} bids`}
          body="When you place a bid, it will show up here with its live status."
          action={<Link href="/auctions" className="rounded-md bg-cta px-5 py-2.5 text-sm font-semibold text-white">Browse auctions</Link>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-line/70 text-left">
                <th className="py-2.5 pr-4">Lot / vehicle</th>
                <th className="py-2.5 pr-4">My bid</th>
                <th className="py-2.5 pr-4">Current bid</th>
                <th className="py-2.5 pr-4">Status</th>
                <th className="py-2.5 pr-4">Ends</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.bid.id} className="group border-b border-line/70">
                  <td className="py-3.5 pr-4">
                    <Link href={`/vehicles/${r.vehicle.slug}`} className="flex items-center gap-3">
                      {r.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.coverUrl} alt="" className="aspect-[3/2] w-[84px] shrink-0 object-cover" />
                      ) : (
                        <span className="aspect-[3/2] w-[84px] shrink-0 bg-graphite/5" />
                      )}
                      <span>
                        <span className="tnum block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-tech">
                          Lot {r.vehicle.lotNumber}
                        </span>
                        <span className="mt-0.5 block font-display text-[15.5px] font-medium text-ink group-hover:text-primary">
                          {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="tnum py-3.5 pr-4 font-mono text-[13px] font-semibold text-ink">
                    {formatMoney(r.bid.amount, r.auction.currency as Currency)}
                  </td>
                  <td className="tnum py-3.5 pr-4 font-mono text-[13px] text-ink">
                    {formatMoney(r.auction.currentBid, r.auction.currency as Currency)}
                  </td>
                  <td className={`py-3.5 pr-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] ${stLabel[r.st].cls}`}>
                    {stLabel[r.st].text}
                  </td>
                  <td className="tnum py-3.5 pr-4 font-mono text-[11.5px] text-muted">
                    {r.auction.status === "LIVE" ? <Countdown endsAt={r.auction.endsAt} /> : "—"}
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      href={`/vehicles/${r.vehicle.slug}`}
                      className="border-b border-ink/40 pb-px font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:border-primary hover:text-primary"
                    >
                      {r.st === "OUTBID" ? "Raise bid" : "View lot"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} perPage={perPage} total={total} params={sp} basePath="/account/bids" />
    </div>
  );
}
