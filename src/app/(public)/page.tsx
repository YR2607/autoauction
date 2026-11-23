import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { liveAuctionCards } from "@/features/vehicles/queries";
import { ArrowRight } from "iconoir-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const live = liveAuctionCards(3);

  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO — full-bleed editorial photo */}
        <section className="relative overflow-hidden bg-ink text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/seed-images/car-08.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-[center_62%]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(11,12,15,0.88) 0%, rgba(11,12,15,0.62) 45%, rgba(11,12,15,0.18) 100%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pb-28 sm:pt-28">
            <div className="max-w-2xl">
              <h1 className="font-display text-[42px] font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
                A smarter way to buy
                <br />
                and sell vehicles.
              </h1>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-white/75">
                AutoAuction is an online marketplace for carefully selected
                cars: live auctions and fixed-price listings.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/vehicles"
                  className="inline-flex h-12 items-center rounded-md bg-white px-7 text-[15px] font-bold text-ink transition-colors hover:bg-white/85"
                >
                  Explore Vehicles
                </Link>
                <Link
                  href="/#how-it-works"
                  className="inline-flex h-12 items-center rounded-md border border-white/50 px-7 text-[15px] font-bold text-white transition-colors hover:border-white hover:bg-white/10"
                >
                  How It Works
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT — short project intro + three benefits */}
        <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">
                About AutoAuction
              </p>
              <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink">
                A curated marketplace for enthusiast cars.
              </h2>
              <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-graphite/80">
                Every vehicle is listed with detailed photography, a condition
                report and supporting documents. Cars sell through live timed
                auctions or at a fixed price, and every result is reviewed by
                our team before the sale is finalized.
              </p>
            </div>
            <div className="grid gap-px self-start overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
              {[
                {
                  t: "Explore",
                  d: "Browse real inventory with photos, documents and condition details.",
                },
                {
                  t: "Bid",
                  d: "Join live auctions with visible current bids and countdowns.",
                },
                {
                  t: "Purchase",
                  d: "Win an auction or buy instantly. We confirm every deal.",
                },
              ].map((b) => (
                <div key={b.t} className="bg-white p-6">
                  <p className="font-display text-base font-bold text-ink">
                    {b.t}
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                    {b.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURED AUCTIONS — real live inventory */}
        <section className="border-t border-line bg-bg-alt">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">
                  Happening now
                </p>
                <h2 className="mt-1.5 font-display text-[28px] font-extrabold text-ink">
                  Featured auctions
                </h2>
              </div>
              <Link
                href="/auctions"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-ink transition-colors hover:text-primary"
              >
                All auctions <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {live.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center text-sm text-muted">
                No live auctions right now. Check back soon.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {live.map((v) => (
                  <VehicleCard key={v.id} v={v} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* HOW IT WORKS — numbered steps, wide editorial layout */}
        <section id="how-it-works" className="border-t border-line">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">
                  The process
                </p>
                <h2 className="mt-2 font-display text-3xl font-extrabold text-ink">
                  How it works
                </h2>
                <Link
                  href="/vehicles"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-ink underline underline-offset-4 transition-colors hover:text-primary"
                >
                  Browse all vehicles <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <ol className="divide-y divide-line border-y border-line">
                {[
                  {
                    t: "Discover a vehicle",
                    d: "Browse the catalog, inspect photos, documents and condition reports.",
                  },
                  {
                    t: "Bid or buy",
                    d: "Place manual bids in live auctions, or request a fixed-price purchase.",
                  },
                  {
                    t: "Wait for confirmation",
                    d: "Every winning bid and purchase request is reviewed by our team.",
                  },
                  {
                    t: "Complete your purchase",
                    d: "Once approved, our team contacts you to finalize the deal.",
                  },
                ].map((s, i) => (
                  <li
                    key={s.t}
                    className="grid gap-2 py-6 sm:grid-cols-[64px_220px_1fr] sm:items-baseline sm:gap-6"
                  >
                    <span className="tnum font-display text-2xl font-extrabold text-line">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-lg font-bold text-ink">
                      {s.t}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">{s.d}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="border-t border-line bg-ink text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-14 sm:px-6">
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
              Find your next vehicle.
            </h2>
            <Link
              href="/vehicles"
              className="inline-flex h-12 items-center rounded-md bg-white px-7 text-[15px] font-bold text-ink transition-colors hover:bg-white/85"
            >
              Browse the catalog
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter flush />
    </>
  );
}
