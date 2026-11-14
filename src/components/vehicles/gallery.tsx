"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  if (!images.length)
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-[14px] bg-graphite/5 text-sm text-muted">
        No photos
      </div>
    );

  return (
    <div>
      <div
        className="relative aspect-[16/10] cursor-zoom-in overflow-hidden rounded-[14px] bg-ink"
        onClick={() => setZoom(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[i]}
          alt={`${alt} — photo ${i + 1}`}
          className="h-full w-full object-cover"
        />
        {images.length > 1 && (
          <>
            <NavBtn side="l" onClick={(e) => { e.stopPropagation(); setI((i - 1 + images.length) % images.length); }} />
            <NavBtn side="r" onClick={(e) => { e.stopPropagation(); setI((i + 1) % images.length); }} />
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-white">
              {i + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="scroll-thin mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {images.map((src, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                k === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-ink/90 p-4"
          onClick={() => setZoom(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[i]} alt={alt} className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </div>
  );
}

function NavBtn({ side, onClick }: { side: "l" | "r"; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === "l" ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white ${side === "l" ? "left-3" : "right-3"}`}
    >
      {side === "l" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  );
}
