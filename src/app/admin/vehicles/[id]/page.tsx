import { notFound } from "next/navigation";
import { db, schema } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { ImageManager } from "@/components/admin/image-manager";
import { DocumentManager } from "@/components/admin/document-manager";
import { VehicleStatusActions } from "@/components/admin/vehicle-status-actions";
import { AuctionPanel } from "@/components/admin/auction-panel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit Vehicle · Admin" };

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id)).get();
  if (!vehicle) notFound();

  const images = db
    .select()
    .from(schema.vehicleImages)
    .where(eq(schema.vehicleImages.vehicleId, id))
    .orderBy(desc(schema.vehicleImages.isCover), asc(schema.vehicleImages.sortOrder))
    .all();
  const auction = db.select().from(schema.auctions).where(eq(schema.auctions.vehicleId, id)).get();
  const documents = db
    .select({ id: schema.vehicleDocuments.id, title: schema.vehicleDocuments.title, kind: schema.vehicleDocuments.kind, isPublic: schema.vehicleDocuments.isPublic })
    .from(schema.vehicleDocuments)
    .where(eq(schema.vehicleDocuments.vehicleId, id))
    .all();

  const initial: Record<string, unknown> = { ...vehicle };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">
            {vehicle.make} {vehicle.model} {vehicle.year}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            Lot {vehicle.lotNumber} ·{" "}
            <Badge tone={vehicle.status === "PUBLISHED" ? "success" : "neutral"}>{vehicle.status}</Badge>
            <Link href={`/vehicles/${vehicle.slug}`} className="font-semibold text-primary hover:underline" target="_blank">
              Preview public page ↗
            </Link>
          </p>
        </div>
        <VehicleStatusActions vehicleId={id} status={vehicle.status} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="max-w-4xl">
          <VehicleForm vehicleId={id} initial={initial} />
        </div>
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-4 font-display text-base font-bold">Photos ({images.length})</h2>
            <ImageManager vehicleId={id} images={images.map((i) => ({ id: i.id, url: i.url, isCover: i.isCover }))} />
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-display text-base font-bold">Documents ({documents.length})</h2>
            <DocumentManager vehicleId={id} documents={documents} />
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 font-display text-base font-bold">Auction</h2>
            <AuctionPanel
              vehicleId={id}
              saleType={vehicle.saleType}
              auction={
                auction
                  ? {
                      id: auction.id,
                      status: auction.status,
                      currency: auction.currency,
                      startingPrice: auction.startingPrice,
                      bidIncrement: auction.bidIncrement,
                      currentBid: auction.currentBid,
                      bidCount: auction.bidCount,
                      startsAt: auction.startsAt,
                      endsAt: auction.endsAt,
                    }
                  : null
              }
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
