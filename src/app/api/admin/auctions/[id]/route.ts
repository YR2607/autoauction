import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminGuard, jsonError } from "@/lib/api";
import { EngineError } from "@/features/auctions/engine";
import {
  scheduleAuction,
  cancelAuction,
  approveResult,
  rejectResult,
} from "@/features/auctions/decisions";

const actionBody = z.discriminatedUnion("action", [
  z.object({ action: z.literal("schedule") }),
  z.object({ action: z.literal("cancel"), reason: z.string().min(3) }),
  z.object({ action: z.literal("approve") }),
  z.object({
    action: z.literal("reject"),
    reason: z.string().min(3),
    next: z.enum(["REOPEN", "NEXT_BIDDER", "UNSOLD"]),
    newEndsAt: z.number().int().positive().optional(),
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
    switch (d.action) {
      case "schedule":
        scheduleAuction(id, g.user.id);
        break;
      case "cancel":
        cancelAuction(id, g.user.id, d.reason);
        break;
      case "approve":
        approveResult(id, g.user.id);
        break;
      case "reject":
        rejectResult(id, g.user.id, d.reason, d.next, d.newEndsAt);
        break;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof EngineError)
      return NextResponse.json({ error: e.message }, { status: 400 });
    return jsonError(e);
  }
}
