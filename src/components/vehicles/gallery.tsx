"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);

  const prev = useCallback(
    () => setI((c) => (c - 1 + images.length) % images.length),
    [images.length],
  );
  const next = useCallback(
    () => setI((c) => (c + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && zoom) setZoom(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [zoom, prev, next]);

  if (!images.length)
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-none bg-[#e2e8f0] text-xs text-[#94a3b8]">
        No photos available
      </div>
    );

  return (
    <div>
      <div className="group/g relative aspect-[16/10] overflow-hidden rounded-none bg-[#051a2e]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[i]}
          alt={`${alt} photo ${i + 1} of ${images.length}`}
          className="h-full w-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous photo"
              className="absolute left-0 top-1/2 -translate-y-1/2 flex h-12 w-8 items-center justify-center rounded-none bg-[#051a2e]/80 text-white hover:bg-[#0b3b60] transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next photo"
              className="absolute right-0 top-1/2 -translate-y-1/2 flex h-12 w-8 items-center justify-center rounded-none bg-[#051a2e]/80 text-white hover:bg-[#0b3b60] transition-colors cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        <span className="tnum absolute bottom-2 right-2 rounded-none bg-[#051a2e]/90 px-2 py-0.5 text-[11px] font-bold text-white">
          {i + 1} / {images.length}
        </span>
        <button
          onClick={() => setZoom(true)}
          aria-label="Open fullscreen gallery"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-none bg-[#051a2e]/80 text-white opacity-0 hover:bg-[#0b3b60] transition-opacity group-hover/g:opacity-100 cursor-pointer"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Photo thumbnails">
          {images.map((src, k) => (
            <button
              key={k}
              role="tab"
              aria-selected={k === i}
              aria-label={`Photo ${k + 1}`}
              onClick={() => setI(k)}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-none border-2 transition-colors cursor-pointer ${
                k === i ? "border-[#ffb81c]" : "border-transparent opacity-70 hover:opacity-100"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} gallery`}
          onClick={() => setZoom(false)}
        >
          <button
            onClick={() => setZoom(false)}
            aria-label="Close gallery"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-none bg-white/20 text-white hover:bg-white/30 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-14 w-10 items-center justify-center rounded-none bg-white/10 text-white hover:bg-white/20 cursor-pointer"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-14 w-10 items-center justify-center rounded-none bg-white/10 text-white hover:bg-white/20 cursor-pointer"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[i]}
            alt={`${alt} photo ${i + 1} of ${images.length}`}
            className="max-h-full max-w-full rounded-none object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="tnum absolute bottom-4 left-1/2 -translate-x-1/2 rounded-none bg-black/80 px-3 py-1 text-xs font-bold text-white">
            {i + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
}
