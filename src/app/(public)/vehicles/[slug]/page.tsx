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
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getVehicleBySlug, similarVehicles } from "@/features/vehicles/queries";
import { publicAuctionState } from "@/features/auctions/engine";
import { formatMoney, type Currency } from "@/lib/currency";
import { getSessionUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { and, desc, eq } from "drizzle-orm";
import { Gauge, Cog, Fuel, MapPin, FileText, Hash, Calendar } from "lucide-react";
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

  // Mirrors the server-side allowlist in buyNow(): purchasable states only,
  // same currency, fixed price strictly above any accepted bid.
  const buyNowAllowedStates = ["DRAFT", "SCHEDULED", "LIVE", "UNSOLD", "CANCELLED"];
  const showBuyNow =
    (v.saleType === "BUY_NOW" || v.saleType === "AUCTION_BUY_NOW") &&
    v.buyNowPrice != null &&
    v.status === "PUBLISHED" &&
    (!auction ||
      (buyNowAllowedStates.includes(auction.status) &&
        auction.currency === v.buyNowCurrency &&
        (auction.currentBid == null || auction.currentBid < v.buyNowPrice)));

  const auctionVisible =
    auction &&
    ["SCHEDULED", "LIVE", "ENDED", "AWAITING_ADMIN_APPROVAL", "SOLD", "UNSOLD"].includes(
      auction.status,
    );

  const facts: { icon: React.ReactNode; label: string; value: string }[] = [
    v.mileage != null && {
      icon: <Gauge className="h-4 w-4" />,
      label: "Mileage",
      value: `${v.mileage.toLocaleString("en-GB")} km`,
    },
    v.transmission && {
      icon: <Cog className="h-4 w-4" />,
      label: "Transmission",
      value: v.transmission,
    },
    v.fuelType && {
      icon: <Fuel className="h-4 w-4" />,
      label: "Fuel",
      value: v.fuelType,
    },
    v.year && {
      icon: <Calendar className="h-4 w-4" />,
      label: "Year",
      value: String(v.year),
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Breadcrumb
          className="mb-5"
          items={[
            { label: "Cars", href: "/vehicles" },
            { label: v.make, href: `/vehicles?make=${encodeURIComponent(v.make)}` },
            { label: `${v.model} ${v.year}` },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* MEDIA — ~65% on desktop, first on mobile */}
          <div className="min-w-0">
            <Gallery images={images.map((i) => i.url)} alt={`${title} ${v.year}`} />

            {/* key facts strip */}
            {facts.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-line bg-line sm:grid-cols-4">
                {facts.map((f) => (
                  <div key={f.label} className="bg-white px-4 py-3.5">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {f.icon} {f.label}
                    </p>
                    <p className="mt-1 text-sm font-bold">{f.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIONS — second on mobile, right column (sticky) on desktop */}
          <div className="lg:col-start-2 lg:row-start-1 lg:row-end-3">
            <div className="space-y-4 lg:sticky lg:top-20">
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="font-display text-2xl font-extrabold leading-tight">
                      {title}
                    </h1>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5" /> Lot {v.lotNumber}
                      </span>
                      {v.locationCity && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {v.locationCity},{" "}
                          {v.locationCountry}
                        </span>
                      )}
                    </p>
                  </div>
                  <FavoriteButton vehicleId={v.id} initial={isFav} isAuthed={!!user} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone={v.status === "PUBLISHED" ? "success" : "warning"}>
                    {v.status}
                  </Badge>
                  {auctionVisible && <Badge tone="primary">Auction</Badge>}
                  {showBuyNow && <Badge tone="dark">Buy Now</Badge>}
                </div>
              </Card>

              {auctionVisible && (
                <BidPanel
                  auctionId={auction.id}
                  initial={{
                    ...publicAuctionState(auction),
                    isLeading: !!user && auction.highestBidderId === user.id,
                  }}
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

          {/* DETAILS — specs, condition, description, documents, bid history */}
          <div className="min-w-0">
            <SpecSections v={v} vinShown={vinShown} />
            <ConditionCard v={v} />

            {v.description && (
              <Card className="mt-6 p-6">
                <h2 className="font-display text-lg font-bold">Description</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-graphite/80">
                  {v.description}
                </p>
                {v.serviceHistory && (
                  <p className="mt-3 border-t border-line/60 pt-3 text-sm text-muted">
                    {v.serviceHistory}
                  </p>
                )}
              </Card>
            )}

            {docs.length > 0 && (
              <Card className="mt-6 p-6">
                <h2 className="font-display text-lg font-bold">Documents</h2>
                <ul className="mt-3 space-y-2">
                  {docs.map((d) => (
                    <li key={d.id}>
                      <a
                        href={d.url}
                        className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" /> {d.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {auction && bidHistory.length > 0 && (
              <Card className="mt-6 overflow-hidden">
                <div className="border-b border-line px-6 py-4">
                  <h2 className="font-display text-lg font-bold">Bid history</h2>
                </div>
                <ul className="divide-y divide-line/60">
                  {bidHistory.map((b, i) => (
                    <li key={b.bid.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${
                            i === 0 ? "bg-success/10 text-success" : "bg-graphite/5 text-muted"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm font-semibold">
                          {maskEmail(b.email)}
                          {i === 0 && (
                            <span className="ml-2 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                              Leading
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="tnum text-sm font-extrabold">
                          {formatMoney(b.bid.amount, auction.currency as Currency)}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(b.bid.createdAt).toLocaleString("en-GB")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>

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

function SpecSections({ v, vinShown }: { v: Record<string, unknown>; vinShown: string }) {
  type Row = [string, string | number | null | undefined];
  const groups: { title: string; rows: Row[] }[] = [
    {
      title: "General",
      rows: [
        ["VIN", vinShown],
        ["Body type", v.bodyType as string],
        ["Doors / Seats", v.doors || v.seats ? `${v.doors ?? "—"} / ${v.seats ?? "—"}` : null],
        ["Location", v.locationCity ? `${v.locationCity}, ${v.locationCountry ?? ""}` : (v.locationCountry as string)],
      ],
    },
    {
      title: "Engine & performance",
      rows: [
        [
          "Engine",
          v.engineCapacityCc
            ? `${v.engineCapacityCc} cc · ${v.enginePowerHp ?? "—"} hp`
            : v.enginePowerHp
              ? `${v.enginePowerHp} hp`
              : null,
        ],
        ["Fuel", v.fuelType as string],
        ["Drivetrain", v.drivetrain as string],
        ["Transmission", v.transmission as string],
      ],
    },
    {
      title: "Exterior & interior",
      rows: [
        ["Exterior color", v.exteriorColor as string],
        ["Interior color", v.interiorColor as string],
      ],
    },
  ];

  return (
    <Card className="mt-6 p-6">
      <h2 className="font-display text-lg font-bold">Specifications</h2>
      <div className="mt-4 space-y-5">
        {groups.map((g) => {
          const rows = g.rows.filter(([, val]) => val != null && val !== "");
          if (!rows.length) return null;
          return (
            <div key={g.title}>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                {g.title}
              </h3>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
                {rows.map(([k, val]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 border-b border-line/50 pb-2 text-sm"
                  >
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right font-semibold">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ConditionCard({ v }: { v: Record<string, unknown> }) {
  const yn = (b: unknown) => (b == null ? "—" : b ? "Yes" : "No");
  const rows: [string, string][] = [
    ["Overall condition", (v.conditionOverall as string) ?? "—"],
    ["Accident history", (v.accidentHistory as string) ?? "—"],
    ["Engine", (v.engineCondition as string) ?? "—"],
    ["Transmission", (v.transmissionCondition as string) ?? "—"],
    ["Chassis", (v.chassisCondition as string) ?? "—"],
    ["Airbags", (v.airbagStatus as string) ?? "—"],
    ["Starts", yn(v.starts)],
    ["Drives", yn(v.drives)],
    ["Keys available", yn(v.keysAvailable)],
  ];
  const damageType = v.damageType as string | null;
  const flood = v.floodDamage as boolean | null;
  const hasDamage = (!!damageType && damageType !== "none" && damageType !== "NONE") || !!flood;

  return (
    <Card className="mt-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Condition</h2>
        <Badge tone={hasDamage ? "warning" : "success"}>
          {hasDamage ? "Damage reported" : "No damage reported"}
        </Badge>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {rows.map(([k, val]) => (
          <div
            key={k}
            className="flex justify-between gap-4 border-b border-line/50 pb-2 text-sm"
          >
            <dt className="text-muted">{k}</dt>
            <dd className="text-right font-semibold">{val}</dd>
          </div>
        ))}
      </dl>
      {hasDamage && (
        <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#92600a]">
            Damage details
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {damageType && (
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#92600a]">
                {damageType}
              </span>
            )}
            {flood && (
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#92600a]">
                Flood damage
              </span>
            )}
          </div>
        </div>
      )}
      {typeof v.registrationInfo === "string" && v.registrationInfo && (
        <p className="mt-4 border-t border-line/60 pt-3 text-sm text-muted">
          <b className="text-graphite">Registration:</b> {v.registrationInfo}
        </p>
      )}
    </Card>
  );
}
