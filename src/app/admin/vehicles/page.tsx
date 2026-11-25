import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/vehicles/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatMoney, type Currency } from "@/lib/currency";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vehicles · Admin" };

export default async function AdminVehiclesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const perPage = 25;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const total = db.select({ c: sql<number>`count(*)` }).from(schema.vehicles).get()?.c ?? 0;
  const rows = db
    .select({
      vehicle: schema.vehicles,
      auction: schema.auctions,
      imgCount: sql<number>`(SELECT count(*) FROM vehicle_images vi WHERE vi.vehicle_id = ${schema.vehicles.id})`,
      coverUrl: sql<string>`(SELECT url FROM vehicle_images vi WHERE vi.vehicle_id = ${schema.vehicles.id} ORDER BY vi.is_cover DESC, vi.sort_order ASC LIMIT 1)`,
    })
    .from(schema.vehicles)
    .leftJoin(schema.auctions, eq(schema.auctions.vehicleId, schema.vehicles.id))
    .orderBy(desc(schema.vehicles.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage)
    .all();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-medium">Vehicles</h1>
        <Link href="/admin/vehicles/new">
          <Button>+ New vehicle</Button>
        </Link>
      </div>
      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line bg-bg/60 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Lot</th>
              <th className="px-5 py-3 font-semibold">Vehicle</th>
              <th className="px-5 py-3 font-semibold">Sale type</th>
              <th className="px-5 py-3 font-semibold">Price / bid</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Photos</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.vehicle.id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3 font-semibold text-muted">{r.vehicle.lotNumber}</td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-3">
                    {r.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.coverUrl} alt="" className="h-11 w-16 shrink-0 rounded-md object-cover" />
                    ) : (
                      <span className="h-11 w-16 shrink-0 rounded-md bg-graphite/5" />
                    )}
                    <span className="font-bold">
                      {r.vehicle.make} {r.vehicle.model} {r.vehicle.year}
                    </span>
                  </span>
                </td>
                <td className="px-5 py-3 text-muted">{r.vehicle.saleType.replace(/_/g, " + ")}</td>
                <td className="px-5 py-3 font-semibold">
                  {r.auction
                    ? formatMoney(r.auction.currentBid ?? r.auction.startingPrice, r.auction.currency as Currency)
                    : formatMoney(r.vehicle.buyNowPrice, (r.vehicle.buyNowCurrency ?? "EUR") as Currency)}
                </td>
                <td className="px-5 py-3">
                  <Badge tone={r.vehicle.status === "PUBLISHED" ? "success" : r.vehicle.status === "SOLD" ? "primary" : "neutral"}>
                    {r.vehicle.status}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-muted">{r.imgCount}</td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/vehicles/${r.vehicle.id}`} className="text-xs font-bold text-primary hover:underline">
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Pagination page={page} perPage={perPage} total={total} params={sp} basePath="/admin/vehicles" />
    </div>
  );
}
