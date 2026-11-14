// Password reset flow — short-lived, single-use tokens; only the SHA-256
// hash is stored so a database leak can't mint resets.
import { randomBytes, createHash } from "node:crypto";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { sendMail } from "@/lib/email";
import { hashPassword } from "@/lib/auth/password";

const TTL_MS = 30 * 60 * 1000; // 30 minutes

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export function baseUrl(): string {
  return process.env.APP_BASE_URL ?? "http://localhost:3100";
}

/** Create a reset token for an existing user and dispatch the email. */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.toLowerCase()))
    .get();
  if (!user || user.status !== "active") return; // silent — no enumeration

  const token = randomBytes(32).toString("hex");
  db.insert(schema.passwordResetTokens)
    .values({
      id: hash(token),
      userId: user.id,
      expiresAt: Date.now() + TTL_MS,
      createdAt: Date.now(),
    })
    .run();

  const link = `${baseUrl()}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: "Reset your AutoAuction password",
    text: `Hello,\n\nReset your password using this link (valid for 30 minutes, single use):\n\n${link}\n\nIf you didn't request this, ignore this email.`,
  });
}

export type ResetResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/**
 * Claim the token and set the new password atomically: the token is marked
 * used only if still valid, so a concurrent consume can never double-claim,
 * and the password is never changed without the token being burned.
 * Revokes all sessions for the user in the same transaction.
 */
export function resetPassword(token: string, newPassword: string): ResetResult {
  return db.transaction((tx) => {
    const row = tx
      .select()
      .from(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.id, hash(token)))
      .get();
    if (!row) return { ok: false, reason: "invalid" as const };
    if (row.usedAt != null) return { ok: false, reason: "used" as const };
    if (row.expiresAt <= Date.now()) return { ok: false, reason: "expired" as const };

    const claimed = tx
      .update(schema.passwordResetTokens)
      .set({ usedAt: Date.now() })
      .where(
        and(
          eq(schema.passwordResetTokens.id, row.id),
          isNull(schema.passwordResetTokens.usedAt),
          gt(schema.passwordResetTokens.expiresAt, Date.now()),
        ),
      )
      .run();
    if (claimed.changes === 0) return { ok: false, reason: "used" as const };

    tx.update(schema.users)
      .set({ passwordHash: hashPassword(newPassword), updatedAt: Date.now() })
      .where(eq(schema.users.id, row.userId))
      .run();
    tx.delete(schema.sessions)
      .where(eq(schema.sessions.userId, row.userId))
      .run();
    return { ok: true, userId: row.userId } as const;
  });
}
