import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { myFavorites, myFavoritesCount } from "@/features/account/queries";
import { Pagination } from "@/components/vehicles/pagination";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { EmptyState } from "@/components/ui/empty";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { buyNowAvailable } from "@/features/vehicles/availability";
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
    const v = r.vehicle;
    return {
      id: v.id, slug: v.slug, lotNumber: v.lotNumber, make: v.make, model: v.model,
      trim: v.trim, year: v.year, mileage: v.mileage, fuelType: v.fuelType,
      transmission: v.transmission, locationCity: v.locationCity,
      locationCountry: v.locationCountry, saleType: v.saleType, status: v.status,
      buyNowPrice: v.buyNowPrice, buyNowCurrency: v.buyNowCurrency,
      buyNowAvailable: buyNowAvailable(v, auction), coverUrl: r.coverUrl,
      auction: auction
        ? { id: auction.id, status: auction.status, currency: auction.currency, currentBid: auction.currentBid, startingPrice: auction.startingPrice, bidCount: auction.bidCount, endsAt: auction.endsAt, startsAt: auction.startsAt }
        : null,
    };
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Favorites</h1>
      {items.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No favorites yet"
          body="Tap the heart on any vehicle to keep it here."
          action={<Link href="/vehicles" className="rounded-md bg-cta px-5 py-2.5 text-sm font-semibold text-white">Browse vehicles</Link>}
        />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((v) => (
            <VehicleCard key={v.id} v={v} />
          ))}
        </div>
      )}
      <Pagination page={page} perPage={perPage} total={total} params={sp} basePath="/account/favorites" />
    </div>
  );
}
