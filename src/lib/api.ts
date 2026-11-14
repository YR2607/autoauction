import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { randomUUID } from "node:crypto";
import { db, schema } from "@/lib/db";

export async function adminGuard(): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return { user };
}

export function audit(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
  reason?: string,
) {
  db.insert(schema.adminAuditLogs)
    .values({
      id: randomUUID(),
      adminId,
      action,
      entityType,
      entityId,
      beforeJson: JSON.stringify(before ?? null),
      afterJson: JSON.stringify(after ?? null),
      reason,
      createdAt: Date.now(),
    })
    .run();
}

export function jsonError(e: unknown) {
  if (e instanceof Error) return NextResponse.json({ error: e.message }, { status: 400 });
  return NextResponse.json({ error: "Unknown error" }, { status: 400 });
}
