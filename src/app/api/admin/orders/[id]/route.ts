import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminGuard, jsonError } from "@/lib/api";
import { EngineError } from "@/features/auctions/engine";
import { approveOrder, rejectOrder, completeOrder } from "@/features/auctions/decisions";

const actionBody = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({
    action: z.literal("reject"),
    reason: z.string().min(3),
    // When the order's Buy Now ended an auction: reopen it (with a new
    // end time) or mark it unsold. Defaults to UNSOLD.
    auctionAction: z.enum(["REOPEN", "UNSOLD"]).optional(),
    newEndsAt: z.number().int().positive().optional(),
  }),
  z.object({
    action: z.literal("complete"),
    paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
  }),
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await adminGuard();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const parsed = actionBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  try {
    const d = parsed.data;
    if (d.action === "approve") approveOrder(id, g.user.id);
    else if (d.action === "reject")
      rejectOrder(id, g.user.id, d.reason, {
        auctionAction: d.auctionAction,
        newEndsAt: d.newEndsAt,
      });
    else completeOrder(id, g.user.id, d.paymentStatus);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof EngineError)
      return NextResponse.json({ error: e.message }, { status: 400 });
    return jsonError(e);
  }
}
