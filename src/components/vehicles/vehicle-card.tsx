import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatMoney, type Currency } from "@/lib/currency";
import type { VehicleCard as VC } from "@/features/vehicles/queries";
import { Countdown } from "@/components/auctions/countdown";
import { ArrowRight } from "iconoir-react";

function km(n: number | null) {
  return n == null ? "N/A" : `${n.toLocaleString("en-GB")} km`;
}

export function VehicleCard({ v, featured }: { v: VC; featured?: boolean }) {
  const live = v.auction?.status === "LIVE";
  const scheduled = v.auction?.status === "SCHEDULED";
  // Server-mirrored eligibility — never advertise an unavailable purchase.
  const buyNow = v.buyNowAvailable;

  const specs = [km(v.mileage), v.fuelType ?? "N/A", v.transmission ?? "N/A"].join(" · ");

  return (
    <Link
      href={`/vehicles/${v.slug}`}
      className="group block h-full overflow-hidden rounded-lg border border-line bg-white transition-shadow duration-200 hover:shadow-lift"
    >
      <div
        className={`relative overflow-hidden bg-graphite/5 ${
          featured ? "aspect-[16/9]" : "aspect-[4/3]"
        }`}
      >
        {v.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.coverUrl}
            alt={`${v.make} ${v.model}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No photo
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {live && (
            <Badge tone="live" pulse>
              Live
            </Badge>
          )}
          {scheduled && <Badge tone="neutral">Upcoming</Badge>}
          {buyNow && !live && !scheduled && <Badge tone="dark">Buy Now</Badge>}
          {buyNow && (live || scheduled) && <Badge tone="primary">Buy Now</Badge>}
        </div>
        <span className="absolute bottom-3 left-3 rounded bg-ink/70 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
          Lot {v.lotNumber}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className={`font-display font-bold leading-snug text-ink ${
              featured ? "text-xl" : "text-[15px]"
            }`}
          >
            {v.make} {v.model} {v.trim ?? ""}
          </h3>
          <span className="shrink-0 text-sm font-medium text-muted">{v.year}</span>
        </div>
        <p className="mt-1 text-xs text-muted">{specs}</p>

        <div className="mt-3.5 flex items-end justify-between border-t border-line pt-3">
          {v.auction && (live || scheduled) ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                {v.auction.currentBid != null ? "Current bid" : "Starting at"}
              </p>
              <p
                className={`tnum font-display font-extrabold leading-tight text-ink ${
                  featured ? "text-2xl" : "text-lg"
                }`}
              >
                {formatMoney(
                  v.auction.currentBid ?? v.auction.startingPrice,
                  v.auction.currency as Currency,
                )}
              </p>
              {v.auction.bidCount > 0 && (
                <p className="mt-0.5 text-[11px] font-medium text-muted">
                  {v.auction.bidCount} bids
                </p>
              )}
            </div>
          ) : buyNow ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Price
              </p>
              <p
                className={`tnum font-display font-extrabold leading-tight text-ink ${
                  featured ? "text-2xl" : "text-lg"
                }`}
              >
                {formatMoney(v.buyNowPrice, (v.buyNowCurrency ?? "EUR") as Currency)}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                {v.auction?.currentBid != null ? "Final bid" : "Starting price"}
              </p>
              <p
                className={`tnum font-display font-extrabold leading-tight text-ink ${
                  featured ? "text-2xl" : "text-lg"
                }`}
              >
                {formatMoney(
                  v.auction?.currentBid ?? v.auction?.startingPrice ?? v.buyNowPrice,
                  ((v.auction?.currency ?? v.buyNowCurrency) ?? "EUR") as Currency,
                )}
              </p>
            </div>
          )}
          {live && v.auction ? (
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                Ends in
              </p>
              <Countdown
                endsAt={v.auction.endsAt}
                className="tnum text-sm font-bold text-error"
              />
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-graphite/50 transition-colors group-hover:text-ink">
              View <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
