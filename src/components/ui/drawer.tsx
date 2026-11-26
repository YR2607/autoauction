"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { useDialogA11y } from "@/lib/use-dialog-a11y";

/** Right slide-over panel (mobile filters / nav). */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogA11y(open, onClose, panelRef);

  // The drawer is mobile-only (`lg:hidden`). If the viewport grows past the
  // desktop breakpoint while it is open, close it — otherwise the hidden
  // overlay would leave body scroll locked and the trap active.
  useEffect(() => {
    if (!open || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const close = () => mq.matches && onClose();
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
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
            className="rounded-none p-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0b3b60]"
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
