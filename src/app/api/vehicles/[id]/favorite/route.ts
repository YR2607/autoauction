import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { and, eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  db.insert(schema.favorites)
    .values({ userId: user.id, vehicleId: id, createdAt: Date.now() })
    .onConflictDoNothing()
    .run();
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  db.delete(schema.favorites)
    .where(and(eq(schema.favorites.userId, user.id), eq(schema.favorites.vehicleId, id)))
    .run();
  return NextResponse.json({ ok: true });
}
