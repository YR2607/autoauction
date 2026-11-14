import { NextRequest, NextResponse } from "next/server";
import { adminGuard, audit, jsonError } from "@/lib/api";
import { vehicleSchema } from "@/lib/validation";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await adminGuard();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const parsed = vehicleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  try {
    const before = db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id)).get();
    if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
    db.update(schema.vehicles)
      .set({ ...parsed.data, updatedAt: Date.now() })
      .where(eq(schema.vehicles.id, id))
      .run();
    audit(g.user.id, "vehicle.update", "vehicle", id, before, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e);
  }
}

const statusBody = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await adminGuard();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const parsed = statusBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const before = db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id)).get();
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.update(schema.vehicles)
    .set({ status: parsed.data.status, updatedAt: Date.now() })
    .where(eq(schema.vehicles.id, id))
    .run();
  audit(g.user.id, "vehicle.status", "vehicle", id, { status: before.status }, parsed.data);
  return NextResponse.json({ ok: true });
}
