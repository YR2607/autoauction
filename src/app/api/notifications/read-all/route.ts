import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  db.update(schema.notifications)
    .set({ readAt: Date.now() })
    .where(and(eq(schema.notifications.userId, user.id), isNull(schema.notifications.readAt)))
    .run();
  return NextResponse.json({ ok: true });
}
