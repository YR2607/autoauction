import { NextRequest, NextResponse } from "next/server";
import { listVehicles } from "@/features/vehicles/queries";

/**
 * Live match count for the filter panel — same filter semantics as the
 * catalog pages, but only returns the total (perPage=1, no rows needed).
 * `scope` mirrors the page-level base filter: auctions | buy-now.
 */
export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const s = (k: string) => sp.get(k) ?? undefined;
  const n = (k: string) => {
    const v = s(k);
    const num = v ? Number(v) : NaN;
    return Number.isFinite(num) ? num : undefined;
  };

  const scope = s("scope");
  const saleType =
    scope === "auctions" ? "AUCTION" : scope === "buy-now" ? "BUY_NOW" : s("saleType");

  const { total } = listVehicles({
    q: s("q"),
    make: s("make"),
    model: s("model"),
    yearFrom: n("yearFrom"),
    yearTo: n("yearTo"),
    priceMin: n("priceMin") ? n("priceMin")! * 100 : undefined,
    priceMax: n("priceMax") ? n("priceMax")! * 100 : undefined,
    mileageMax: n("mileageMax"),
    fuelType: s("fuelType"),
    transmission: s("transmission"),
    bodyType: s("bodyType"),
    currency: s("currency"),
    saleType,
    auctionStatus: s("auctionStatus"),
    perPage: 1,
  });
  return NextResponse.json({ total });
}
