"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
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
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              active ? "bg-graphite/[0.06] text-graphite" : "text-graphite/70 hover:bg-graphite/5 hover:text-graphite",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
