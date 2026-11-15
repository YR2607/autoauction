import { db, schema } from "@/lib/db";
import { and, desc, asc, eq, gte, lte, like, inArray, sql, type SQL } from "drizzle-orm";
import { buyNowAvailable, buyNowEligibleSQL } from "./availability";

export type VehicleCard = {
  id: string;
  slug: string;
  lotNumber: string;
  make: string;
  model: string;
  trim: string | null;
  year: number;
  mileage: number | null;
  fuelType: string | null;
  transmission: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  saleType: string;
  status: string;
  buyNowPrice: number | null;
  buyNowCurrency: string | null;
  /** Server-mirrored Buy Now eligibility (see features/vehicles/availability). */
  buyNowAvailable: boolean;
  coverUrl: string | null;
  auction: {
    id: string;
    status: string;
    currency: string;
    currentBid: number | null;
    startingPrice: number;
    bidCount: number;
    endsAt: number;
    startsAt: number;
  } | null;
};

const cardSelect = {
  vehicle: schema.vehicles,
  coverUrl: schema.vehicleImages.url,
  auction: schema.auctions,
};

function mapCard(r: {
  vehicle: typeof schema.vehicles.$inferSelect;
  coverUrl: string | null;
  auction: typeof schema.auctions.$inferSelect | null;
}): VehicleCard {
  const v = r.vehicle;
  return {
    id: v.id,
    slug: v.slug,
    lotNumber: v.lotNumber,
    make: v.make,
    model: v.model,
    trim: v.trim,
    year: v.year,
    mileage: v.mileage,
    fuelType: v.fuelType,
    transmission: v.transmission,
    locationCity: v.locationCity,
    locationCountry: v.locationCountry,
    saleType: v.saleType,
    status: v.status,
    buyNowPrice: v.buyNowPrice,
    buyNowCurrency: v.buyNowCurrency,
    buyNowAvailable: buyNowAvailable(v, r.auction),
    coverUrl: r.coverUrl,
    auction: r.auction
      ? {
          id: r.auction.id,
          status: r.auction.status,
          currency: r.auction.currency,
          currentBid: r.auction.currentBid,
          startingPrice: r.auction.startingPrice,
          bidCount: r.auction.bidCount,
          endsAt: r.auction.endsAt,
          startsAt: r.auction.startsAt,
        }
      : null,
  };
}

const coverJoin = () =>
  sql<string | null>`(SELECT url FROM vehicle_images vi WHERE vi.vehicle_id = ${schema.vehicles.id} ORDER BY vi.is_cover DESC, vi.sort_order ASC LIMIT 1)`;

export type CatalogFilters = {
  q?: string;
  make?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  priceMax?: number; // minor units
  mileageMax?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  currency?: string;
  saleType?: string; // BUY_NOW | AUCTION | AUCTION_BUY_NOW
  auctionStatus?: string; // LIVE | SCHEDULED | ended
  sort?: string; // newest | price_asc | price_desc | ending_soon | highest_bid
  page?: number;
  perPage?: number;
};

export function listVehicles(f: CatalogFilters) {
  const conds: SQL[] = [eq(schema.vehicles.status, "PUBLISHED")];

  if (f.q) {
    const like_ = `%${f.q}%`;
    conds.push(
      sql`(${schema.vehicles.make} LIKE ${like_} OR ${schema.vehicles.model} LIKE ${like_} OR ${schema.vehicles.lotNumber} LIKE ${like_})`,
    );
  }
  if (f.make) conds.push(eq(schema.vehicles.make, f.make));
  if (f.model) conds.push(eq(schema.vehicles.model, f.model));
  if (f.yearFrom) conds.push(gte(schema.vehicles.year, f.yearFrom));
  if (f.yearTo) conds.push(lte(schema.vehicles.year, f.yearTo));
  if (f.mileageMax) conds.push(lte(schema.vehicles.mileage, f.mileageMax));
  if (f.fuelType) conds.push(eq(schema.vehicles.fuelType, f.fuelType));
  if (f.transmission) conds.push(eq(schema.vehicles.transmission, f.transmission));
  if (f.bodyType) conds.push(eq(schema.vehicles.bodyType, f.bodyType));
  if (f.saleType === "BUY_NOW") {
    conds.push(buyNowEligibleSQL);
  } else if (f.saleType === "AUCTION") {
    conds.push(inArray(schema.vehicles.saleType, ["AUCTION", "AUCTION_BUY_NOW"]));
  } else if (f.saleType) {
    conds.push(eq(schema.vehicles.saleType, f.saleType as never));
  }
  if (f.currency)
    conds.push(
      sql`COALESCE(${schema.auctions.currency}, ${schema.vehicles.buyNowCurrency}) = ${f.currency}`,
    );
  if (f.auctionStatus === "LIVE") conds.push(eq(schema.auctions.status, "LIVE"));
  if (f.auctionStatus === "SCHEDULED") conds.push(eq(schema.auctions.status, "SCHEDULED"));

  // Display-price semantics — must match VehicleCard:
  // live/upcoming auction → auction price; else eligible Buy Now → fixed
  // price; else last-known auction price, then fixed price.
  const priceExpr = sql`CASE
    WHEN ${schema.auctions.status} IN ('LIVE', 'SCHEDULED')
      THEN COALESCE(${schema.auctions.currentBid}, ${schema.auctions.startingPrice})
    WHEN ${buyNowEligibleSQL} THEN ${schema.vehicles.buyNowPrice}
    ELSE COALESCE(${schema.auctions.currentBid}, ${schema.auctions.startingPrice}, ${schema.vehicles.buyNowPrice})
  END`;
  if (f.priceMax) conds.push(lte(priceExpr, f.priceMax));

  const order =
    f.sort === "price_asc"
      ? asc(priceExpr)
      : f.sort === "price_desc"
        ? desc(priceExpr)
        : f.sort === "ending_soon"
          ? asc(sql`CASE WHEN ${schema.auctions.status} = 'LIVE' THEN ${schema.auctions.endsAt} ELSE 9999999999999 END`)
          : f.sort === "highest_bid"
            ? desc(sql`COALESCE(${schema.auctions.currentBid}, 0)`)
            : desc(schema.vehicles.createdAt);

  const page = Math.max(1, f.page ?? 1);
  const perPage = Math.min(48, Math.max(1, f.perPage ?? 12));

  const rows = db
    .select({
      vehicle: schema.vehicles,
      coverUrl: coverJoin().as("cover_url"),
      auction: schema.auctions,
    })
    .from(schema.vehicles)
    .leftJoin(schema.auctions, eq(schema.auctions.vehicleId, schema.vehicles.id))
    .where(and(...conds))
    .orderBy(order)
    .limit(perPage)
    .offset((page - 1) * perPage)
    .all();

  const total =
    db
      .select({ c: sql<number>`count(*)` })
      .from(schema.vehicles)
      .leftJoin(schema.auctions, eq(schema.auctions.vehicleId, schema.vehicles.id))
      .where(and(...conds))
      .get()?.c ?? 0;

  return { items: rows.map(mapCard), total, page, perPage };
}

export function getVehicleBySlug(slug: string) {
  const row = db
    .select({ vehicle: schema.vehicles, auction: schema.auctions })
    .from(schema.vehicles)
    .leftJoin(schema.auctions, eq(schema.auctions.vehicleId, schema.vehicles.id))
    .where(eq(schema.vehicles.slug, slug))
    .get();
  if (!row) return null;
  const images = db
    .select()
    .from(schema.vehicleImages)
    .where(eq(schema.vehicleImages.vehicleId, row.vehicle.id))
    .orderBy(desc(schema.vehicleImages.isCover), asc(schema.vehicleImages.sortOrder))
    .all();
  const docs = db
    .select({ id: schema.vehicleDocuments.id, title: schema.vehicleDocuments.title, kind: schema.vehicleDocuments.kind })
    .from(schema.vehicleDocuments)
    .where(
      and(
        eq(schema.vehicleDocuments.vehicleId, row.vehicle.id),
        eq(schema.vehicleDocuments.isPublic, true),
      ),
    )
    .all()
    .map((d) => ({ ...d, url: `/api/documents/${d.id}` }));
  return { ...row, images, docs };
}

export function similarVehicles(vehicleId: string, make: string, limit = 4) {
  const rows = db
    .select({
      vehicle: schema.vehicles,
      coverUrl: coverJoin().as("cover_url"),
      auction: schema.auctions,
    })
    .from(schema.vehicles)
    .leftJoin(schema.auctions, eq(schema.auctions.vehicleId, schema.vehicles.id))
    .where(
      and(
        eq(schema.vehicles.status, "PUBLISHED"),
        eq(schema.vehicles.make, make),
        sql`${schema.vehicles.id} != ${vehicleId}`,
      ),
    )
    .limit(limit)
    .all();
  return rows.map(mapCard);
}

export function liveAuctionCards(limit?: number) {
  const rows = db
    .select({
      vehicle: schema.vehicles,
      coverUrl: coverJoin().as("cover_url"),
      auction: schema.auctions,
    })
    .from(schema.auctions)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.auctions.vehicleId))
    .where(eq(schema.auctions.status, "LIVE"))
    .orderBy(asc(schema.auctions.endsAt))
    .limit(limit ?? 100)
    .all();
  return rows.map(mapCard);
}

export function upcomingAuctionCards(limit = 8) {
  const rows = db
    .select({
      vehicle: schema.vehicles,
      coverUrl: coverJoin().as("cover_url"),
      auction: schema.auctions,
    })
    .from(schema.auctions)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.auctions.vehicleId))
    .where(eq(schema.auctions.status, "SCHEDULED"))
    .orderBy(asc(schema.auctions.startsAt))
    .limit(limit)
    .all();
  return rows.map(mapCard);
}

export function completedAuctionCards(limit = 8) {
  const rows = db
    .select({
      vehicle: schema.vehicles,
      coverUrl: coverJoin().as("cover_url"),
      auction: schema.auctions,
    })
    .from(schema.auctions)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.auctions.vehicleId))
    .where(
      inArray(schema.auctions.status, [
        "AWAITING_ADMIN_APPROVAL",
        "SOLD",
        "UNSOLD",
        "CANCELLED",
      ]),
    )
    .orderBy(desc(schema.auctions.finalizedAt))
    .limit(limit)
    .all();
  return rows.map(mapCard);
}

export function buyNowCards(limit?: number) {
  const rows = db
    .select({
      vehicle: schema.vehicles,
      coverUrl: coverJoin().as("cover_url"),
      auction: schema.auctions,
    })
    .from(schema.vehicles)
    .leftJoin(schema.auctions, eq(schema.auctions.vehicleId, schema.vehicles.id))
    .where(
      and(
        eq(schema.vehicles.status, "PUBLISHED"),
        buyNowEligibleSQL,
      ),
    )
    .orderBy(asc(schema.vehicles.buyNowPrice))
    .limit(limit ?? 100)
    .all();
  return rows.map(mapCard);
}

export function distinctMakes() {
  return db
    .selectDistinct({ make: schema.vehicles.make })
    .from(schema.vehicles)
    .where(eq(schema.vehicles.status, "PUBLISHED"))
    .orderBy(asc(schema.vehicles.make))
    .all()
    .map((r) => r.make);
}

export function filterOptions() {
  const row = (col: typeof schema.vehicles.fuelType | typeof schema.vehicles.transmission | typeof schema.vehicles.bodyType) =>
    db
      .selectDistinct({ v: col })
      .from(schema.vehicles)
      .where(and(eq(schema.vehicles.status, "PUBLISHED"), sql`${col} IS NOT NULL`))
      .all()
      .map((r) => r.v!)
      .sort();
  return {
    makes: distinctMakes(),
    fuelTypes: row(schema.vehicles.fuelType),
    transmissions: row(schema.vehicles.transmission),
    bodyTypes: row(schema.vehicles.bodyType),
  };
}
