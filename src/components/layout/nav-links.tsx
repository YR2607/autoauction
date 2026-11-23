"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
      {links.map((l) => {
        const active = path === l.href || (l.href !== "/" && path.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative px-4 py-2 text-[13.5px] font-medium transition-colors",
              active
                ? "text-ink after:absolute after:inset-x-4 after:-bottom-[13px] after:h-[2px] after:bg-ink"
                : "text-graphite/60 hover:text-ink",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
