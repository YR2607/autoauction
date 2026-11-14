import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, destroyUserSessions, SESSION_COOKIE } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { eq } from "drizzle-orm";

const body = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });

  const row = db.select().from(schema.users).where(eq(schema.users.id, user.id)).get();
  if (!row || !verifyPassword(parsed.data.currentPassword, row.passwordHash)) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }
  db.update(schema.users)
    .set({ passwordHash: hashPassword(parsed.data.newPassword), updatedAt: Date.now() })
    .where(eq(schema.users.id, user.id))
    .run();
  // Password changed → revoke all other sessions (keep the current one).
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  destroyUserSessions(user.id, token);
  return NextResponse.json({ ok: true });
}
