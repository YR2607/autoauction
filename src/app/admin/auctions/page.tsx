import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/auctions/countdown";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Auctions | Admin" };

const tone: Record<string, "live" | "warning" | "success" | "neutral" | "primary"> = {
  DRAFT: "neutral",
  SCHEDULED: "warning",
  LIVE: "live",
  AWAITING_ADMIN_APPROVAL: "warning",
  APPROVED: "success",
  SOLD: "success",
  UNSOLD: "neutral",
  CANCELLED: "neutral",
  ENDED: "primary",
  REJECTED: "live",
};

export default function AdminAuctionsPage() {
  const rows = db
    .select({ auction: schema.auctions, vehicle: schema.vehicles })
    .from(schema.auctions)
    .innerJoin(schema.vehicles, eq(schema.vehicles.id, schema.auctions.vehicleId))
    .orderBy(desc(schema.auctions.createdAt))
    .limit(300)
    .all();

  return (
    <div>
      <h1 className="text-xl font-bold uppercase tracking-wider text-[#0b3b60]">Auctions</h1>
      <p className="mt-0.5 text-xs text-[#64748b]">Manage on the vehicle page: create, schedule, cancel, approve.</p>
      <Card className="mt-4 overflow-x-auto rounded-none">
        <table className="w-full min-w-[820px] text-xs">
          <thead>
            <tr className="border-b border-[#cbd5e1] bg-[#f8fafc] text-left uppercase tracking-wider text-[#64748b]">
              <th className="px-4 py-2.5 font-bold">Vehicle</th>
              <th className="px-4 py-2.5 font-bold">Status</th>
              <th className="px-4 py-2.5 font-bold">Current / Start</th>
              <th className="px-4 py-2.5 font-bold">Bids</th>
              <th className="px-4 py-2.5 font-bold">Ends</th>
              <th className="px-4 py-2.5 font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9]">
            {rows.map((r) => (
              <tr key={r.auction.id} className="hover:bg-[#f8fafc]">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/vehicles/${r.vehicle.id}`} className="font-bold text-[#0b3b60] hover:underline">
                    {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                  </Link>
                  <span className="ml-2 text-[11px] text-[#64748b]">Lot {r.vehicle.lotNumber}</span>
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={tone[r.auction.status]}>{r.auction.status.replace(/_/g, " ")}</Badge>
                </td>
                <td className="px-4 py-2.5 font-mono font-bold text-[#0b3b60]">
                  {formatMoney(r.auction.currentBid ?? r.auction.startingPrice, r.auction.currency as Currency)}
                </td>
                <td className="px-4 py-2.5 text-[#64748b]">{r.auction.bidCount} bids</td>
                <td className="px-4 py-2.5 text-[#64748b]">
                  {r.auction.status === "LIVE" ? (
                    <Countdown endsAt={r.auction.endsAt} className="font-bold text-[#cc0000]" />
                  ) : (
                    new Date(r.auction.endsAt).toLocaleDateString("en-US")
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/vehicles/${r.vehicle.id}`} className="font-bold text-[#0b3b60] hover:underline">
                    Manage
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
