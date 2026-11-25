"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DashboardDots as LayoutDashboard, Car, BadgeCheck, Community as Users, Settings } from "iconoir-react";
import { Gavel, Receipt, HandCoins } from "@phosphor-icons/react/ssr";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/vehicles", label: "Vehicles", icon: Car },
  { href: "/admin/auctions", label: "Auctions", icon: Gavel },
  { href: "/admin/approvals", label: "Approvals", icon: BadgeCheck, key: "approvals" },
  { href: "/admin/orders", label: "Orders", icon: Receipt, key: "orders" },
  { href: "/admin/bids", label: "Bids", icon: HandCoins },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav({
  counts = {},
}: {
  counts?: { approvals?: number; orders?: number };
}) {
  const path = usePathname();
  return (
    <aside className="h-fit border border-line bg-white p-2 lg:sticky lg:top-[72px]">
      <nav aria-label="Admin" className="scroll-thin flex gap-0.5 overflow-x-auto lg:flex-col">
        {items.map((i) => {
          const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
          const n = i.key ? counts[i.key as "approvals" | "orders"] ?? 0 : 0;
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 border-l-2 px-3.5 py-2.5 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap transition-colors",
                active
                  ? "border-primary bg-bg text-ink"
                  : "border-transparent text-graphite2 hover:bg-bg hover:text-ink",
              )}
            >
              <i.icon className="h-4 w-4 shrink-0" aria-hidden />
              {i.label}
              {n > 0 && (
                <span
                  className={cn(
                    "ml-auto px-1.5 py-0.5 font-mono text-[10px] font-semibold",
                    active ? "bg-primary text-white" : "bg-warning/20 text-[#92600a]",
                  )}
                >
                  {n}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
