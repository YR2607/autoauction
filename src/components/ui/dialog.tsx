"use client";
import { cn } from "@/lib/utils";
import { useId, useRef } from "react";
import { Button } from "./button";
import { useDialogA11y } from "@/lib/use-dialog-a11y";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogA11y(open, onClose, panelRef);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "w-full rounded-none border-2 border-[#0b3b60] bg-white p-5 outline-none text-xs",
          width,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="border-b border-[#cbd5e1] pb-2 text-sm font-bold uppercase tracking-wider text-[#0b3b60]">
          {title}
        </h3>
        <div className="mt-3 text-xs leading-relaxed text-[#334155]">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2 border-t border-[#f1f5f9] pt-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = "Confirm",
  danger,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="sm"
            loading={busy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
