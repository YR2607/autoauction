import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import {
  liveAuctionCards,
  upcomingAuctionCards,
  completedAuctionCards,
} from "@/features/vehicles/queries";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Live Online Auctions | AutoAuction" };

export default function AuctionsPage() {
  const live = liveAuctionCards();
  const upcoming = upcomingAuctionCards(8);
  const completed = completedAuctionCards(8);

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
        <div className="mb-6 border-b border-[#cbd5e1] pb-4">
          <h1 className="text-2xl font-black uppercase tracking-wider text-[#0b3b60]">
            Online Vehicle Auctions
          </h1>
          <p className="mt-1 text-xs text-[#64748b]">
            Bid manually in real time during live auctions. Every result is reviewed and confirmed by our team.
          </p>
        </div>

        <Block
          title="Live Auctions"
          items={live}
          empty="No live auctions running right now. Check upcoming scheduled auctions below."
        />
        <Block
          title="Upcoming Auctions"
          items={upcoming}
          empty="No scheduled auctions at this time."
        />
        <Block
          title="Closed Auctions"
          items={completed}
          empty="No completed auctions yet."
        />
      </main>

      <SiteFooter />
    </div>
  );
}

function Block({
  title,
  items,
  empty,
}: {
  title: string;
  items: Parameters<typeof VehicleCard>[0]["v"][];
  empty: string;
}) {
  return (
    <section className="mb-6">
      <div className="border border-[#cbd5e1] bg-white rounded-none">
        <div className="flex items-center justify-between border-b-2 border-[#0b3b60] bg-[#f8fafc] px-4 py-2.5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0b3b60]">
            {title}
          </h2>
          <span className="text-xs font-bold text-[#64748b]">
            Total Lots: {items.length}
          </span>
        </div>

        <div className="p-3">
          {items.length === 0 ? (
            <div className="border border-dashed border-[#cbd5e1] p-6 text-center text-xs text-[#64748b]">
              {empty}
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
    </section>
  );
}
