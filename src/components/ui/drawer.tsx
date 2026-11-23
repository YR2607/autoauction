"use client";
import { useEffect, useId, useRef } from "react";
import { Xmark as X } from "iconoir-react";
import { useDialogA11y } from "@/lib/use-dialog-a11y";
import { cn } from "@/lib/utils";

/** Right slide-over panel (filters / nav). Mobile-only unless `desktop` is set. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  desktop,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Render on desktop too — used by button-triggered filter drawers. */
  desktop?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogA11y(open, onClose, panelRef);

  // When mobile-only (`lg:hidden`), if the viewport grows past the desktop
  // breakpoint while it is open, close it — otherwise the hidden overlay
  // would leave body scroll locked and the trap active.
  useEffect(() => {
    if (desktop || !open || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const close = () => mq.matches && onClose();
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, [open, onClose, desktop]);

  if (!open) return null;
  return (
    <div className={cn("fixed inset-0 z-50", !desktop && "lg:hidden")}>
      <div className="anim-fade absolute inset-0 bg-ink/50" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="anim-drawer absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-white shadow-pop outline-none"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id={titleId} className="font-display text-base font-bold">{title}</h2>
          <button
            onClick={onClose}
            aria-label={`Close ${title.toLowerCase()}`}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-graphite/5 hover:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
