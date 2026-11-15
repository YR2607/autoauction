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
        "inline-flex items-center gap-1 rounded-full border border-line bg-white p-1",
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
            "rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
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
