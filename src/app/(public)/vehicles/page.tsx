import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { CatalogLayout } from "@/components/vehicles/catalog-filters";
import { Pagination } from "@/components/vehicles/pagination";
import { listVehicles, filterOptions } from "@/features/vehicles/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vehicle Inventory | Online Auctions & Buy Now" };

export default async function VehiclesPage({
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
    priceMax: n("priceMax") ? n("priceMax")! * 100 : undefined,
    mileageMax: n("mileageMax"),
    fuelType: s("fuelType"),
    transmission: s("transmission"),
    bodyType: s("bodyType"),
    currency: s("currency"),
    saleType: s("saleType"),
    auctionStatus: s("auctionStatus"),
    sort: s("sort"),
    page: n("page") ?? 1,
    perPage: 12,
  });
  const opts = filterOptions();

  return (
    <div className="min-h-screen bg-[#eaedf1] text-[#1e293b]">
      <SiteHeader />

      <div className="border-b border-[#cbd5e1] bg-white py-2">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 sm:px-6 text-xs text-[#64748b]">
          <Link href="/" className="hover:text-[#0b3b60]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-bold text-[#0b3b60]">Vehicle Inventory</span>
          {s("make") && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="font-bold text-[#0b3b60]">{s("make")}</span>
            </>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#cbd5e1] pb-3">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-[#0b3b60]">
              Vehicle Search & Auction Catalog
            </h1>
            <p className="mt-0.5 text-xs text-[#64748b]">
              Live bidding, fixed-price purchases, verified condition reports, and documented history.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0b3b60]">
            <span className="rounded-none bg-[#0b3b60] px-2 py-1 text-white">
              Total Lots: {total}
            </span>
          </div>
        </div>

        <CatalogLayout options={opts} current={sp} total={total}>
          {items.length === 0 ? (
            <div className="rounded-none border border-[#cbd5e1] bg-white p-10 text-center">
              <h3 className="text-base font-bold text-[#0b3b60]">No vehicles match your search criteria</h3>
              <p className="mt-1 text-xs text-[#64748b]">
                Try adjusting your filters, widening the price range, or clearing selected options.
              </p>
              <div className="mt-4">
                <Link
                  href="/vehicles"
                  className="inline-flex rounded-none bg-[#0b3b60] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#072a47]"
                >
                  Clear all filters
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((v) => (
                  <VehicleCard key={v.id} v={v} />
                ))}
              </div>
              <Pagination
                page={page}
                perPage={perPage}
                total={total}
                params={sp}
                basePath="/vehicles"
              />
            </>
          )}
        </CatalogLayout>
      </main>

      <SiteFooter />
    </div>
  );
}
