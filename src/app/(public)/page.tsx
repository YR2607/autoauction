import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { Badge } from "@/components/ui/badge";
import {
  liveAuctionCards,
  upcomingAuctionCards,
  buyNowCards,
  listVehicles,
  distinctMakes,
} from "@/features/vehicles/queries";
import { SearchBar } from "@/components/vehicles/search-bar";
import { Gavel, Zap, ShieldCheck, ArrowRight, Search, BadgeCheck, Handshake } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const live = liveAuctionCards(6);
  const upcoming = upcomingAuctionCards(4);
  const buyNow = buyNowCards(4);
  const featured = listVehicles({ perPage: 4, sort: "newest" }).items;
  const makes = distinctMakes();

  return (
    <>
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden bg-ink text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/seed-images/car-08.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-[center_62%] opacity-45"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, rgba(11,18,32,0.97) 22%, rgba(11,18,32,0.78) 55%, rgba(11,18,32,0.35) 100%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-20">
            <Badge tone="primary" className="border border-white/15 bg-white/10 text-blue-200">
              Online car auctions · Fixed-price sales
            </Badge>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-[56px]">
              Find your next car.
              <br />
              <span className="text-blue-400">Make your move.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-white/70">
              Discover exceptional vehicles and compete in live online auctions —
              or buy instantly at a fixed price.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/auctions"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-[15px] font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark"
              >
                <Gavel className="h-4.5 w-4.5" /> Explore auctions
              </Link>
              <Link
                href="/buy-now"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-bold text-ink transition-colors hover:bg-white/90"
              >
                <Zap className="h-4.5 w-4.5" /> Browse Buy Now cars
              </Link>
            </div>

            <div className="mt-8 max-w-2xl">
              <SearchBar />
            </div>
          </div>
        </section>

        {/* TRUST STRIP */}
        <section className="border-b border-line bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-7 sm:grid-cols-3 sm:px-6">
            {[
              { icon: Search, t: "Curated inventory", d: "Condition details and documents are published with every listing." },
              { icon: BadgeCheck, t: "Reviewed results", d: "Winning bids and purchases confirmed by our team." },
              { icon: Handshake, t: "Guided purchase", d: "We contact you to complete the deal after approval." },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">{f.t}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LIVE AUCTIONS */}
        <Section
          eyebrow="Happening now"
          title="Live auctions"
          href="/auctions"
          hrefLabel="View all auctions"
        >
          <Grid items={live} empty="No live auctions right now — check upcoming ones below." />
        </Section>

        {/* UPCOMING */}
        {upcoming.length > 0 && (
          <Section eyebrow="Starting soon" title="Upcoming auctions" href="/auctions" hrefLabel="All auctions" muted>
            <Grid items={upcoming} />
          </Section>
        )}

        {/* BUY NOW */}
        <Section
          eyebrow="Skip the bidding"
          title="Buy Now"
          href="/buy-now"
          hrefLabel="All fixed-price vehicles"
        >
          <Grid items={buyNow} />
        </Section>

        {/* FEATURED */}
        <Section eyebrow="Hand-picked" title="Latest arrivals" href="/vehicles" hrefLabel="Browse catalog" muted>
          <Grid items={featured} />
        </Section>

        {/* MAKES */}
        {makes.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-2xl font-extrabold">Popular makes</h2>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {makes.map((mk) => (
                <Link
                  key={mk}
                  href={`/vehicles?make=${encodeURIComponent(mk)}`}
                  className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold shadow-xs transition-all hover:border-primary/40 hover:text-primary"
                >
                  {mk}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="bg-ink py-20 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <p className="text-[12px] font-bold uppercase tracking-widest text-blue-300">
              The process
            </p>
            <h2 className="mt-1 font-display text-3xl font-extrabold">How it works</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-4">
              {[
                {
                  icon: Search,
                  t: "Discover a vehicle",
                  d: "Browse the catalog, inspect photos, documents and condition reports.",
                },
                {
                  icon: Gavel,
                  t: "Bid or buy",
                  d: "Place manual bids in live auctions — or request a fixed-price purchase.",
                },
                {
                  icon: ShieldCheck,
                  t: "Wait for confirmation",
                  d: "Every winning bid and purchase request is reviewed by our team.",
                },
                {
                  icon: Handshake,
                  t: "Complete your purchase",
                  d: "Once approved, our team contacts you to finalize the deal.",
                },
              ].map((s, i) => (
                <div key={s.t} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-blue-300">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-white/40">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{s.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Link
                href="/vehicles"
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 hover:text-blue-200"
              >
                Browse all vehicles <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Section({
  eyebrow,
  title,
  href,
  hrefLabel,
  children,
  muted,
}: {
  eyebrow: string;
  title: string;
  href: string;
  hrefLabel: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section className={`${muted ? "bg-white" : ""} py-14`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-widest text-primary">
              {eyebrow}
            </p>
            <h2 className="mt-1 font-display text-3xl font-extrabold">{title}</h2>
          </div>
          <Link
            href={href}
            className="hidden items-center gap-1.5 text-sm font-bold text-graphite/70 hover:text-primary sm:inline-flex"
          >
            {hrefLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}

function Grid({ items, empty }: { items: Parameters<typeof VehicleCard>[0]["v"][]; empty?: string }) {
  if (!items.length)
    return (
      <p className="rounded-[14px] border border-dashed border-line bg-white px-6 py-12 text-center text-sm text-muted">
        {empty ?? "Nothing here yet."}
      </p>
    );
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((v) => (
        <VehicleCard key={v.id} v={v} />
      ))}
    </div>
  );
}
