import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { buyNowCards } from "@/features/vehicles/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Buy It Now | Fixed Price Vehicles | AutoAuction" };

export default function BuyNowPage() {
  const items = buyNowCards();
  return (
    <div className="min-h-screen bg-[#eaedf1] text-[#1e293b]">
      <SiteHeader />

      <div className="border-b border-[#cbd5e1] bg-white py-2">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 sm:px-6 text-xs text-[#64748b]">
          <Link href="/" className="hover:text-[#0b3b60]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-bold text-[#0b3b60]">Buy It Now</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6">
        <div className="mb-6 border-b border-[#cbd5e1] pb-4">
          <h1 className="text-2xl font-black uppercase tracking-wider text-[#051a2e]">
            Buy It Now Vehicles
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Vehicles available for immediate purchase without participating in live auctions. Transparent fixed pricing and quick confirmation.
          </p>
        </div>

        <div className="border border-[#cbd5e1] bg-white rounded-none">
          <div className="flex items-center justify-between border-b-2 border-[#ffb81c] bg-[#f8fafc] px-4 py-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#051a2e]">
              Buy It Now Inventory
            </h2>
            <span className="text-xs font-bold text-[#64748b]">
              Available Lots: {items.length}
            </span>
          </div>

          <div className="p-3">
            {items.length === 0 ? (
              <div className="border border-dashed border-[#cbd5e1] p-8 text-center">
                <h3 className="text-sm font-bold text-[#0b3b60]">No Buy Now vehicles at the moment</h3>
                <p className="mt-1 text-xs text-[#64748b]">
                  New fixed-price listings are added regularly. Check out our live online auctions in the meantime.
                </p>
                <div className="mt-4">
                  <Link
                    href="/auctions"
                    className="inline-flex rounded-none bg-[#0b3b60] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#072a47]"
                  >
                    Go to Live Auctions
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((v) => (
                  <VehicleCard key={v.id} v={v} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
