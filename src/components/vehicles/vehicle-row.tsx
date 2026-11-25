import Link from "next/link";
import { formatMoney, type Currency } from "@/lib/currency";
import { Gavel } from "@phosphor-icons/react/ssr";
import { Countdown } from "@/components/auctions/countdown";
import { cn } from "@/lib/utils";
import type { VehicleCard } from "@/features/vehicles/queries";

function timeLabel(a: NonNullable<VehicleCard["auction"]>): string {
  if (a.status === "SCHEDULED")
    return `Starts ${new Date(a.startsAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })}`;
  if (a.status !== "LIVE") return "Ended";
  const ms = a.endsAt - Date.now();
  if (ms <= 0) return "Ending soon";
  const d = Math.floor(ms / 864e5);
  const h = Math.floor(ms / 36e5) % 24;
  const m = Math.floor(ms / 6e4) % 60;
  if (d > 0) return `Ends in ${d}d ${h}h`;
  if (h > 0) return `Ends in ${h}h ${m}m`;
  return `Ends in ${m}m`;
}

function StatusBadge({ v }: { v: VehicleCard }) {
  const a = v.auction;
  const label =
    a?.status === "LIVE"
      ? "Live"
      : a?.status === "SCHEDULED"
        ? "Upcoming"
        : v.status === "SOLD"
          ? "Sold"
          : v.status === "RESERVED"
            ? "Reserved"
            : a
              ? "Ended"
              : "Buy Now";
  const live = label === "Live";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]",
        live
          ? "bg-primary/10 text-primary"
          : label === "Buy Now"
            ? "bg-graphite/5 text-ink"
            : "bg-graphite/5 text-muted",
      )}
    >
      {live && <span className="h-1.5 w-1.5 bg-primary" aria-hidden />}
      {label}
    </span>
  );
}

/**
 * Auction-house style list row — photo, lot info and specs on the left,
 * countdown + price + bids stacked on the right. Used on /vehicles and /auctions.
 */
export function VehicleRow({ v }: { v: VehicleCard }) {
  const a = v.auction;
  const price = a
    ? formatMoney(a.currentBid ?? a.startingPrice, a.currency as Currency)
    : v.buyNowPrice != null && v.buyNowCurrency
      ? formatMoney(v.buyNowPrice, v.buyNowCurrency as Currency)
      : null;

  return (
    <Link
      href={`/vehicles/${v.slug}`}
      className="group grid grid-cols-[104px_1fr] gap-x-4 gap-y-3 border border-line bg-white px-4 py-4 shadow-xs transition-colors hover:bg-bg-alt sm:grid-cols-[180px_1fr_156px_190px] sm:border-x-0 sm:border-t-0 sm:shadow-none sm:px-5 sm:py-5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={v.coverUrl ?? ""}
        alt={`${v.make} ${v.model}`}
        className="h-[74px] w-[104px] object-cover sm:h-[118px] sm:w-[180px]"
        loading="lazy"
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="tnum font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-tech">
            Lot {v.lotNumber}
          </span>
          <StatusBadge v={v} />
        </div>
        <h3 className="mt-1.5 truncate font-display text-[17px] font-medium text-ink transition-colors group-hover:text-primary sm:text-[19px]">
          {v.year} {v.make} {v.model}
          {v.trim ? ` ${v.trim}` : ""}
        </h3>
        <p className="mt-1 text-[13px] text-muted">
          {[
            v.mileage != null ? `${v.mileage.toLocaleString("en-GB")} km` : null,
            v.fuelType,
            v.transmission,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {(v.locationCity || v.locationCountry) && (
          <p className="mt-0.5 text-xs text-muted/75">
            {[v.locationCity, v.locationCountry].filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      {/* Timer + price: bottom row on mobile, own columns on desktop */}
      <div className="col-span-2 flex items-center justify-between gap-4 border-t border-line pt-3 sm:contents">
        {a?.status === "LIVE" ? (
          <div className="border border-line bg-bg px-3.5 py-2 sm:self-center sm:justify-self-center">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-tech">
              Ends in
            </p>
            <Countdown
              endsAt={a.endsAt}
              className={cn(
                "tnum font-mono text-[15px] font-semibold leading-tight sm:text-base",
                a.endsAt - Date.now() < 3600_000 ? "text-error" : "text-primary",
              )}
            />
          </div>
        ) : a?.status === "SCHEDULED" ? (
          <div className="border border-line bg-bg px-3.5 py-2 sm:self-center sm:justify-self-center">
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-tech">
              Starts
            </p>
            <p className="tnum font-mono text-[15px] font-semibold leading-tight text-graphite sm:text-base">
              {new Date(a.startsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </p>
          </div>
        ) : a ? (
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-muted sm:self-center sm:justify-self-center">
            <Gavel className="h-3.5 w-3.5" aria-hidden />
            {timeLabel(a)}
          </p>
        ) : (
          <div className="hidden sm:block" aria-hidden />
        )}

        <div className="sm:self-center sm:text-right">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-tech">
            {a ? (a.currentBid != null ? "Current bid" : "Starting bid") : "Fixed price"}
          </p>
          <p className="tnum font-mono text-lg font-semibold text-ink sm:text-xl">
            {price ?? "N/A"}
          </p>
          {a && (
            <p className="text-xs text-muted">
              {a.bidCount} bid{a.bidCount === 1 ? "" : "s"}
            </p>
          )}
          {v.buyNowAvailable && v.buyNowPrice != null && v.buyNowCurrency && a && (
            <p className="mt-1.5 inline-block bg-primary-soft px-2.5 py-1 font-mono text-[11px] font-semibold leading-tight text-primary">
              Buy now {formatMoney(v.buyNowPrice, v.buyNowCurrency as Currency)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
