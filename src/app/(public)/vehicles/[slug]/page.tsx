import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Gallery } from "@/components/vehicles/gallery";
import { BidPanel } from "@/components/auctions/bid-panel";
import { BuyNowButton } from "@/components/vehicles/buy-now-button";
import { FavoriteButton } from "@/components/vehicles/favorite-button";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getVehicleBySlug, similarVehicles } from "@/features/vehicles/queries";
import { publicAuctionState } from "@/features/auctions/engine";
import { formatMoney, type Currency } from "@/lib/currency";
import { getSessionUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { and, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getVehicleBySlug(slug);
  if (!data) return { title: "Vehicle" };
  const v = data.vehicle;
  return {
    title: `${v.make} ${v.model} ${v.trim ?? ""} ${v.year}`.replace(/\s+/g, " "),
    description: `Lot ${v.lotNumber} — ${v.make} ${v.model} ${v.year}, ${v.mileage?.toLocaleString("en-GB")} km. ${data.auction ? "Live auction" : "Buy Now"} at AutoAuction.`,
  };
}

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getVehicleBySlug(slug);
  if (!data || data.vehicle.status === "ARCHIVED") notFound();

  const { vehicle: v, auction, images, docs } = data;
  const user = await getSessionUser();
  const isFav = user
    ? !!db
        .select()
        .from(schema.favorites)
        .where(and(eq(schema.favorites.userId, user.id), eq(schema.favorites.vehicleId, v.id)))
        .get()
    : false;

  const bidHistory = auction
    ? db
        .select({ bid: schema.bids, email: schema.users.email })
        .from(schema.bids)
        .innerJoin(schema.users, eq(schema.users.id, schema.bids.userId))
        .where(and(eq(schema.bids.auctionId, auction.id), eq(schema.bids.status, "ACCEPTED")))
        .orderBy(desc(schema.bids.amount))
        .limit(20)
        .all()
    : [];

  const similar = similarVehicles(v.id, v.make);
  const title = `${v.make} ${v.model} ${v.trim ?? ""}`.replace(/\s+/g, " ").trim();

  const vinShown =
    v.vinVisibility === "full"
      ? (v.vin ?? "—")
      : v.vinVisibility === "last4" && v.vin
        ? `•••••••••••••${v.vin.slice(-4)}`
        : "Hidden";

  const showBuyNow =
    (v.saleType === "BUY_NOW" || v.saleType === "AUCTION_BUY_NOW") &&
    v.buyNowPrice != null &&
    v.status === "PUBLISHED" &&
    (!auction || auction.status !== "SOLD");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* breadcrumbs */}
        <nav className="mb-5 text-sm text-muted">
          <a href="/vehicles" className="hover:text-graphite">Vehicles</a>
          <span className="mx-2">/</span>
          <span className="text-graphite">{title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* LEFT */}
          <div>
            <Gallery
              images={images.map((i) => i.url)}
              alt={`${title} ${v.year}`}
            />
            <SpecCard v={v} vinShown={vinShown} />
            <ConditionCard v={v} />
            {v.description && (
              <Card className="mt-6 p-6">
                <h2 className="font-display text-lg font-bold">Description</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-graphite/80">
                  {v.description}
                </p>
                {v.serviceHistory && (
                  <p className="mt-3 text-sm text-muted">{v.serviceHistory}</p>
                )}
              </Card>
            )}
            {docs.length > 0 && (
              <Card className="mt-6 p-6">
                <h2 className="font-display text-lg font-bold">Documents</h2>
                <ul className="mt-3 space-y-2">
                  {docs.map((d) => (
                    <li key={d.id}>
                      <a href={d.url} className="text-sm font-semibold text-primary hover:underline">
                        {d.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-extrabold leading-tight">
                    {title}
                  </h1>
                  <p className="mt-1 text-sm text-muted">
                    {v.year} · Lot {v.lotNumber}
                    {v.locationCity ? ` · ${v.locationCity}, ${v.locationCountry}` : ""}
                  </p>
                </div>
                <FavoriteButton vehicleId={v.id} initial={isFav} isAuthed={!!user} />
              </div>
              <div className="mt-3 flex gap-1.5">
                <Badge tone={v.status === "PUBLISHED" ? "success" : "neutral"}>
                  {v.status}
                </Badge>
                {v.saleType !== "BUY_NOW" && <Badge tone="primary">Auction</Badge>}
                {showBuyNow && <Badge tone="dark">Buy Now</Badge>}
              </div>
            </Card>

            {auction && ["SCHEDULED", "LIVE", "ENDED", "AWAITING_ADMIN_APPROVAL", "SOLD", "UNSOLD"].includes(auction.status) && (
              <BidPanel
                auctionId={auction.id}
                initial={publicAuctionState(auction)}
                isAuthed={!!user}
              />
            )}

            {showBuyNow && (
              <BuyNowButton
                vehicleId={v.id}
                price={v.buyNowPrice!}
                currency={(v.buyNowCurrency ?? "EUR") as Currency}
                isAuthed={!!user}
              />
            )}

            {v.status === "RESERVED" && (
              <p className="rounded-[14px] border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold text-[#92600a]">
                This vehicle is currently reserved pending a purchase review.
              </p>
            )}
          </div>
        </div>

        {/* BID HISTORY */}
        {auction && bidHistory.length > 0 && (
          <Card className="mt-10 overflow-hidden">
            <div className="border-b border-line px-6 py-4">
              <h2 className="font-display text-lg font-bold">Bid history</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-bg/60 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-6 py-3 font-semibold">Bidder</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {bidHistory.map((b, i) => (
                  <tr key={b.bid.id} className="border-b border-line/60 last:border-0">
                    <td className="px-6 py-3 font-semibold">
                      {maskEmail(b.email)}
                      {i === 0 && (
                        <span className="ml-2 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                          Leading
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 font-bold">
                      {formatMoney(b.bid.amount, auction.currency as Currency)}
                    </td>
                    <td className="px-6 py-3 text-muted">
                      {new Date(b.bid.createdAt).toLocaleString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* SIMILAR */}
        {similar.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-6 font-display text-2xl font-extrabold">Similar vehicles</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((sv) => (
                <VehicleCard key={sv.id} v={sv} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}•••@${domain}`;
}

function SpecCard({ v, vinShown }: { v: Record<string, unknown>; vinShown: string }) {
  const rows: [string, string | number | null | undefined][] = [
    ["VIN", vinShown],
    ["Mileage", v.mileage != null ? `${(v.mileage as number).toLocaleString("en-GB")} km` : null],
    ["Body type", v.bodyType as string],
    ["Fuel", v.fuelType as string],
    ["Transmission", v.transmission as string],
    ["Drivetrain", v.drivetrain as string],
    ["Engine", v.engineCapacityCc ? `${v.engineCapacityCc} cc · ${v.enginePowerHp} hp` : v.enginePowerHp ? `${v.enginePowerHp} hp` : null],
    ["Exterior", v.exteriorColor as string],
    ["Interior", v.interiorColor as string],
    ["Doors / Seats", v.doors || v.seats ? `${v.doors ?? "—"} / ${v.seats ?? "—"}` : null],
  ];
  return (
    <Card className="mt-6 p-6">
      <h2 className="font-display text-lg font-bold">Specifications</h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows
          .filter(([, val]) => val != null && val !== "")
          .map(([k, val]) => (
            <div key={k} className="flex justify-between border-b border-line/50 pb-2 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className="font-semibold">{val}</dd>
            </div>
          ))}
      </dl>
    </Card>
  );
}

function ConditionCard({ v }: { v: Record<string, unknown> }) {
  const bool = (b: unknown) => (b ? "Yes" : "No");
  const rows: [string, string][] = [
    ["Overall condition", (v.conditionOverall as string) ?? "—"],
    ["Accident history", (v.accidentHistory as string) ?? "—"],
    ["Engine", (v.engineCondition as string) ?? "—"],
    ["Transmission", (v.transmissionCondition as string) ?? "—"],
    ["Chassis", (v.chassisCondition as string) ?? "—"],
    ["Airbags", (v.airbagStatus as string) ?? "—"],
    ["Flood damage", bool(v.floodDamage)],
    ["Starts", bool(v.starts)],
    ["Drives", bool(v.drives)],
    ["Keys available", bool(v.keysAvailable)],
  ];
  return (
    <Card className="mt-6 p-6">
      <h2 className="font-display text-lg font-bold">Condition</h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map(([k, val]) => (
          <div key={k} className="flex justify-between border-b border-line/50 pb-2 text-sm">
            <dt className="text-muted">{k}</dt>
            <dd className="font-semibold">{val}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
