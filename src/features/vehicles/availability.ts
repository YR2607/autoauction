import { schema } from "@/lib/db";
import { sql } from "drizzle-orm";

/**
 * Single source of truth for Buy Now availability *presentation*.
 * Mirrors the authoritative server-side rules in
 * `features/auctions/engine.ts → buyNow()` — keep them in sync:
 *
 *  - vehicle is PUBLISHED;
 *  - saleType is BUY_NOW or AUCTION_BUY_NOW with price + currency set;
 *  - if an auction record exists on the vehicle:
 *      - auction currency must equal the Buy Now currency;
 *      - no accepted bid may meet or exceed the Buy Now price;
 *      - auction status must be in the purchasable allowlist
 *        (DRAFT/SCHEDULED/LIVE purchasable — SCHEDULED/LIVE get atomically
 *        closed by the engine; DRAFT/UNSOLD/CANCELLED stay untouched).
 *
 * The engine remains authoritative — this only decides what the UI
 * advertises, never what the server accepts.
 */
export const BUY_NOW_PURCHASABLE_STATES = [
  "DRAFT",
  "SCHEDULED",
  "LIVE",
  "UNSOLD",
  "CANCELLED",
] as const;

type VehicleLike = {
  status: string;
  saleType: string;
  buyNowPrice: number | null;
  buyNowCurrency: string | null;
};

type AuctionLike = {
  status: string;
  currency: string;
  currentBid: number | null;
} | null | undefined;

export function buyNowAvailable(v: VehicleLike, a: AuctionLike): boolean {
  if (v.status !== "PUBLISHED") return false;
  if (v.saleType !== "BUY_NOW" && v.saleType !== "AUCTION_BUY_NOW") return false;
  if (v.buyNowPrice == null || v.buyNowCurrency == null) return false;
  if (!a) return true;
  if (a.currency !== v.buyNowCurrency) return false;
  if (a.currentBid != null && a.currentBid >= v.buyNowPrice) return false;
  return (BUY_NOW_PURCHASABLE_STATES as readonly string[]).includes(a.status);
}

/**
 * SQL twin of {@link buyNowAvailable}, minus the vehicle.status check
 * (callers already filter `vehicles.status = 'PUBLISHED'`). Intended for
 * JOINed queries where `auctions` is LEFT JOINed on vehicle_id.
 */
export const buyNowEligibleSQL = sql`
  ${schema.vehicles.saleType} IN ('BUY_NOW', 'AUCTION_BUY_NOW')
  AND ${schema.vehicles.buyNowPrice} IS NOT NULL
  AND ${schema.vehicles.buyNowCurrency} IS NOT NULL
  AND (
    ${schema.auctions.id} IS NULL
    OR (
      ${schema.auctions.currency} = ${schema.vehicles.buyNowCurrency}
      AND (${schema.auctions.currentBid} IS NULL OR ${schema.auctions.currentBid} < ${schema.vehicles.buyNowPrice})
      AND ${schema.auctions.status} IN ('DRAFT', 'SCHEDULED', 'LIVE', 'UNSOLD', 'CANCELLED')
    )
  )
`;
