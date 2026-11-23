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
    <aside className="h-fit rounded-lg border border-line bg-white p-2 shadow-xs lg:sticky lg:top-[72px]">
      <nav aria-label="Admin" className="scroll-thin flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((i) => {
          const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
          const n = i.key ? counts[i.key as "approvals" | "orders"] ?? 0 : 0;
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-md px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                active ? "bg-ink text-white" : "text-graphite/70 hover:bg-graphite/5",
              )}
            >
              <i.icon className="h-4 w-4 shrink-0" aria-hidden />
              {i.label}
              {n > 0 && (
                <span
                  className={cn(
                    "ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold",
                    active ? "bg-white/20 text-white" : "bg-warning/20 text-[#92600a]",
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
