"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/auctions", label: "Auctions" },
  { href: "/admin/approvals", label: "Approvals" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/bids", label: "Bids" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <aside className="h-fit rounded-[14px] border border-line bg-white p-2 lg:sticky lg:top-[72px]">
      {items.map((i) => {
        const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "block rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-graphite text-white" : "text-graphite/70 hover:bg-graphite/5",
            )}
          >
            {i.label}
          </Link>
        );
      })}
    </aside>
  );
}
