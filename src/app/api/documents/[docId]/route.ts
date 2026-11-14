import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getSessionUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { docStoreDir } from "@/lib/storage";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Serves vehicle documents. Public docs are open to everyone; private docs
// (ownership papers, registration) require an admin session.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params;
  const doc = db
    .select()
    .from(schema.vehicleDocuments)
    .where(eq(schema.vehicleDocuments.id, docId))
    .get();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!doc.isPublic) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Resolve inside the doc store — stored urls are relative; belt & braces
  // against any path escaping it.
  const filePath = path.resolve(docStoreDir(), doc.url);
  if (!filePath.startsWith(path.resolve(docStoreDir()) + path.sep))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!fs.existsSync(filePath))
    return NextResponse.json({ error: "File missing" }, { status: 404 });

  const ext = path.extname(filePath).slice(1).toLowerCase();
  const buf = fs.readFileSync(filePath);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.title)}.${ext}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": doc.isPublic ? "private, max-age=60" : "no-store",
    },
  });
}
