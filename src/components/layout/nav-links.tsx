"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
      {links.map((l) => {
        const base = l.href.split("?")[0];
        const active =
          path === base || (base !== "/" && path.startsWith(base));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative px-3.5 py-2 font-mono text-[11.5px] font-semibold uppercase tracking-[0.12em] transition-colors",
              active
                ? "text-ink after:absolute after:inset-x-3.5 after:-bottom-[15px] after:h-[2px] after:bg-primary"
                : "text-graphite2 hover:text-ink",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
