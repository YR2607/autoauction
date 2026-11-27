import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Gallery } from "@/components/vehicles/gallery";
import { BidPanel } from "@/components/auctions/bid-panel";
import { BuyNowButton } from "@/components/vehicles/buy-now-button";
import { FavoriteButton } from "@/components/vehicles/favorite-button";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getVehicleBySlug, similarVehicles } from "@/features/vehicles/queries";
import { buyNowAvailable } from "@/features/vehicles/availability";
import { publicAuctionState } from "@/features/auctions/engine";
import { formatMoney, type Currency } from "@/lib/currency";
import { getSessionUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { and, desc, eq } from "drizzle-orm";
import { MapPin, FileText, AlertCircle } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

function cleanLot(num: string) {
  return num.replace(/[^0-9]/g, "") || num.replace(/-/g, " ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = getVehicleBySlug(slug);
  if (!data) return { title: "Vehicle" };
  const v = data.vehicle;
  const lot = cleanLot(v.lotNumber);
  return {
    title: `Lot ${lot} | ${v.year} ${v.make} ${v.model} ${v.trim ?? ""}`.replace(/\s+/g, " "),
    description: `Lot ${lot}: ${v.make} ${v.model} ${v.year}, mileage ${v.mileage?.toLocaleString("en-US")} mi. Online vehicle auctions.`,
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
  const title = `${v.year} ${v.make} ${v.model} ${v.trim ?? ""}`.replace(/\s+/g, " ").trim();
  const lotFormatted = cleanLot(v.lotNumber);

  const vinShown =
    v.vinVisibility === "full"
      ? (v.vin ?? "Not disclosed")
      : v.vinVisibility === "last4" && v.vin
        ? `•••••••••••••${v.vin.slice(-4)}`
        : "Hidden";

  const showBuyNow = buyNowAvailable(v, auction);

  const auctionVisible =
    auction &&
    ["SCHEDULED", "LIVE", "ENDED", "AWAITING_ADMIN_APPROVAL", "SOLD", "UNSOLD"].includes(
      auction.status,
    );

  const facts: { label: string; value: string }[] = [
    v.mileage != null && {
      label: "Odometer",
      value: `${v.mileage.toLocaleString("en-US")} mi (Actual)`,
    },
    v.transmission && {
      label: "Transmission",
      value: v.transmission,
    },
    v.fuelType && {
      label: "Fuel Type",
      value: v.fuelType,
    },
    v.year && {
      label: "Model Year",
      value: String(v.year),
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="min-h-screen bg-[#eaedf1] text-[#1e293b]">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6">
        <Breadcrumb
          className="mb-3 text-xs"
          items={[
            { label: "Home", href: "/" },
            { label: "Vehicles", href: "/vehicles" },
            { label: v.make, href: `/vehicles?make=${encodeURIComponent(v.make)}` },
            { label: `${v.model} (${v.year})` },
          ]}
        />

        <div className="mb-4 rounded-none border border-[#cbd5e1] bg-white p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-none bg-[#0b3b60] px-2 py-0.5 text-xs font-bold text-white uppercase">
                  Lot {lotFormatted}
                </span>
                {v.fuelType && (
                  <span className="rounded-none border border-[#cbd5e1] bg-[#f8fafc] px-2 py-0.5 text-xs font-bold uppercase text-[#334155]">
                    {v.fuelType}
                  </span>
                )}
                {v.transmission && (
                  <span className="rounded-none border border-[#cbd5e1] bg-[#f8fafc] px-2 py-0.5 text-xs font-bold uppercase text-[#334155]">
                    {v.transmission}
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-[#0b3b60]">
                {title}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 text-xs text-[#64748b]">
                <span className="font-bold text-[#334155]">VIN: {vinShown}</span>
                {v.locationCity && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#0b3b60]" /> {v.locationCity}, {v.locationCountry}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <FavoriteButton vehicleId={v.id} initial={isFav} isAuthed={!!user} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <div className="rounded-none border border-[#cbd5e1] bg-white p-2.5">
              <Gallery images={images.map((i) => i.url)} alt={`${title} ${v.year}`} />
            </div>

            {facts.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {facts.map((f) => (
                  <div key={f.label} className="rounded-none border border-[#cbd5e1] bg-white p-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                      {f.label}:
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-[#0b3b60]">{f.value}</p>
                  </div>
                ))}
              </div>
            )}

            <SpecSections v={v} vinShown={vinShown} />
            <ConditionCard v={v} />

            {v.description && (
              <div className="mt-3 rounded-none border border-[#cbd5e1] bg-white p-3.5">
                <h2 className="border-b border-[#cbd5e1] pb-1.5 text-xs font-bold uppercase tracking-wider text-[#0b3b60]">
                  Vehicle Description
                </h2>
                <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-[#334155]">
                  {v.description}
                </p>
                {v.serviceHistory && (
                  <p className="mt-2.5 border-t border-[#f1f5f9] pt-2 text-xs text-[#64748b]">
                    <b className="text-[#1e293b]">Service History:</b> {v.serviceHistory}
                  </p>
                )}
              </div>
            )}

            {docs.length > 0 && (
              <div className="mt-3 rounded-none border border-[#cbd5e1] bg-white p-3.5">
                <h2 className="border-b border-[#cbd5e1] pb-1.5 text-xs font-bold uppercase tracking-wider text-[#0b3b60]">
                  Documents and Certification
                </h2>
                <ul className="mt-2.5 space-y-1.5">
                  {docs.map((d) => (
                    <li key={d.id}>
                      <a
                        href={d.url}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#0b3b60] hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#ffb81c]" /> {d.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {auction && bidHistory.length > 0 && (
              <div className="mt-3 rounded-none border border-[#cbd5e1] bg-white">
                <div className="border-b border-[#cbd5e1] bg-[#f8fafc] px-3.5 py-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#0b3b60]">
                    Bid History
                  </h2>
                </div>
                <ul className="divide-y divide-[#f1f5f9]">
                  {bidHistory.map((b, i) => (
                    <li key={b.bid.id} className="flex items-center justify-between px-3.5 py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-none text-[9px] font-bold ${
                            i === 0 ? "bg-[#15803d] text-white" : "bg-[#f1f5f9] text-[#64748b]"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="font-semibold text-[#1e293b]">
                          {maskEmail(b.email)}
                          {i === 0 && (
                            <span className="ml-2 rounded-none bg-[#15803d] px-1 py-0.5 text-[9px] font-bold uppercase text-white">
                              High Bidder
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="tnum font-bold text-[#0b3b60]">
                          {formatMoney(b.bid.amount, auction.currency as Currency)}
                        </p>
                        <p className="text-[10px] text-[#94a3b8]">
                          {new Date(b.bid.createdAt).toLocaleString("en-US")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-start-2 lg:row-start-1 lg:row-end-3">
            <div className="space-y-3 lg:sticky lg:top-[130px]">
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
                <div className="rounded-none border border-[#f59e0b] bg-[#fefce8] p-3 text-xs font-bold text-[#b45309] flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> This vehicle is reserved pending purchase approval.
                </div>
              )}

              <div className="rounded-none border border-[#cbd5e1] bg-white p-3.5 text-xs text-[#64748b] space-y-1.5">
                <div className="text-[#0b3b60] font-bold uppercase tracking-wider text-[11px] border-b border-[#f1f5f9] pb-1.5 mb-1.5">
                  Auction Guarantee and Verification
                </div>
                <p>• Direct consignment from authorized fleets and certified sellers</p>
                <p>• Verified title transfer documentation and clean paperwork</p>
                <p>• Nationwide transport and logistics coordination available</p>
              </div>
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <section className="mt-8 border-t border-[#cbd5e1] pt-5">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#0b3b60]">
              Similar Vehicles at Auction
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((sv) => (
                <VehicleCard key={sv.id} v={sv} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
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
      title: "Vehicle Specifications",
      rows: [
        ["VIN", vinShown],
        ["Body Type", v.bodyType as string],
        ["Doors / Seats", v.doors || v.seats ? `${v.doors ?? "N/A"} / ${v.seats ?? "N/A"}` : null],
        ["Location", v.locationCity ? `${v.locationCity}, ${v.locationCountry ?? ""}` : (v.locationCountry as string)],
      ],
    },
    {
      title: "Engine & Drivetrain",
      rows: [
        [
          "Engine",
          v.engineCapacityCc
            ? `${v.engineCapacityCc} cc / ${v.enginePowerHp ?? "N/A"} hp`
            : v.enginePowerHp
              ? `${v.enginePowerHp} hp`
              : null,
        ],
        ["Fuel Type", v.fuelType as string],
        ["Drivetrain", v.drivetrain as string],
        ["Transmission", v.transmission as string],
      ],
    },
    {
      title: "Exterior & Interior",
      rows: [
        ["Exterior Color", v.exteriorColor as string],
        ["Interior Color", v.interiorColor as string],
      ],
    },
  ];

  return (
    <div className="mt-3 rounded-none border border-[#cbd5e1] bg-white p-3.5">
      <h2 className="border-b border-[#cbd5e1] pb-1.5 text-xs font-bold uppercase tracking-wider text-[#0b3b60]">
        Technical Specifications
      </h2>
      <div className="mt-3 space-y-3">
        {groups.map((g) => {
          const rows = g.rows.filter(([, val]) => val != null && val !== "");
          if (!rows.length) return null;
          return (
            <div key={g.title}>
              <h3 className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#0b3b60] bg-[#f8fafc] px-2 py-0.5 border-l-2 border-[#0b3b60]">
                {g.title}
              </h3>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 text-xs">
                {rows.map(([k, val]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 border-b border-[#f1f5f9] pb-0.5"
                  >
                    <dt className="text-[#64748b]">{k}:</dt>
                    <dd className="text-right font-bold text-[#1e293b]">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConditionCard({ v }: { v: Record<string, unknown> }) {
  const yn = (b: unknown) => (b == null ? "N/A" : b ? "Yes" : "No");
  const rows: [string, string][] = [
    ["Overall Condition", (v.conditionOverall as string) ?? "Good"],
    ["Accident History", (v.accidentHistory as string) ?? "None Reported"],
    ["Engine Condition", (v.engineCondition as string) ?? "Operational"],
    ["Transmission Condition", (v.transmissionCondition as string) ?? "Operational"],
    ["Chassis / Frame", (v.chassisCondition as string) ?? "Normal"],
    ["Airbag Status", (v.airbagStatus as string) ?? "Intact"],
    ["Engine Starts", yn(v.starts)],
    ["Vehicle Drives", yn(v.drives)],
    ["Keys Available", yn(v.keysAvailable)],
  ];
  const damageType = v.damageType as string | null;
  const flood = v.floodDamage as boolean | null;
  const hasDamage = (!!damageType && damageType !== "none" && damageType !== "NONE") || !!flood;

  return (
    <div className="mt-3 rounded-none border border-[#cbd5e1] bg-white p-3.5">
      <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-1.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#0b3b60]">
          Condition and Inspection Report
        </h2>
        <span
          className={`rounded-none px-2 py-0.5 text-[10px] font-bold uppercase text-white ${
            hasDamage ? "bg-[#cc0000]" : "bg-[#15803d]"
          }`}
        >
          {hasDamage ? "Damage Reported" : "No Major Damage Reported"}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 text-xs">
        {rows.map(([k, val]) => (
          <div
            key={k}
            className="flex justify-between gap-4 border-b border-[#f1f5f9] pb-0.5"
          >
            <dt className="text-[#64748b]">{k}:</dt>
            <dd className="text-right font-bold text-[#1e293b]">{val}</dd>
          </div>
        ))}
      </dl>
      {hasDamage && (
        <div className="mt-2.5 rounded-none border border-[#fca5a5] bg-[#fef2f2] p-2 text-xs">
          <p className="font-bold uppercase tracking-wide text-[#b91c1c]">
            Reported Damage Details:
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {damageType && (
              <span className="rounded-none border border-[#cbd5e1] bg-white px-2 py-0.5 text-xs font-semibold text-[#1e293b]">
                {damageType}
              </span>
            )}
            {flood && (
              <span className="rounded-none border border-[#cbd5e1] bg-white px-2 py-0.5 text-xs font-semibold text-[#dc2626]">
                Flood / Water Damage
              </span>
            )}
          </div>
        </div>
      )}
      {typeof v.registrationInfo === "string" && v.registrationInfo && (
        <p className="mt-2.5 border-t border-[#f1f5f9] pt-1.5 text-xs text-[#64748b]">
          <b className="text-[#1e293b]">Registration Information:</b> {v.registrationInfo}
        </p>
      )}
    </div>
  );
}
