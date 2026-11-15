"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, Star, ChevronLeft, ChevronRight } from "lucide-react";

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

  async function call(body?: unknown, form?: FormData) {
    setBusy(true);
    setErr(null);
    const r = await fetch(`/api/admin/vehicles/${vehicleId}/images`, {
      method: form ? "POST" : body && (body as any).imageId ? "DELETE" : "PATCH",
      body: form ?? JSON.stringify(body),
      headers: form ? undefined : { "Content-Type": "application/json" },
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setErr(d.error ?? "Request failed");
    router.refresh();
    setBusy(false);
  }

  function move(idx: number, dir: -1 | 1) {
    const order = images.map((i) => i.id);
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    [order[idx], order[j]] = [order[j], order[idx]];
    call({ order });
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
          if (f) {
            const fd = new FormData();
            fd.append("file", f);
            call(undefined, fd);
          }
          e.target.value = "";
        }}
      />
      <Button variant="outline" size="sm" loading={busy} onClick={() => input.current?.click()} className="w-full">
        <Upload className="h-4 w-4" /> {busy ? "Working…" : "Upload photo"}
      </Button>
      {err && <p className="mt-2 text-xs font-semibold text-error">{err}</p>}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {images.map((img, idx) => (
          <div key={img.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-graphite/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            {img.isCover && (
              <span className="absolute left-1 top-1 rounded bg-ink/80 px-1.5 py-0.5 text-[9px] font-bold text-white">COVER</span>
            )}
            <div className="absolute inset-x-0 bottom-0 hidden justify-center gap-1 bg-ink/60 p-1 group-hover:flex">
              <button
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="rounded bg-white/90 p-1 text-ink disabled:opacity-40"
                aria-label="Move left"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {!img.isCover && (
                <button
                  onClick={() => call({ coverId: img.id })}
                  className="rounded bg-white/90 p-1 text-ink"
                  aria-label="Set as cover"
                  title="Set as cover"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => move(idx, 1)}
                disabled={idx === images.length - 1}
                className="rounded bg-white/90 p-1 text-ink disabled:opacity-40"
                aria-label="Move right"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => call({ imageId: img.id })}
                className="rounded bg-error p-1 text-white"
                aria-label="Delete image"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {images.length === 0 && <p className="mt-3 text-center text-xs text-muted">No photos uploaded yet.</p>}
    </div>
  );
}
