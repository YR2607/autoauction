import Link from "next/link";
import { formatMoney, type Currency } from "@/lib/currency";
import type { VehicleCard as VC } from "@/features/vehicles/queries";
import { Countdown } from "@/components/auctions/countdown";

function formatLotNumber(num: string) {
  return num.replace(/[^0-9]/g, "") || num.replace(/-/g, " ");
}

function formatMiles(n: number | null) {
  return n == null ? "N/A" : `${n.toLocaleString("en-US")} mi`;
}

export function VehicleCard({ v }: { v: VC }) {
  const live = v.auction?.status === "LIVE";
  const scheduled = v.auction?.status === "SCHEDULED";
  const buyNow = v.buyNowAvailable;
  const cleanLotNum = formatLotNumber(v.lotNumber);

  return (
    <div className="flex flex-col justify-between border border-[#cbd5e1] bg-white text-[#1e293b]">
      <div>
        <div className="flex items-center justify-between border-b border-[#cbd5e1] bg-[#f8fafc] px-3 py-1.5 text-xs">
          <span className="font-bold text-[#0b3b60]">
            Lot {cleanLotNum}
          </span>
          <div className="flex items-center gap-1.5">
            {live && (
              <span className="bg-[#cc0000] text-white px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                LIVE
              </span>
            )}
            {scheduled && (
              <span className="bg-[#b45309] text-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                UPCOMING
              </span>
            )}
            {buyNow && (
              <span className="bg-[#0b3b60] text-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                BUY NOW
              </span>
            )}
          </div>
        </div>

        <Link href={`/vehicles/${v.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-[#e2e8f0]">
          {v.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={v.coverUrl}
              alt={`${v.make} ${v.model}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#94a3b8]">
              No photo available
            </div>
          )}
        </Link>

        <div className="p-3">
          <h3 className="font-bold text-sm leading-snug text-[#0b3b60] hover:underline">
            <Link href={`/vehicles/${v.slug}`}>
              {v.year} {v.make} {v.model} {v.trim ?? ""}
            </Link>
          </h3>

          <div className="mt-2.5 space-y-1 border-t border-[#f1f5f9] pt-2 text-xs text-[#475569]">
            <div className="flex justify-between">
              <span className="text-[#64748b]">Odometer:</span>
              <span className="font-bold text-[#1e293b]">{formatMiles(v.mileage)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Engine:</span>
              <span className="text-[#1e293b]">{v.fuelType ?? "Gasoline"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Transmission:</span>
              <span className="text-[#1e293b]">{v.transmission ?? "Automatic"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#cbd5e1] bg-[#f8fafc] p-3 text-xs">
        {v.auction && (live || scheduled) ? (
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-bold uppercase text-[#64748b]">
                {v.auction.currentBid != null ? "Current Bid:" : "Starting Bid:"}
              </span>
              <span className="tnum font-bold text-base text-[#0b3b60]">
                {formatMoney(
                  v.auction.currentBid ?? v.auction.startingPrice,
                  v.auction.currency as Currency,
                )}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[#64748b]">
              <span>{v.auction.bidCount} {v.auction.bidCount === 1 ? "bid" : "bids"}</span>
              {live && (
                <div className="font-bold text-[#cc0000]">
                  <Countdown endsAt={v.auction.endsAt} className="tnum" />
                </div>
              )}
            </div>
          </div>
        ) : buyNow ? (
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-bold uppercase text-[#64748b]">
                Buy It Now:
              </span>
              <span className="tnum font-bold text-base text-[#0b3b60]">
                {formatMoney(v.buyNowPrice, (v.buyNowCurrency ?? "EUR") as Currency)}
              </span>
            </div>
            <p className="text-[11px] font-bold text-[#15803d]">Fixed Price</p>
          </div>
        ) : (
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-bold uppercase text-[#64748b]">
                Estimated Value:
              </span>
              <span className="tnum font-bold text-base text-[#0b3b60]">
                {formatMoney(
                  v.auction?.currentBid ?? v.auction?.startingPrice ?? v.buyNowPrice,
                  ((v.auction?.currency ?? v.buyNowCurrency) ?? "EUR") as Currency,
                )}
              </span>
            </div>
          </div>
        )}

        <div className="mt-2.5">
          {live ? (
            <Link
              href={`/vehicles/${v.slug}`}
              className="block w-full bg-[#0b3b60] py-2 text-center text-xs font-bold uppercase tracking-wider text-white hover:bg-[#072a47]"
            >
              Bid Now
            </Link>
          ) : buyNow ? (
            <Link
              href={`/vehicles/${v.slug}`}
              className="block w-full bg-[#ffb81c] py-2 text-center text-xs font-bold uppercase tracking-wider text-[#051a2e] hover:bg-[#e5a519]"
            >
              Buy It Now
            </Link>
          ) : (
            <Link
              href={`/vehicles/${v.slug}`}
              className="block w-full border border-[#cbd5e1] bg-white py-2 text-center text-xs font-bold uppercase tracking-wider text-[#0b3b60] hover:bg-[#f1f5f9]"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
