import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/auctions/countdown";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Auctions · Admin" };

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
      <h1 className="font-display text-2xl font-extrabold">Auctions</h1>
      <p className="mt-1 text-sm text-muted">Manage on the vehicle page — create, schedule, cancel, approve.</p>
      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line bg-bg/60 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Vehicle</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Current / start</th>
              <th className="px-5 py-3 font-semibold">Bids</th>
              <th className="px-5 py-3 font-semibold">Ends</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.auction.id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3 font-bold">
                  {r.vehicle.make} {r.vehicle.model} {r.vehicle.year}
                </td>
                <td className="px-5 py-3">
                  <Badge tone={tone[r.auction.status] ?? "neutral"} pulse={r.auction.status === "LIVE"}>
                    {r.auction.status.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="px-5 py-3 font-semibold">
                  {formatMoney(r.auction.currentBid ?? r.auction.startingPrice, r.auction.currency as Currency)}
                </td>
                <td className="px-5 py-3 text-muted">{r.auction.bidCount}</td>
                <td className="px-5 py-3 text-muted">
                  {r.auction.status === "LIVE" ? (
                    <Countdown endsAt={r.auction.endsAt} className="font-bold text-error" />
                  ) : (
                    new Date(r.auction.endsAt).toLocaleDateString("en-GB")
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/vehicles/${r.vehicle.id}`} className="text-xs font-bold text-primary hover:underline">
                    Manage →
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
