import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { getSetting } from "@/lib/settings";
import { eq } from "drizzle-orm";

const body = z.object({ email: z.email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`auth:${ip}`, getSetting<number>("rate.authPerMin") ?? 10)) {
    return NextResponse.json({ error: "Too many attempts. Try later." }, { status: 429 });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const user = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  if (user.status !== "active") {
    return NextResponse.json({ error: "Account suspended." }, { status: 403 });
  }

  const { token, expiresAt } = createSession(user.id);
  const res = NextResponse.json({ ok: true, role: user.role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    path: "/",
  });
  return res;
}
