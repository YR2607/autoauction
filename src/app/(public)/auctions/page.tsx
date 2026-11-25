import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { VehicleRow } from "@/components/vehicles/vehicle-row";
import { CatalogLayout } from "@/components/vehicles/catalog-filters";
import { Pagination } from "@/components/vehicles/pagination";
import { EmptyState } from "@/components/ui/empty";
import { listVehicles, filterOptions } from "@/features/vehicles/queries";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Auctions" };

export default async function AuctionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const n = (k: string) => {
    const v = s(k);
    const num = v ? Number(v) : NaN;
    return Number.isFinite(num) ? num : undefined;
  };

  const { items, total, page, perPage } = listVehicles({
    q: s("q"),
    make: s("make"),
    model: s("model"),
    yearFrom: n("yearFrom"),
    yearTo: n("yearTo"),
    priceMin: n("priceMin") ? n("priceMin")! * 100 : undefined,
    priceMax: n("priceMax") ? n("priceMax")! * 100 : undefined,
    mileageMax: n("mileageMax"),
    fuelType: s("fuelType"),
    transmission: s("transmission"),
    bodyType: s("bodyType"),
    currency: s("currency"),
    saleType: "AUCTION", // this page lists auction inventory only
    auctionStatus: s("auctionStatus"),
    sort: s("sort") ?? "ending_soon",
    page: n("page") ?? 1,
    perPage: 12,
  });
  const opts = filterOptions();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-7">
          <h1 className="font-display text-3xl font-extrabold text-ink">
            {s("auctionStatus") === "ended" ? "Auction results" : "Auctions"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {s("auctionStatus") === "ended"
              ? "Archive of completed auctions — final bids and outcomes."
              : "Live timed auctions. Bid in real time. Every result is reviewed by our team."}
          </p>
        </div>

        <CatalogLayout options={opts} current={sp} total={total} basePath="/auctions">
          {items.length === 0 ? (
            <EmptyState
              title="No auctions match your filters"
              body="Try widening the price range or clearing some filters."
            />
          ) : (
            <>
              <div className="space-y-3 sm:space-y-0 sm:overflow-hidden sm:rounded-lg sm:border sm:border-line sm:bg-white">
                {items.map((v) => (
                  <VehicleRow key={v.id} v={v} />
                ))}
              </div>
              <Pagination
                page={page}
                perPage={perPage}
                total={total}
                params={sp}
                basePath="/auctions"
              />
            </>
          )}
        </CatalogLayout>
      </main>
      <SiteFooter />
    </>
  );
}
