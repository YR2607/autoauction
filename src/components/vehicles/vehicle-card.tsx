import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatMoney, type Currency } from "@/lib/currency";
import type { VehicleCard as VC } from "@/features/vehicles/queries";
import { Countdown } from "@/components/auctions/countdown";
import { ArrowRight, Gauge, Fuel, Cog } from "lucide-react";

function km(n: number | null) {
  return n == null ? "—" : `${n.toLocaleString("en-GB")} km`;
}

export function VehicleCard({ v }: { v: VC }) {
  const live = v.auction?.status === "LIVE";
  const scheduled = v.auction?.status === "SCHEDULED";
  // Server-mirrored eligibility — never advertise an unavailable purchase.
  const buyNow = v.buyNowAvailable;

  return (
    <Link
      href={`/vehicles/${v.slug}`}
      className="group block overflow-hidden rounded-[14px] border border-line bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-graphite/5">
        {v.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.coverUrl}
            alt={`${v.make} ${v.model}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
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
          {scheduled && <Badge tone="warning">Upcoming</Badge>}
          {buyNow && !live && !scheduled && <Badge tone="dark">Buy Now</Badge>}
          {buyNow && (live || scheduled) && <Badge tone="primary">Buy Now</Badge>}
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          Lot {v.lotNumber}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-[15px] font-bold leading-snug">
            {v.make} {v.model} {v.trim ?? ""}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-muted">{v.year}</span>
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{km(v.mileage)}</span>
          <span className="inline-flex items-center gap-1"><Fuel className="h-3.5 w-3.5" />{v.fuelType ?? "—"}</span>
          <span className="inline-flex items-center gap-1"><Cog className="h-3.5 w-3.5" />{v.transmission ?? "—"}</span>
        </p>

        <div className="mt-3.5 flex items-end justify-between border-t border-line pt-3">
          {v.auction && (live || scheduled) ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {v.auction.currentBid != null ? "Current bid" : "Starting at"}
              </p>
              <p className="tnum font-display text-[19px] font-extrabold leading-tight text-graphite">
                {formatMoney(
                  v.auction.currentBid ?? v.auction.startingPrice,
                  v.auction.currency as Currency,
                )}
              </p>
              {v.auction.bidCount > 0 && (
                <p className="mt-0.5 text-[11px] font-semibold text-muted">{v.auction.bidCount} bids</p>
              )}
            </div>
          ) : buyNow ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Price</p>
              <p className="tnum font-display text-[19px] font-extrabold leading-tight text-graphite">
                {formatMoney(v.buyNowPrice, (v.buyNowCurrency ?? "EUR") as Currency)}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {v.auction?.currentBid != null ? "Final bid" : "Starting price"}
              </p>
              <p className="tnum font-display text-[19px] font-extrabold leading-tight text-graphite">
                {formatMoney(
                  v.auction?.currentBid ?? v.auction?.startingPrice ?? v.buyNowPrice,
                  ((v.auction?.currency ?? v.buyNowCurrency) ?? "EUR") as Currency,
                )}
              </p>
            </div>
          )}
          {live && v.auction ? (
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Ends in</p>
              <Countdown endsAt={v.auction.endsAt} className="tnum text-sm font-bold text-error" />
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
