import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import {
  liveAuctionCards,
  upcomingAuctionCards,
  buyNowCards,
  listVehicles,
  distinctMakes,
} from "@/features/vehicles/queries";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const live = liveAuctionCards(8);
  const upcoming = upcomingAuctionCards(4);
  const buyNow = buyNowCards(4);
  const featured = listVehicles({ perPage: 8, sort: "newest" }).items;
  const makes = distinctMakes();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 25 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-[#eaedf1] text-[#1e293b]">
      <SiteHeader />

      <main>
        <div className="bg-[#07223d] border-b-4 border-[#ffb81c] text-white">
          <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6">
            <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr] items-stretch">
              <div className="border border-[#0b3b60] bg-[#051a2e] p-4">
                <div className="flex items-center justify-between border-b border-[#0b3b60] pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-[#ffb81c]" />
                    <h1 className="text-sm font-bold uppercase tracking-wider text-white">
                      Vehicle Finder
                    </h1>
                  </div>
                  <span className="text-[11px] text-[#86efac] font-bold">
                    Active Catalog
                  </span>
                </div>

                <form action="/vehicles" method="GET" className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#cbd5e1] mb-1">
                        Make
                      </label>
                      <select
                        name="make"
                        defaultValue=""
                        className="h-8 w-full border border-[#0b3b60] bg-[#072a47] px-2 text-xs font-semibold text-white focus:border-[#ffb81c] focus:outline-none"
                      >
                        <option value="">All Makes</option>
                        {makes.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#cbd5e1] mb-1">
                        Sale Type
                      </label>
                      <select
                        name="saleType"
                        defaultValue=""
                        className="h-8 w-full border border-[#0b3b60] bg-[#072a47] px-2 text-xs font-semibold text-white focus:border-[#ffb81c] focus:outline-none"
                      >
                        <option value="">All Types</option>
                        <option value="AUCTION">Live Auction</option>
                        <option value="BUY_NOW">Buy It Now</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#cbd5e1] mb-1">
                        Year From
                      </label>
                      <select
                        name="yearFrom"
                        defaultValue=""
                        className="h-8 w-full border border-[#0b3b60] bg-[#072a47] px-2 text-xs font-semibold text-white focus:border-[#ffb81c] focus:outline-none"
                      >
                        <option value="">Any</option>
                        {years.slice(0, 16).map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#cbd5e1] mb-1">
                        Year To
                      </label>
                      <select
                        name="yearTo"
                        defaultValue=""
                        className="h-8 w-full border border-[#0b3b60] bg-[#072a47] px-2 text-xs font-semibold text-white focus:border-[#ffb81c] focus:outline-none"
                      >
                        <option value="">{currentYear}</option>
                        {years.slice(0, 16).map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold uppercase text-[#cbd5e1] mb-1">
                        Keyword or Lot Number
                      </label>
                      <input
                        type="text"
                        name="q"
                        placeholder="Model, VIN or Lot"
                        className="h-8 w-full border border-[#0b3b60] bg-[#072a47] px-2 text-xs text-white placeholder:text-[#64748b] focus:border-[#ffb81c] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#0b3b60]">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Link
                        href="/vehicles?saleType=BUY_NOW"
                        className="text-[#ffb81c] hover:underline font-bold"
                      >
                        Buy It Now
                      </Link>
                      <span className="text-[#64748b]">|</span>
                      <Link
                        href="/vehicles?auctionStatus=LIVE"
                        className="text-[#fca5a5] hover:underline font-bold"
                      >
                        Live Auctions
                      </Link>
                      <span className="text-[#64748b]">|</span>
                      <Link
                        href="/vehicles"
                        className="text-[#cbd5e1] hover:underline"
                      >
                        All Vehicles
                      </Link>
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-[#ffb81c] px-6 py-2 text-xs font-bold uppercase tracking-wider text-[#051a2e] hover:bg-[#e5a519] cursor-pointer"
                    >
                      Search Vehicles
                    </button>
                  </div>
                </form>
              </div>

              <div className="flex flex-col justify-between border border-[#0b3b60] bg-[#051a2e] p-4 text-white">
                <div>
                  <div className="flex items-center justify-between border-b border-[#0b3b60] pb-2 mb-3">
                    <span className="bg-[#cc0000] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      LIVE BIDDING
                    </span>
                    <span className="text-xs text-[#cbd5e1]">
                      Real Time Auctions
                    </span>
                  </div>

                  <h2 className="text-base font-bold uppercase text-white">
                    Live Online Vehicle Auctions
                  </h2>
                  <p className="mt-1 text-xs text-[#94a3b8]">
                    Bid in real time on active vehicle inventory or purchase directly through Buy It Now.
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#072a47] p-2 border border-[#0b3b60]">
                      <span className="block text-[10px] text-[#94a3b8] uppercase">
                        Live Lots:
                      </span>
                      <span className="text-sm font-bold text-[#ffb81c]">
                        {live.length} Active
                      </span>
                    </div>
                    <div className="bg-[#072a47] p-2 border border-[#0b3b60]">
                      <span className="block text-[10px] text-[#94a3b8] uppercase">
                        Scheduled:
                      </span>
                      <span className="text-sm font-bold text-white">
                        {upcoming.length} Upcoming
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/auctions"
                    className="bg-[#0b3b60] py-1.5 text-center text-xs font-bold uppercase tracking-wider text-white hover:bg-[#072a47] border border-[#0b3b60]"
                  >
                    View Auctions
                  </Link>
                  <Link
                    href="/buy-now"
                    className="bg-[#ffb81c] py-1.5 text-center text-xs font-bold uppercase tracking-wider text-[#051a2e] hover:bg-[#e5a519]"
                  >
                    Buy It Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-[#cbd5e1] bg-white py-2">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 sm:px-6 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0b3b60] uppercase">
                Categories:
              </span>
              <div className="flex flex-wrap items-center gap-2 font-semibold text-[#0b3b60]">
                <Link href="/vehicles?bodyType=Sedan" className="hover:underline">
                  Sedans
                </Link>
                <span className="text-[#cbd5e1]">|</span>
                <Link href="/vehicles?bodyType=SUV" className="hover:underline">
                  SUVs
                </Link>
                <span className="text-[#cbd5e1]">|</span>
                <Link href="/vehicles?bodyType=Coupe" className="hover:underline">
                  Coupes
                </Link>
                <span className="text-[#cbd5e1]">|</span>
                <Link href="/vehicles?fuelType=Electric" className="hover:underline">
                  Electric
                </Link>
                <span className="text-[#cbd5e1]">|</span>
                <Link href="/vehicles?saleType=BUY_NOW" className="hover:underline text-[#b45309] font-bold">
                  Buy It Now
                </Link>
                <span className="text-[#cbd5e1]">|</span>
                <Link href="/vehicles?auctionStatus=LIVE" className="hover:underline text-[#cc0000] font-bold">
                  Live Auctions
                </Link>
              </div>
            </div>
            <Link href="/vehicles" className="font-bold text-[#0b3b60] hover:underline">
              View All Inventory
            </Link>
          </div>
        </div>

        <section className="mx-auto max-w-7xl px-3 sm:px-6 pt-5 pb-2">
          <div className="border border-[#cbd5e1] bg-white">
            <div className="flex items-center justify-between border-b-2 border-[#0b3b60] bg-[#f8fafc] px-4 py-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0b3b60]">
                Live Auctions
              </h2>
              <Link
                href="/auctions"
                className="text-xs font-bold text-[#0b3b60] hover:underline"
              >
                View All ({live.length})
              </Link>
            </div>

            <div className="p-3">
              {live.length === 0 ? (
                <div className="border border-dashed border-[#cbd5e1] p-4 text-center text-xs text-[#64748b]">
                  No live auctions active right now.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {live.map((v) => (
                    <VehicleCard key={v.id} v={v} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {buyNow.length > 0 && (
          <section className="mx-auto max-w-7xl px-3 sm:px-6 py-2">
            <div className="border border-[#cbd5e1] bg-white">
              <div className="flex items-center justify-between border-b-2 border-[#ffb81c] bg-[#f8fafc] px-4 py-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#051a2e]">
                  Buy It Now
                </h2>
                <Link
                  href="/buy-now"
                  className="text-xs font-bold text-[#0b3b60] hover:underline"
                >
                  View All ({buyNow.length})
                </Link>
              </div>

              <div className="p-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {buyNow.map((v) => (
                    <VehicleCard key={v.id} v={v} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="mx-auto max-w-7xl px-3 sm:px-6 py-2">
            <div className="border border-[#cbd5e1] bg-white">
              <div className="flex items-center justify-between border-b-2 border-[#0b3b60] bg-[#f8fafc] px-4 py-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0b3b60]">
                  Upcoming Auctions
                </h2>
                <Link
                  href="/auctions"
                  className="text-xs font-bold text-[#0b3b60] hover:underline"
                >
                  Auction Calendar
                </Link>
              </div>

              <div className="p-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {upcoming.map((v) => (
                    <VehicleCard key={v.id} v={v} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-3 sm:px-6 py-2">
          <div className="border border-[#cbd5e1] bg-white">
            <div className="flex items-center justify-between border-b-2 border-[#64748b] bg-[#f8fafc] px-4 py-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#1e293b]">
                Featured Inventory
              </h2>
              <Link
                href="/vehicles"
                className="text-xs font-bold text-[#0b3b60] hover:underline"
              >
                All Inventory ({featured.length})
              </Link>
            </div>

            <div className="p-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featured.map((v) => (
                  <VehicleCard key={v.id} v={v} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {makes.length > 0 && (
          <section className="mx-auto max-w-7xl px-3 sm:px-6 py-2">
            <div className="border border-[#cbd5e1] bg-white p-3.5">
              <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-1.5 mb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b3b60]">
                  Popular Makes
                </h3>
                <Link href="/vehicles" className="text-xs font-bold text-[#0b3b60] hover:underline">
                  All Makes
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                {makes.map((mk) => (
                  <Link
                    key={mk}
                    href={`/vehicles?make=${encodeURIComponent(mk)}`}
                    className="font-bold text-[#0b3b60] hover:underline"
                  >
                    {mk}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="how-it-works" className="border-t border-[#cbd5e1] bg-[#07223d] py-6 text-white mt-5">
          <div className="mx-auto max-w-7xl px-3 sm:px-6">
            <div className="border-b border-white/10 pb-2 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                How to Buy
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="border border-[#0b3b60] bg-[#051a2e] p-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#ffb81c]">Step 1</span>
                <h3 className="mt-1 font-bold uppercase text-white">Register</h3>
                <p className="mt-1 text-[#94a3b8] text-[11px]">
                  Create an account to access bidding and vehicle inspection records.
                </p>
              </div>

              <div className="border border-[#0b3b60] bg-[#051a2e] p-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#ffb81c]">Step 2</span>
                <h3 className="mt-1 font-bold uppercase text-white">Find and Inspect</h3>
                <p className="mt-1 text-[#94a3b8] text-[11px]">
                  Review photos, vehicle reports, VIN status, and titles.
                </p>
              </div>

              <div className="border border-[#0b3b60] bg-[#051a2e] p-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#ffb81c]">Step 3</span>
                <h3 className="mt-1 font-bold uppercase text-white">Bid or Buy</h3>
                <p className="mt-1 text-[#94a3b8] text-[11px]">
                  Place live bids during auctions or select Buy It Now.
                </p>
              </div>

              <div className="border border-[#0b3b60] bg-[#051a2e] p-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#ffb81c]">Step 4</span>
                <h3 className="mt-1 font-bold uppercase text-white">Pay and Pickup</h3>
                <p className="mt-1 text-[#94a3b8] text-[11px]">
                  Complete payment and arrange vehicle pickup or delivery.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
