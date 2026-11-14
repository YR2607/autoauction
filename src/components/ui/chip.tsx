"use client";
import { X } from "lucide-react";
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
        "inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-dark",
        className,
      )}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="rounded-full p-0.5 hover:bg-primary/10"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
