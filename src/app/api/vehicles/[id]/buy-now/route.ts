import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { buyNow, EngineError } from "@/features/auctions/engine";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to purchase." }, { status: 401 });
  if (user.status !== "active")
    return NextResponse.json({ error: "Account suspended." }, { status: 403 });
  if (!rateLimit(`buynow:${user.id}`, 5)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id } = await params;
  try {
    const { orderId } = buyNow({ vehicleId: id, userId: user.id, userRole: user.role });
    return NextResponse.json({ ok: true, orderId });
  } catch (e) {
    if (e instanceof EngineError) {
      const status = e.code === "NOT_FOUND" ? 404 : e.code === "FORBIDDEN_ROLE" ? 403 : 409;
      return NextResponse.json({ ok: false, error: e.message }, { status });
    }
    throw e;
  }
}
