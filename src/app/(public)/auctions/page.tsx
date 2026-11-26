import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CatalogRow } from "@/components/vehicles/catalog-row";
import { CatalogLayout } from "@/components/vehicles/catalog-filters";
import { Pagination } from "@/components/vehicles/pagination";
import { listVehicles, filterOptions } from "@/features/vehicles/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Live Online Auctions | AutoAuction" };

const STATUS_TITLES: Record<string, string> = {
  LIVE: "Live Auctions",
  SCHEDULED: "Upcoming Auctions",
  ended: "Auction Results",
};

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

  const auctionStatus = s("auctionStatus");
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
    saleType: "AUCTION",
    auctionStatus,
    sort: s("sort") ?? "ending_soon",
    page: n("page") ?? 1,
    perPage: 12,
  });
  const opts = filterOptions();
  const title = (auctionStatus && STATUS_TITLES[auctionStatus]) || "Online Vehicle Auctions";

  return (
    <div className="min-h-screen bg-[#eaedf1] text-[#1e293b]">
      <SiteHeader />

      <div className="border-b border-[#cbd5e1] bg-white py-2">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 sm:px-6 text-xs text-[#64748b]">
          <Link href="/" className="hover:text-[#0b3b60]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-bold text-[#0b3b60]">Auctions</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        <div className="mb-4 border-b border-[#cbd5e1] pb-3">
          <h1 className="text-2xl font-black uppercase tracking-wider text-[#0b3b60]">
            {title}
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Bid manually in real time during live auctions. Every result is reviewed and confirmed by our team.
          </p>
        </div>

        <CatalogLayout options={opts} current={sp} total={total} basePath="/auctions" hideQuickToggles>
          {items.length === 0 ? (
            <div className="rounded-none border border-[#cbd5e1] bg-white p-10 text-center">
              <h3 className="text-base font-bold text-[#0b3b60]">No auctions match your criteria</h3>
              <p className="mt-1 text-xs text-[#64748b]">
                Try widening the filters or check upcoming scheduled auctions.
              </p>
              <div className="mt-4">
                <Link
                  href="/auctions"
                  className="inline-flex rounded-none bg-[#0b3b60] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#072a47]"
                >
                  Clear all filters
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="border border-[#cbd5e1] bg-white">
                {items.map((v) => (
                  <CatalogRow key={v.id} v={v} />
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
    </div>
  );
}
