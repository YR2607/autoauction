import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { adminGuard, audit } from "@/lib/api";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const body = z.object({ status: z.enum(["active", "suspended"]), reason: z.string().optional() });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await adminGuard();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  if (id === g.user.id)
    return NextResponse.json({ error: "Cannot change your own status" }, { status: 400 });

  const before = db.select().from(schema.users).where(eq(schema.users.id, id)).get();
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.update(schema.users)
    .set({ status: parsed.data.status, updatedAt: Date.now() })
    .where(eq(schema.users.id, id))
    .run();
  if (parsed.data.status === "suspended") {
    db.delete(schema.sessions).where(eq(schema.sessions.userId, id)).run();
  }
  audit(g.user.id, "user.status", "user", id, { status: before.status }, parsed.data, parsed.data.reason);
  return NextResponse.json({ ok: true });
}
