import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import {
  liveAuctionCards,
  upcomingAuctionCards,
  completedAuctionCards,
} from "@/features/vehicles/queries";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Auctions" };

export default function AuctionsPage() {
  const live = liveAuctionCards();
  const upcoming = upcomingAuctionCards(8);
  const completed = completedAuctionCards(8);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold">Auctions</h1>
        <p className="mt-1 text-sm text-muted">
          Bid manually in live auctions. Every result is reviewed by our team.
        </p>

        <Block title="Live now" pulse items={live} empty="No live auctions at the moment." />
        <Block title="Upcoming" items={upcoming} empty="No scheduled auctions." />
        <Block title="Recently completed" items={completed} empty="No completed auctions yet." />
      </main>
      <SiteFooter />
    </>
  );
}

function Block({
  title,
  items,
  empty,
  pulse,
}: {
  title: string;
  items: Parameters<typeof VehicleCard>[0]["v"][];
  empty: string;
  pulse?: boolean;
}) {
  return (
    <section className="mt-12">
      <h2 className="mb-6 flex items-center gap-2.5 font-display text-2xl font-extrabold">
        {pulse && items.length > 0 && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-error" />
          </span>
        )}
        {title}
        <span className="text-base font-semibold text-muted">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-line bg-white px-6 py-10 text-center text-sm text-muted">
          {empty}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((v) => (
            <VehicleCard key={v.id} v={v} />
          ))}
        </div>
      )}
    </section>
  );
}
