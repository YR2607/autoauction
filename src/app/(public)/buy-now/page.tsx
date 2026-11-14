import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { EmptyState } from "@/components/ui/empty";
import { buyNowCards } from "@/features/vehicles/queries";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Buy Now" };

export default function BuyNowPage() {
  const items = buyNowCards();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold">Buy Now</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Fixed-price vehicles — purchase instantly without bidding. Your request is
          confirmed by our team before completion.
        </p>
        {items.length === 0 ? (
          <EmptyState
            className="mt-10"
            title="No Buy Now vehicles right now"
            body="New fixed-price listings appear regularly. Check live auctions in the meantime."
          />
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((v) => (
              <VehicleCard key={v.id} v={v} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
