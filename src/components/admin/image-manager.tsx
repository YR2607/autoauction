"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Upload } from "lucide-react";

export function ImageManager({
  vehicleId,
  images,
}: {
  vehicleId: string;
  images: { id: string; url: string; isCover: boolean }[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`/api/admin/vehicles/${vehicleId}/images`, { method: "POST", body: fd });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setErr(d.error ?? "Upload failed");
    router.refresh();
    setBusy(false);
  }

  async function remove(imageId: string) {
    setBusy(true);
    await fetch(`/api/admin/vehicles/${vehicleId}/images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <Button variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()} className="w-full">
        <Upload className="h-4 w-4" /> {busy ? "Uploading…" : "Upload photo"}
      </Button>
      {err && <p className="mt-2 text-xs font-semibold text-error">{err}</p>}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-graphite/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            {img.isCover && (
              <span className="absolute left-1 top-1 rounded bg-ink/80 px-1.5 py-0.5 text-[9px] font-bold text-white">COVER</span>
            )}
            <button
              onClick={() => remove(img.id)}
              className="absolute right-1 top-1 hidden rounded bg-error p-1 text-white group-hover:block"
              aria-label="Delete image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      {images.length === 0 && <p className="mt-3 text-center text-xs text-muted">No photos uploaded yet.</p>}
    </div>
  );
}
