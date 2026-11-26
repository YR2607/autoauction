import { db, schema } from "@/lib/db";
import { desc, eq, sql } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vehicles | Admin" };

export default function AdminVehiclesPage() {
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
    .limit(200)
    .all();

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-3 mb-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#0b3b60]">Vehicles</h1>
          <p className="mt-0.5 text-xs text-[#64748b]">Total lots: {rows.length}</p>
        </div>
        <Link href="/admin/vehicles/new">
          <Button size="sm">New Vehicle</Button>
        </Link>
      </div>

      <Card className="overflow-x-auto rounded-none">
        <table className="w-full min-w-[800px] text-xs">
          <thead>
            <tr className="border-b border-[#cbd5e1] bg-[#f8fafc] text-left uppercase tracking-wider text-[#64748b]">
              <th className="px-4 py-2.5 font-bold">Lot</th>
              <th className="px-4 py-2.5 font-bold">Vehicle</th>
              <th className="px-4 py-2.5 font-bold">Sale Type</th>
              <th className="px-4 py-2.5 font-bold">Price / Bid</th>
              <th className="px-4 py-2.5 font-bold">Status</th>
              <th className="px-4 py-2.5 font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {rows.map((r) => (
              <tr key={r.vehicle.id} className="hover:bg-[#f8fafc]">
                <td className="px-4 py-2.5 font-bold text-[#0b3b60]">{r.vehicle.lotNumber}</td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2.5">
                    {r.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.coverUrl} alt="" className="h-9 w-14 shrink-0 rounded-none object-cover" />
                    ) : (
                      <span className="h-9 w-14 shrink-0 rounded-none bg-[#e2e8f0]" />
                    )}
                    <span className="font-bold text-[#1e293b]">
                      {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[#64748b]">{r.vehicle.saleType.replace(/_/g, " + ")}</td>
                <td className="px-4 py-2.5 font-mono font-bold text-[#0b3b60]">
                  {r.auction
                    ? formatMoney(r.auction.currentBid ?? r.auction.startingPrice, r.auction.currency as Currency)
                    : formatMoney(r.vehicle.buyNowPrice, (r.vehicle.buyNowCurrency ?? "EUR") as Currency)}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={r.vehicle.status === "PUBLISHED" ? "success" : r.vehicle.status === "SOLD" ? "primary" : "neutral"}>
                    {r.vehicle.status}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/vehicles/${r.vehicle.id}`} className="font-bold text-[#0b3b60] hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
