import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatMoney, type Currency } from "@/lib/currency";
import type { VehicleCard as VC } from "@/features/vehicles/queries";
import { Countdown } from "@/components/auctions/countdown";

function km(n: number | null) {
  return n == null ? "—" : `${n.toLocaleString("en-GB")} km`;
}

export function VehicleCard({ v }: { v: VC }) {
  const live = v.auction?.status === "LIVE";
  return (
    <Link
      href={`/vehicles/${v.slug}`}
      className="group block overflow-hidden rounded-[14px] border border-line bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(16,24,40,0.18)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-graphite/5">
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
          {v.auction?.status === "SCHEDULED" && <Badge tone="warning">Upcoming</Badge>}
          {(v.saleType === "BUY_NOW" || v.saleType === "AUCTION_BUY_NOW") &&
            v.buyNowPrice != null && <Badge tone="dark">Buy Now</Badge>}
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
        <p className="mt-1 text-xs text-muted">
          {km(v.mileage)} · {v.fuelType ?? "—"} · {v.transmission ?? "—"}
        </p>
        {v.locationCity && (
          <p className="mt-0.5 text-xs text-muted">
            {v.locationCity}, {v.locationCountry}
          </p>
        )}

        <div className="mt-3 flex items-end justify-between border-t border-line pt-3">
          {v.auction && (live || v.auction.status === "SCHEDULED") ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {v.auction.currentBid != null ? "Current bid" : "Starting at"}
              </p>
              <p className="font-display text-lg font-extrabold text-graphite">
                {formatMoney(
                  v.auction.currentBid ?? v.auction.startingPrice,
                  v.auction.currency as Currency,
                )}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Price
              </p>
              <p className="font-display text-lg font-extrabold text-graphite">
                {formatMoney(v.buyNowPrice, (v.buyNowCurrency ?? "EUR") as Currency)}
              </p>
            </div>
          )}
          {live && v.auction && (
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Ends in
              </p>
              <Countdown endsAt={v.auction.endsAt} className="text-sm font-bold text-error" />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
