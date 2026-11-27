import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function FilterChip({
  label,
  value,
  onRemove,
  className,
}: {
  label?: string;
  value?: string;
  onRemove: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-none border border-[#cbd5e1] bg-[#f8fafc] px-2 py-0.5 text-xs font-semibold text-[#1e293b]",
        className,
      )}
    >
      {label && <span className="text-[#64748b]">{label}</span>}
      {value && <span className="font-bold text-[#0b3b60]">{value}</span>}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label ?? ""} ${value ?? ""}`}
        className="ml-0.5 text-[#94a3b8] hover:text-[#dc2626] cursor-pointer"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
