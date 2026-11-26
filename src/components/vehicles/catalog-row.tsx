import Link from "next/link";
import { formatMoney, type Currency } from "@/lib/currency";
import { Countdown } from "@/components/auctions/countdown";
import type { VehicleCard } from "@/features/vehicles/queries";
import { Gavel, Calendar, Gauge, Fuel, Cog, MapPin } from "lucide-react";

function statusLabel(v: VehicleCard) {
  const a = v.auction;
  if (a?.status === "LIVE") return "LIVE";
  if (a?.status === "SCHEDULED") return "UPCOMING";
  if (a) return "ENDED";
  if (v.status === "SOLD") return "SOLD";
  return null;
}

/**
 * Marketplace list row — photo left, title + spec line middle,
 * countdown and price / buy-now action right. Reference: dense
 * European auction listings. Used on /vehicles, /auctions, /buy-now.
 */
export function CatalogRow({ v }: { v: VehicleCard }) {
  const a = v.auction;
  const live = a?.status === "LIVE";
  const scheduled = a?.status === "SCHEDULED";
  const status = statusLabel(v);
  const price = a
    ? formatMoney(a.currentBid ?? a.startingPrice, a.currency as Currency)
    : v.buyNowPrice != null && v.buyNowCurrency
      ? formatMoney(v.buyNowPrice, v.buyNowCurrency as Currency)
      : null;
  const buyNow =
    v.buyNowAvailable && v.buyNowPrice != null && v.buyNowCurrency
      ? formatMoney(v.buyNowPrice, v.buyNowCurrency as Currency)
      : null;

  return (
    <Link
      href={`/vehicles/${v.slug}`}
      className="group grid grid-cols-[120px_1fr] gap-3 border-b border-[#e2e8f0] bg-white px-4 py-3 transition-colors last:border-b-0 hover:bg-[#f8fafc] sm:grid-cols-[150px_1fr_170px_160px] sm:items-center sm:gap-5"
    >
      {/* photo */}
      <span className="relative block aspect-[3/2] w-[120px] overflow-hidden bg-[#e2e8f0] sm:w-[150px]">
        {v.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.coverUrl}
            alt={`${v.make} ${v.model}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[10px] text-[#94a3b8]">No photo</span>
        )}
        {live && (
          <span className="absolute left-0 top-0 bg-[#cc0000] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
            Live
          </span>
        )}
        {scheduled && (
          <span className="absolute left-0 top-0 bg-[#b45309] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            Upcoming
          </span>
        )}
      </span>

      {/* title + specs */}
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-bold leading-snug text-[#0b3b60] group-hover:underline">
          {v.year} {v.make} {v.model}
          {v.trim ? ` ${v.trim}` : ""}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#475569]">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3 text-[#94a3b8]" /> {v.year}
          </span>
          <span className="inline-flex items-center gap-1">
            <Gauge className="h-3 w-3 text-[#94a3b8]" />{" "}
            {v.mileage != null ? `${v.mileage.toLocaleString("en-US")} mi` : "N/A"}
          </span>
          {v.fuelType && (
            <span className="inline-flex items-center gap-1">
              <Fuel className="h-3 w-3 text-[#94a3b8]" /> {v.fuelType}
            </span>
          )}
          {v.transmission && (
            <span className="inline-flex items-center gap-1">
              <Cog className="h-3 w-3 text-[#94a3b8]" /> {v.transmission}
            </span>
          )}
        </span>
        <span className="mt-1 flex items-center gap-2 text-[10.5px] text-[#94a3b8]">
          <span className="font-mono uppercase tracking-wider">Lot {v.lotNumber}</span>
          {(v.locationCity || v.locationCountry) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {[v.locationCity, v.locationCountry].filter(Boolean).join(", ")}
            </span>
          )}
          {status && status !== "LIVE" && status !== "UPCOMING" && (
            <span className="font-bold uppercase tracking-wider text-[#64748b]">{status}</span>
          )}
        </span>
      </span>

      {/* countdown */}
      <span className="hidden items-center gap-1.5 sm:flex">
        <Gavel className="h-3.5 w-3.5 shrink-0 text-[#64748b]" />
        {live ? (
          <Countdown
            endsAt={a.endsAt}
            className="tnum font-mono text-[13px] font-bold text-[#1e293b]"
          />
        ) : scheduled ? (
          <span className="font-mono text-[12px] font-bold text-[#64748b]">
            Starts{" "}
            {new Date(a.startsAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
        ) : a ? (
          <span className="font-mono text-[12px] font-bold text-[#94a3b8]">Ended</span>
        ) : (
          <span className="font-mono text-[12px] text-[#94a3b8]">—</span>
        )}
      </span>

      {/* price / action */}
      <span className="col-span-2 flex items-center justify-between gap-3 border-t border-[#f1f5f9] pt-2 sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right">
        <span className="block">
          {price && (
            <span className="tnum block text-[16px] font-black text-[#0b3b60]">
              {price}
            </span>
          )}
          <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#94a3b8]">
            {a ? (a.currentBid != null ? "Current bid" : "Starting bid") : "Fixed price"}
            {a ? ` · ${a.bidCount} bid${a.bidCount === 1 ? "" : "s"}` : ""}
          </span>
        </span>
        {buyNow && (
          <span className="mt-0 inline-block bg-[#dbeafe] px-3 py-1.5 text-[11px] font-bold text-[#0b3b60] sm:mt-1.5">
            Buy Now {buyNow}
          </span>
        )}
        {!a && !buyNow && (
          <span className="mt-1 inline-block text-[10.5px] font-bold uppercase tracking-wider text-[#0b3b60] underline">
            View lot
          </span>
        )}
      </span>
    </Link>
  );
}
