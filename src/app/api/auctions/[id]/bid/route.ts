import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { placeBid, publicAuctionState, EngineError } from "@/features/auctions/engine";
import { rateLimit } from "@/lib/rate-limit";
import { getSetting } from "@/lib/settings";

const body = z.object({
  amountMinor: z.number().int().positive().max(10_000_000_000),
  idempotencyKey: z.string().min(8).max(64),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to bid." }, { status: 401 });
  if (user.status !== "active")
    return NextResponse.json({ error: "Account suspended." }, { status: 403 });

  if (!rateLimit(`bids:${user.id}`, getSetting<number>("rate.bidsPerMin") ?? 30)) {
    return NextResponse.json({ error: "Too many bids. Slow down." }, { status: 429 });
  }

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid bid payload." }, { status: 400 });

  const { id } = await params;
  try {
    const result = placeBid({
      auctionId: id,
      userId: user.id,
      userRole: user.role,
      amountMinor: parsed.data.amountMinor,
      idempotencyKey: parsed.data.idempotencyKey,
    });
    return NextResponse.json(
      { ...result, auction: publicAuctionState(result.auction) },
      { status: result.ok ? 200 : 422 },
    );
  } catch (e) {
    if (e instanceof EngineError && e.code === "NOT_FOUND")
      return NextResponse.json({ error: "Auction not found." }, { status: 404 });
    throw e;
  }
}
