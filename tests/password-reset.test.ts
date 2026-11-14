import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, makeUser } from "./helpers";
import { createHash, randomBytes } from "node:crypto";

beforeEach(resetDb);

async function insertToken(userId: string, opts: { expiresAt?: number; usedAt?: number | null } = {}) {
  const { db, schema } = await import("@/lib/db");
  const raw = randomBytes(32).toString("hex");
  const now = Date.now();
  db.insert(schema.passwordResetTokens)
    .values({
      id: createHash("sha256").update(raw).digest("hex"),
      userId,
      expiresAt: opts.expiresAt ?? now + 30 * 60_000,
      usedAt: opts.usedAt ?? null,
      createdAt: now,
    })
    .run();
  return raw;
}

describe("password reset", () => {
  it("valid token resets the password and burns the token", async () => {
    const { resetPassword } = await import("@/features/auth/password-reset");
    const { verifyPassword } = await import("@/lib/auth/password");
    const { db, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const u = await makeUser();
    const raw = await insertToken(u);

    const res = resetPassword(raw, "newpassword123");
    expect(res.ok).toBe(true);

    const user = db.select().from(schema.users).where(eq(schema.users.id, u)).get()!;
    expect(verifyPassword("newpassword123", user.passwordHash)).toBe(true);
  });

  it("used token cannot be replayed", async () => {
    const { resetPassword } = await import("@/features/auth/password-reset");
    const u = await makeUser();
    const raw = await insertToken(u);
    expect(resetPassword(raw, "newpassword123").ok).toBe(true);
    const second = resetPassword(raw, "anotherpass1");
    expect(second.ok).toBe(false);
    expect(second.ok === false && second.reason).toBe("used");
  });

  it("expired token is rejected", async () => {
    const { resetPassword } = await import("@/features/auth/password-reset");
    const u = await makeUser();
    const raw = await insertToken(u, { expiresAt: Date.now() - 1000 });
    const res = resetPassword(raw, "newpassword123");
    expect(res.ok).toBe(false);
    expect(res.ok === false && res.reason).toBe("expired");
  });

  it("unknown token is rejected", async () => {
    const { resetPassword } = await import("@/features/auth/password-reset");
    await makeUser();
    const res = resetPassword("f".repeat(64), "newpassword123");
    expect(res.ok).toBe(false);
    expect(res.ok === false && res.reason).toBe("invalid");
  });

  it("reset revokes all existing sessions", async () => {
    const { resetPassword } = await import("@/features/auth/password-reset");
    const { db, schema } = await import("@/lib/db");
    const { eq, count } = await import("drizzle-orm");
    const u = await makeUser();
    const now = Date.now();
    db.insert(schema.sessions).values([
      { id: "s1", userId: u, expiresAt: now + 10000, createdAt: now },
      { id: "s2", userId: u, expiresAt: now + 10000, createdAt: now },
    ]).run();
    const raw = await insertToken(u);
    resetPassword(raw, "newpassword123");
    const left = db.select({ c: count() }).from(schema.sessions).where(eq(schema.sessions.userId, u)).get()!.c;
    expect(left).toBe(0);
  });

  it("only the token hash is stored — raw token absent from the table", async () => {
    const { db, schema } = await import("@/lib/db");
    const u = await makeUser();
    const raw = await insertToken(u);
    const rows = db.select().from(schema.passwordResetTokens).all();
    expect(rows.every((r) => r.id !== raw)).toBe(true);
    expect(rows[0].id).toBe(createHash("sha256").update(raw).digest("hex"));
  });
});
