import { NextRequest, NextResponse } from "next/server";
import { adminGuard, jsonError } from "@/lib/api";
import { auctionSchema } from "@/lib/validation";
import { EngineError } from "@/features/auctions/engine";
import { createAuction } from "@/features/auctions/decisions";

export async function POST(req: NextRequest) {
  const g = await adminGuard();
  if (g instanceof NextResponse) return g;
  const parsed = auctionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  try {
    const id = createAuction({ ...parsed.data, adminId: g.user.id });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    if (e instanceof EngineError)
      return NextResponse.json({ error: e.message }, { status: 400 });
    return jsonError(e);
  }
}
