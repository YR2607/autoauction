import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { adminGuard, audit, jsonError } from "@/lib/api";
import { vehicleSchema } from "@/lib/validation";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const g = await adminGuard();
  if (g instanceof NextResponse) return g;
  const parsed = vehicleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  try {
    const d = parsed.data;
    const id = randomUUID();
    const t = Date.now();
    const slugBase = slugify(`${d.make} ${d.model} ${d.year}`);
    const seq = db
      .select({ c: schema.vehicles.lotNumber })
      .from(schema.vehicles)
      .orderBy(desc(schema.vehicles.createdAt))
      .limit(1)
      .get();
    const lotNum = seq?.c ? parseInt(seq.c.replace(/\D/g, "")) + 1 : 1001;
    const slug = `${slugBase}-${lotNum}`;

    db.insert(schema.vehicles)
      .values({
        id,
        slug,
        lotNumber: `AA-${lotNum}`,
        ...d,
        status: "DRAFT",
        createdById: g.user.id,
        createdAt: t,
        updatedAt: t,
      })
      .run();
    audit(g.user.id, "vehicle.create", "vehicle", id, null, d);
    return NextResponse.json({ ok: true, id, slug });
  } catch (e) {
    return jsonError(e);
  }
}
