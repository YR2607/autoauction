"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/auctions", label: "Auctions" },
  { href: "/admin/approvals", label: "Approvals", key: "approvals" },
  { href: "/admin/orders", label: "Orders", key: "orders" },
  { href: "/admin/bids", label: "Bids" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({
  counts = {},
}: {
  counts?: { approvals?: number; orders?: number };
}) {
  const path = usePathname();
  return (
    <aside className="h-fit rounded-none border border-[#cbd5e1] bg-white p-2 lg:sticky lg:top-[72px]">
      <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((i) => {
          const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
          const n = i.key ? counts[i.key as "approvals" | "orders"] ?? 0 : 0;
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center justify-between rounded-none px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
                active ? "bg-[#0b3b60] text-white" : "text-[#334155] hover:bg-[#f1f5f9] hover:text-[#0b3b60]",
              )}
            >
              <span>{i.label}</span>
              {n > 0 && (
                <span
                  className={cn(
                    "ml-auto rounded-none px-1.5 py-0.2 text-[10px] font-bold",
                    active ? "bg-[#ffb81c] text-[#051a2e]" : "bg-[#b45309] text-white",
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
