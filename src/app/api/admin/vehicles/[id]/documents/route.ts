import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { adminGuard, audit } from "@/lib/api";
import { db, schema } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { sniffDocument } from "@/lib/media";
import { docStoreDir } from "@/lib/storage";
import { eq } from "drizzle-orm";

const meta = z.object({
  title: z.string().min(1).max(120),
  kind: z.enum(["inspection", "registration", "ownership", "other"]).default("other"),
  isPublic: z.boolean().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await adminGuard();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  if (!/^[a-z0-9-]+$/i.test(id))
    return NextResponse.json({ error: "Invalid vehicle id" }, { status: 400 });

  const vehicle = db.select().from(schema.vehicles).where(eq(schema.vehicles.id, id)).get();
  if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "file required" }, { status: 400 });

  const parsed = meta.safeParse({
    title: form?.get("title") ?? file.name,
    kind: form?.get("kind") ?? "other",
    isPublic: form?.get("isPublic") === "true" || form?.get("isPublic") === "on",
  });
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid document metadata" }, { status: 400 });

  const maxBytes = getSetting<number>("media.maxUploadBytes") ?? 10_485_760;
  if (file.size > maxBytes)
    return NextResponse.json({ error: "File too large" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniffDocument(buf);
  if (!ext)
    return NextResponse.json({ error: "Only PDF/JPEG/PNG/WebP documents allowed" }, { status: 400 });

  // Private store — outside public/, served only via the authorized route.
  const dir = path.join(docStoreDir(), id);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(dir, name), buf);
  fs.chmodSync(path.join(dir, name), 0o600);

  const docId = randomUUID();
  db.insert(schema.vehicleDocuments)
    .values({
      id: docId,
      vehicleId: id,
      title: parsed.data.title,
      url: `${id}/${name}`, // relative to doc store root, never a public path
      kind: parsed.data.kind,
      isPublic: parsed.data.isPublic,
      createdAt: Date.now(),
    })
    .run();
  audit(g.user.id, "vehicle.document.add", "vehicle", id, null, { docId, title: parsed.data.title });
  return NextResponse.json({ ok: true, id: docId });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await adminGuard();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const { documentId } = (await req.json().catch(() => ({}))) as { documentId?: string };
  if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });

  const doc = db
    .select()
    .from(schema.vehicleDocuments)
    .where(eq(schema.vehicleDocuments.id, documentId))
    .get();
  if (!doc || doc.vehicleId !== id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.delete(schema.vehicleDocuments).where(eq(schema.vehicleDocuments.id, documentId)).run();
  const p = path.join(docStoreDir(), doc.url);
  const resolved = path.resolve(p);
  if (resolved.startsWith(path.resolve(docStoreDir())) && fs.existsSync(resolved)) {
    fs.unlinkSync(resolved);
  }
  audit(g.user.id, "vehicle.document.delete", "vehicle", id, { documentId, title: doc.title }, null);
  return NextResponse.json({ ok: true });
}
