"use client";
import { cn } from "@/lib/utils";
import { useRef } from "react";

export function Tabs({
  items,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  items: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIdx = Math.max(0, items.findIndex((i) => i.value === value));

  function onKeyDown(e: React.KeyboardEvent) {
    let next = -1;
    if (e.key === "ArrowRight") next = (activeIdx + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (activeIdx - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(items[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex items-center gap-1 rounded-none border border-[#cbd5e1] bg-white p-1",
        className,
      )}
    >
      {items.map((it, i) => (
        <button
          key={it.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          role="tab"
          aria-selected={value === it.value}
          tabIndex={value === it.value ? 0 : -1}
          onClick={() => onChange(it.value)}
          className={cn(
            "rounded-none px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b3b60]",
            value === it.value
              ? "bg-[#0b3b60] text-white"
              : "text-[#64748b] hover:text-[#0b3b60] hover:bg-[#f1f5f9]",
          )}
        >
          {it.label}
          {it.count != null && (
            <span
              className={cn(
                "ml-1.5 px-1 py-0.5 text-[10px] font-bold",
                value === it.value ? "bg-[#072a47] text-white" : "bg-[#f1f5f9] text-[#64748b]",
              )}
            >
              {it.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
