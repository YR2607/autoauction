import { NextResponse } from "next/server";
import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Liveness + DB probe for load balancers / orchestrators.
export async function GET() {
  try {
    const check = sqlite.prepare("PRAGMA quick_check").pluck().get() as string;
    return NextResponse.json({
      ok: check === "ok",
      db: check,
      uptime: Math.round(process.uptime()),
      time: Date.now(),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 503 });
  }
}
