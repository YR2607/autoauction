import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { adminGuard, audit } from "@/lib/api";
import { db, schema } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { sniffImage } from "@/lib/media";
import { eq, sql } from "drizzle-orm";

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

  const maxBytes = getSetting<number>("media.maxUploadBytes") ?? 10_485_760;
  if (file.size > maxBytes)
    return NextResponse.json({ error: "File too large" }, { status: 400 });

  // Validate content, not the declared Content-Type — a spoofed MIME would
  // otherwise let HTML/SVG be stored and served under a .png name.
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniffImage(buf);
  if (!ext)
    return NextResponse.json({ error: "Only JPEG/PNG/WebP/AVIF images allowed" }, { status: 400 });

  const count = db
    .select({ c: sql<number>`count(*)` })
    .from(schema.vehicleImages)
    .where(eq(schema.vehicleImages.vehicleId, id))
    .get()?.c ?? 0;
  if (count >= (getSetting<number>("media.maxImages") ?? 30))
    return NextResponse.json({ error: "Image limit reached" }, { status: 400 });

  const dir = path.join(process.cwd(), "public", "uploads", "vehicles", id);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(dir, name), buf);

  const url = `/uploads/vehicles/${id}/${name}`;
  const imgId = randomUUID();
  db.insert(schema.vehicleImages)
    .values({
      id: imgId,
      vehicleId: id,
      url,
      sortOrder: count,
      isCover: count === 0,
      createdAt: Date.now(),
    })
    .run();
  audit(g.user.id, "vehicle.image.add", "vehicle", id, null, { url });
  return NextResponse.json({ ok: true, id: imgId, url });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const g = await adminGuard();
  if (g instanceof NextResponse) return g;
  const { id } = await params;
  const { imageId } = (await req.json().catch(() => ({}))) as { imageId?: string };
  if (!imageId) return NextResponse.json({ error: "imageId required" }, { status: 400 });
  const img = db
    .select()
    .from(schema.vehicleImages)
    .where(eq(schema.vehicleImages.id, imageId))
    .get();
  if (!img || img.vehicleId !== id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.delete(schema.vehicleImages).where(eq(schema.vehicleImages.id, imageId)).run();
  const p = path.join(process.cwd(), "public", img.url.replace(/^\//, ""));
  if (img.url.startsWith("/uploads/") && fs.existsSync(p)) fs.unlinkSync(p);
  audit(g.user.id, "vehicle.image.delete", "vehicle", id, { url: img.url }, null);
  return NextResponse.json({ ok: true });
}
