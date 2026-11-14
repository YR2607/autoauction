import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db, schema } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { getSetting } from "@/lib/settings";
import { eq } from "drizzle-orm";

const body = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  firstName: z.string().max(80).optional(),
  lastName: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`auth:${ip}`, getSetting<number>("rate.authPerMin") ?? 10)) {
    return NextResponse.json({ error: "Too many attempts. Try later." }, { status: 429 });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const exists = db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).get();
  if (exists) return NextResponse.json({ error: "Email already registered." }, { status: 409 });

  const id = randomUUID();
  const t = Date.now();
  db.insert(schema.users)
    .values({ id, email, passwordHash: hashPassword(parsed.data.password), role: "buyer", createdAt: t, updatedAt: t })
    .run();
  db.insert(schema.userProfiles)
    .values({ userId: id, firstName: parsed.data.firstName ?? null, lastName: parsed.data.lastName ?? null })
    .run();

  const { token, expiresAt } = createSession(id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    path: "/",
  });
  return res;
}
