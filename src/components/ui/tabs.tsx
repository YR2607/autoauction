"use client";
import { cn } from "@/lib/utils";

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-line bg-white p-1",
        className,
      )}
    >
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors",
            value === it.value
              ? "bg-graphite text-white"
              : "text-muted hover:text-graphite",
          )}
        >
          {it.label}
          {it.count != null && <span className="ml-1.5 opacity-60">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}
