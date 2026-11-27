"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLinks({ links }: { links: { href: string; label: string; badge?: string }[] }) {
  const path = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      {links.map((l) => {
        const active = path === l.href || (l.href !== "/" && path.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative px-3 py-2 text-[13px] font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5",
              active
                ? "border-[#ffb81c] text-[#ffb81c] bg-[#051a2e]/40"
                : "border-transparent text-white/90 hover:text-white hover:bg-[#072a47]",
            )}
          >
            <span>{l.label}</span>
            {l.badge && (
              <span className="rounded-none bg-[#cc0000] px-1.5 py-0.5 text-[9px] font-black text-white">
                {l.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
