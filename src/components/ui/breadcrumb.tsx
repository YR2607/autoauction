import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-[#64748b]">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 text-[#94a3b8]" aria-hidden />}
            {it.href ? (
              <Link href={it.href} className="hover:text-[#0b3b60] hover:underline">
                {it.label}
              </Link>
            ) : (
              <span className="font-bold text-[#0b3b60]" aria-current="page">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
