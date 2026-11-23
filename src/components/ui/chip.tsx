"use client";
import { Xmark as X } from "iconoir-react";
import { cn } from "@/lib/utils";

/** Removable filter chip. */
export function FilterChip({
  label,
  onRemove,
  className,
}: {
  label: string;
  onRemove: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-line bg-bg-alt px-3 py-1.5 text-xs font-semibold text-graphite",
        className,
      )}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="rounded p-0.5 hover:bg-graphite/10"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
