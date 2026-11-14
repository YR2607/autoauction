import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { publicAuctionState } from "@/features/auctions/engine";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auction = db.select().from(schema.auctions).where(eq(schema.auctions.id, id)).get();
  if (!auction) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(publicAuctionState(auction));
}
