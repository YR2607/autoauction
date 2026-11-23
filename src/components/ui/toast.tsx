"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle as CheckCircle2, XmarkCircle as XCircle, InfoCircle as Info } from "iconoir-react";
import { cn } from "@/lib/utils";

type Toast = { id: number; kind: "ok" | "err" | "info"; text: string };
const Ctx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});

export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[min(92vw,360px)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "anim-pop pointer-events-auto flex items-start gap-2.5 rounded-md border bg-white px-4 py-3 text-sm font-semibold shadow-pop",
              t.kind === "ok" && "border-success/30 text-success",
              t.kind === "err" && "border-error/30 text-error",
              t.kind === "info" && "border-line text-graphite",
            )}
          >
            {t.kind === "ok" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            {t.kind === "err" && <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            {t.kind === "info" && <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" />}
            <span className="text-graphite">{t.text}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
