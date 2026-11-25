import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { myFavorites, myFavoritesCount } from "@/features/account/queries";
import { Pagination } from "@/components/vehicles/pagination";
import { EmptyState } from "@/components/ui/empty";
import { FavoriteButton } from "@/components/vehicles/favorite-button";
import { Countdown } from "@/components/auctions/countdown";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Favorites" };

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const perPage = 12;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const total = myFavoritesCount(user.id);
  const rows = myFavorites(user.id, perPage, (page - 1) * perPage);

  const items = rows.map((r) => {
    const auction = db
      .select()
      .from(schema.auctions)
      .where(eq(schema.auctions.vehicleId, r.vehicle.id))
      .get();
    return { v: r.vehicle, coverUrl: r.coverUrl, auction };
  });

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-4">
        <h1 className="font-display text-[28px] font-medium text-ink">Favorites</h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-tech">
          Collector watchlist · {total} lot{total === 1 ? "" : "s"}
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No favorites yet"
          body="Tap the heart on any vehicle to keep it here."
          action={<Link href="/vehicles" className="rounded-md bg-cta px-5 py-2.5 text-sm font-semibold text-white">Browse vehicles</Link>}
        />
      ) : (
        <table className="w-full">
          <tbody>
            {items.map(({ v, coverUrl, auction }) => {
              const live = auction?.status === "LIVE";
              const scheduled = auction?.status === "SCHEDULED";
              const price = auction
                ? (auction.currentBid ?? 0) > 0
                  ? formatMoney(auction.currentBid!, auction.currency as Currency)
                  : formatMoney(auction.startingPrice ?? 0, auction.currency as Currency)
                : v.buyNowPrice
                  ? formatMoney(v.buyNowPrice, (v.buyNowCurrency ?? "EUR") as Currency)
                  : null;
              return (
                <tr key={v.id} className="group border-b border-line/70 align-middle">
                  <td className="w-[148px] py-4 pr-5">
                    <Link href={`/vehicles/${v.slug}`} className="block">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverUrl} alt={`${v.make} ${v.model}`} className="aspect-[3/2] w-[148px] object-cover" loading="lazy" />
                      ) : (
                        <span className="block aspect-[3/2] w-[148px] bg-graphite/5" />
                      )}
                    </Link>
                  </td>
                  <td className="min-w-0 py-4 pr-4">
                    <p className="tnum font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-tech">
                      Lot {v.lotNumber}
                      {auction && (
                        <>
                          <span className="mx-2 text-line">·</span>
                          <span className={live ? "text-primary" : "text-muted"}>
                            {live ? <Countdown endsAt={auction.endsAt} /> : scheduled ? "Upcoming" : "Ended"}
                          </span>
                        </>
                      )}
                    </p>
                    <Link
                      href={`/vehicles/${v.slug}`}
                      className="mt-1 block truncate font-display text-[18px] font-medium text-ink transition-colors group-hover:text-primary"
                    >
                      {v.year} {v.make} {v.model}
                    </Link>
                    <p className="mt-1 font-mono text-[11.5px] uppercase tracking-[0.06em] text-muted">
                      {[v.mileage ? `${Math.round(v.mileage / 1000)}k km` : null, v.fuelType, v.transmission, v.locationCity]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </td>
                  <td className="w-[150px] py-4 pr-4 text-right">
                    {price && (
                      <p className="tnum font-mono text-[15px] font-semibold text-ink">{price}</p>
                    )}
                    <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-tech">
                      {live ? "Current bid" : v.buyNowPrice && !auction ? "Buy Now" : scheduled ? "Opening bid" : ""}
                    </p>
                  </td>
                  <td className="w-[140px] py-4">
                    <div className="flex items-center justify-end gap-3">
                      <FavoriteButton vehicleId={v.id} initial isAuthed />
                      <Link
                        href={`/vehicles/${v.slug}`}
                        className="border-b border-ink/40 pb-px font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:border-primary hover:text-primary"
                      >
                        View lot
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <Pagination page={page} perPage={perPage} total={total} params={sp} basePath="/account/favorites" />
    </div>
  );
}
