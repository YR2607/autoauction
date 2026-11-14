import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { db, schema } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { eq } from "drizzle-orm";

const COOKIE = process.env.SESSION_COOKIE_NAME ?? "aa_session";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const ttlSec = getSetting<number>("auth.sessionTtlSec") ?? 2592000;
  const now = Date.now();
  db.insert(schema.sessions)
    .values({
      id: hashToken(token),
      userId,
      expiresAt: now + ttlSec * 1000,
      createdAt: now,
    })
    .run();
  return { token, expiresAt: now + ttlSec * 1000 };
}

export function destroySession(token: string) {
  db.delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token))).run();
}

export type SessionUser = {
  id: string;
  email: string;
  role: "buyer" | "admin";
  status: "active" | "suspended";
};

export function getUserByToken(token: string): SessionUser | null {
  const id = hashToken(token);
  const row = db
    .select({ session: schema.sessions, user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(eq(schema.sessions.id, id))
    .get();
  if (!row || row.session.expiresAt < Date.now()) return null;
  return {
    id: row.user.id,
    email: row.user.email,
    role: row.user.role,
    status: row.user.status,
  };
}

/** Server-component / handler helper — reads the session cookie. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return getUserByToken(token);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.status !== "active") throw new AuthError("UNAUTHORIZED");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new AuthError("FORBIDDEN");
  return user;
}

export class AuthError extends Error {
  constructor(public code: "UNAUTHORIZED" | "FORBIDDEN") {
    super(code);
  }
}

export const SESSION_COOKIE = COOKIE;
