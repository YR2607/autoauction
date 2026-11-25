import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Countdown } from "@/components/auctions/countdown";
import {
  liveAuctionCards,
  upcomingAuctionCards,
  completedAuctionCards,
} from "@/features/vehicles/queries";
import { formatMoney, type Currency } from "@/lib/currency";
import { ArrowRight } from "iconoir-react";

export const dynamic = "force-dynamic";

const dateFmt = (ms: number) =>
  new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function SectionHead({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-6 border-b-2 border-ink pb-3">
      <div className="flex items-baseline gap-4">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
        <h2 className="text-[22px] font-semibold leading-tight tracking-tight text-ink">
          {title}
        </h2>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-graphite2 transition-colors hover:text-primary"
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const live = liveAuctionCards(4);
  const upcoming = upcomingAuctionCards(4);
  const sold = completedAuctionCards(6);
  const featured = live[0];

  return (
    <>
      <SiteHeader />
      <main className="bg-bg text-ink">
        {/* ── FEATURED LOT — dense light catalog spread ─────────── */}
        <section className="border-b border-line bg-white">
          <div className="mx-auto grid max-w-7xl lg:grid-cols-[58fr_42fr]">
            <div className="relative min-h-[280px] bg-bg-alt sm:min-h-[380px] lg:min-h-[440px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featured?.coverUrl ?? "/seed-images/car-08.jpg"}
                alt={
                  featured
                    ? `${featured.year} ${featured.make} ${featured.model}`
                    : ""
                }
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span className="absolute left-4 top-4 bg-primary px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-white">
                ● Live
              </span>
            </div>

            <div className="flex flex-col border-l border-line bg-white px-6 py-7 sm:px-8">
              {featured ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <p className="tnum font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-tech">
                      Lot {featured.lotNumber} · Featured
                    </p>
                    {featured.auction && (
                      <p className="tnum font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                        {featured.auction.bidCount} bid{featured.auction.bidCount === 1 ? "" : "s"}
                      </p>
                    )}
                  </div>

                  <h1 className="mt-3 text-[30px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[36px]">
                    {featured.year} {featured.make} {featured.model}
                    {featured.trim ? ` ${featured.trim}` : ""}
                  </h1>

                  <p className="mt-2.5 font-mono text-[12px] uppercase tracking-[0.06em] text-muted">
                    {[
                      featured.mileage != null
                        ? `${featured.mileage.toLocaleString("en-GB")} km`
                        : null,
                      featured.fuelType,
                      featured.transmission,
                      [featured.locationCity, featured.locationCountry]
                        .filter(Boolean)
                        .join(", ") || null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>

                  {featured.auction && (
                    <div className="mt-6 flex items-end justify-between gap-6 border-t border-line pt-5">
                      <div>
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-tech">
                          Current bid
                        </p>
                        <p className="tnum mt-1 font-mono text-[36px] font-bold leading-none text-ink">
                          {formatMoney(
                            featured.auction.currentBid ??
                              featured.auction.startingPrice,
                            featured.auction.currency as Currency,
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-tech">
                          Ends in
                        </p>
                        <Countdown
                          endsAt={featured.auction.endsAt}
                          className="tnum mt-1 font-mono text-[26px] font-bold leading-none text-primary"
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/vehicles/${featured.slug}`}
                      className="inline-flex h-11 items-center gap-2 bg-primary px-7 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary-dark"
                    >
                      View lot
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/auctions"
                      className="inline-flex h-11 items-center border border-ink px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-white"
                    >
                      All auctions
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="tnum font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-tech">
                    AutoAuction
                  </p>
                  <h1 className="mt-3 text-[30px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[36px]">
                    Timed vehicle auctions and fixed-price listings.
                  </h1>
                  <p className="mt-3 text-[14px] leading-relaxed text-muted">
                    Every lot with photos and documentation. Every sale reviewed
                    by our team.
                  </p>
                  <Link
                    href="/vehicles"
                    className="mt-6 inline-flex h-11 w-fit items-center gap-2 bg-primary px-7 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary-dark"
                  >
                    Explore vehicles
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── LIVE AUCTIONS — dense catalog rows ────────────────── */}
        <section>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <SectionHead
              eyebrow="Live"
              title="On the block now"
              href="/auctions"
              linkLabel="All auctions"
            />
            {live.length === 0 ? (
              <p className="border border-dashed border-line bg-white px-6 py-10 text-center text-sm text-muted">
                No live auctions right now. Check back soon.
              </p>
            ) : (
              <div className="divide-y divide-line border border-line bg-white">
                {live.map((v) => (
                  <Link
                    key={v.id}
                    href={`/vehicles/${v.slug}`}
                    className="group grid grid-cols-[96px_1fr_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-bg/70 sm:grid-cols-[110px_1fr_auto_auto_auto] sm:gap-6"
                  >
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={v.coverUrl ?? ""}
                        alt={`${v.make} ${v.model}`}
                        className="aspect-[3/2] w-[96px] object-cover sm:w-[110px]"
                        loading="lazy"
                      />
                      <span className="absolute left-0 top-0 bg-primary px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-[0.12em] text-white">
                        Live
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="tnum font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-tech">
                        Lot {v.lotNumber}
                      </p>
                      <p className="mt-0.5 truncate text-[16px] font-semibold tracking-tight text-ink transition-colors group-hover:text-primary">
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="mt-0.5 hidden truncate font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted sm:block">
                        {[
                          v.mileage != null ? `${Math.round(v.mileage / 1000)}k km` : null,
                          v.fuelType,
                          v.transmission,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-tech">
                        Bids
                      </p>
                      <p className="tnum font-mono text-[15px] font-bold text-ink">
                        {v.auction?.bidCount ?? 0}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-tech">
                        Current bid
                      </p>
                      <p className="tnum font-mono text-[17px] font-bold text-ink">
                        {v.auction
                          ? formatMoney(
                              v.auction.currentBid ?? v.auction.startingPrice,
                              v.auction.currency as Currency,
                            )
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-tech">
                        Ends
                      </p>
                      <p className="tnum font-mono text-[13px] font-bold text-primary">
                        {v.auction ? <Countdown endsAt={v.auction.endsAt} /> : "—"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── UPCOMING — compact announcements ──────────────────── */}
        {upcoming.length > 0 && (
          <section className="border-t border-line bg-bg-alt">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
              <SectionHead eyebrow="Upcoming" title="Coming to auction" />
              <div className="divide-y divide-line border border-line bg-white">
                {upcoming.map((v) => (
                  <Link
                    key={v.id}
                    href={`/vehicles/${v.slug}`}
                    className="group grid grid-cols-[88px_1fr_auto] items-center gap-4 px-4 py-2.5 transition-colors hover:bg-bg/70 sm:grid-cols-[110px_1fr_auto_auto] sm:gap-6"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.coverUrl ?? ""}
                      alt={`${v.make} ${v.model}`}
                      className="aspect-[3/2] w-[88px] object-cover sm:w-[110px]"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <p className="tnum font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-tech">
                        Lot {v.lotNumber}
                      </p>
                      <p className="mt-0.5 truncate text-[15.5px] font-semibold tracking-tight text-ink transition-colors group-hover:text-primary">
                        {v.year} {v.make} {v.model}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-tech">
                        Bidding opens
                      </p>
                      <p className="tnum font-mono text-[13px] font-bold text-ink">
                        {v.auction ? dateFmt(v.auction.startsAt) : "—"}
                      </p>
                    </div>
                    <span className="hidden font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-graphite2 transition-colors group-hover:text-primary sm:block">
                      View lot →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── RECENTLY SOLD — archive grid ──────────────────────── */}
        {sold.length > 0 && (
          <section className="border-t border-line">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
              <SectionHead
                eyebrow="Archive"
                title="Recently sold"
                href="/auctions?auctionStatus=ended"
                linkLabel="All results"
              />
              <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
                {sold.map((v) => (
                  <Link
                    key={v.id}
                    href={`/vehicles/${v.slug}`}
                    className="group bg-white p-2.5 transition-colors hover:bg-bg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.coverUrl ?? ""}
                      alt={`${v.make} ${v.model}`}
                      className="aspect-[4/3] w-full object-cover"
                      loading="lazy"
                    />
                    <p className="tnum mt-2 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-tech">
                      Lot {v.lotNumber}
                    </p>
                    <p className="mt-0.5 truncate text-[13.5px] font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-primary">
                      {v.year} {v.make} {v.model}
                    </p>
                    {v.auction?.currentBid != null && (
                      <p className="tnum mt-1 font-mono text-[13px] font-bold text-ink">
                        {formatMoney(v.auction.currentBid, v.auction.currency as Currency)}
                      </p>
                    )}
                    {v.auction?.finalizedAt && (
                      <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-tech">
                        Sold {dateFmt(v.auction.finalizedAt)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── HOW IT WORKS — auction house transaction protocol ─── */}
        <section id="how-it-works" className="border-t border-line bg-bg-alt">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:gap-12">
            <div>
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-primary">
                Protocol
              </p>
              <h2 className="mt-1.5 text-[22px] font-semibold leading-tight tracking-tight text-ink">
                How it works
              </h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                Four stages from lot inspection to transfer.
              </p>
              <Link
                href="/legal/terms"
                className="mt-4 inline-block border-b border-ink/40 pb-px font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-primary hover:text-primary"
              >
                Bidding terms →
              </Link>
            </div>
            <table className="w-full border-t-2 border-ink">
              <tbody>
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
                  <tr key={s.t} className="border-b border-line align-baseline">
                    <td className="w-[64px] py-3 pr-4 font-mono text-[11px] font-bold tracking-[0.14em] text-primary">
                      0{i + 1}
                    </td>
                    <td className="w-[210px] py-3 pr-6 text-[14.5px] font-semibold tracking-tight text-ink">
                      {s.t}
                    </td>
                    <td className="py-3 text-[13px] leading-snug text-muted">
                      {s.d}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── FINAL CTA — compact strip ─────────────────────────── */}
        <section id="about" className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-4 py-8 sm:px-6">
            <div className="flex items-baseline gap-4">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-primary">
                AutoAuction
              </p>
              <h2 className="text-[20px] font-semibold tracking-tight text-ink">
                Find your next vehicle.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/vehicles"
                className="inline-flex h-10 items-center gap-2 bg-primary px-6 font-mono text-[11.5px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary-dark"
              >
                Browse the catalog
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sell"
                className="inline-flex h-10 items-center border border-ink px-6 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-white"
              >
                Sell your car
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter flush />
    </>
  );
}
