import { NextResponse } from "next/server";
import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Public liveness probe for load balancers / orchestrators.
// Deliberately minimal: lightweight SELECT 1 (not PRAGMA quick_check), and
// no internal details — versions, paths, SQL errors stay in server logs.
export async function GET() {
  try {
    sqlite.prepare("SELECT 1").get();
    return NextResponse.json({
      ok: true,
      db: "ok",
      uptime: Math.round(process.uptime()),
      time: Date.now(),
    });
  } catch (e) {
    console.error("health check failed:", e);
    return NextResponse.json(
      { ok: false, error: "database_unavailable" },
      { status: 503 },
    );
  }
}
