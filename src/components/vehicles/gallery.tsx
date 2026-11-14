"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

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
      <div className="flex aspect-[16/10] items-center justify-center rounded-[14px] bg-graphite/5 text-sm text-muted">
        No photos
      </div>
    );

  return (
    <div>
      <div className="group/g relative aspect-[16/10] overflow-hidden rounded-[14px] bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[i]}
          alt={`${alt} — photo ${i + 1} of ${images.length}`}
          className="h-full w-full object-cover"
        />
        {images.length > 1 && (
          <>
            <NavBtn side="l" onClick={prev} />
            <NavBtn side="r" onClick={next} />
          </>
        )}
        <span className="tnum absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-white">
          {i + 1} / {images.length}
        </span>
        <button
          onClick={() => setZoom(true)}
          aria-label="Open fullscreen gallery"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-ink/80 focus-visible:opacity-100 group-hover/g:opacity-100"
        >
          <Expand className="h-4 w-4" />
        </button>
      </div>

      {images.length > 1 && (
        <div className="scroll-thin mt-3 flex gap-2.5 overflow-x-auto pb-1" role="tablist" aria-label="Photo thumbnails">
          {images.map((src, k) => (
            <button
              key={k}
              role="tab"
              aria-selected={k === i}
              aria-label={`Photo ${k + 1}`}
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
          className="anim-fade fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} — fullscreen gallery`}
          onClick={() => setZoom(false)}
        >
          <button
            onClick={() => setZoom(false)}
            aria-label="Close gallery"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <ZoomNav side="l" onClick={(e) => { e.stopPropagation(); prev(); }} />
              <ZoomNav side="r" onClick={(e) => { e.stopPropagation(); next(); }} />
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[i]}
            alt={`${alt} — photo ${i + 1} of ${images.length}`}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="tnum absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white">
            {i + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
}

function NavBtn({ side, onClick }: { side: "l" | "r"; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={side === "l" ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white ${side === "l" ? "left-3" : "right-3"}`}
    >
      {side === "l" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  );
}

function ZoomNav({ side, onClick }: { side: "l" | "r"; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === "l" ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 ${side === "l" ? "left-4" : "right-4"}`}
    >
      {side === "l" ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
    </button>
  );
}
