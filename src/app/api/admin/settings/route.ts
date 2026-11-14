import { NextRequest, NextResponse } from "next/server";
import { adminGuard, audit } from "@/lib/api";
import { setSetting } from "@/lib/settings";
import { z } from "zod";

const body = z.record(z.string(), z.unknown());

export async function PUT(req: NextRequest) {
  const g = await adminGuard();
  if (g instanceof NextResponse) return g;
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  for (const [key, value] of Object.entries(parsed.data)) {
    setSetting(key, value);
  }
  audit(g.user.id, "settings.update", "settings", "platform", null, parsed.data);
  return NextResponse.json({ ok: true });
}
