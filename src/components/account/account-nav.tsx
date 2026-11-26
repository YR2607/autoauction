"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/bids", label: "My Bids" },
  { href: "/account/purchases", label: "Purchases" },
  { href: "/account/favorites", label: "Watchlist" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountNav({
  isAdmin,
  unread = 0,
}: {
  isAdmin: boolean;
  unread?: number;
}) {
  const path = usePathname();
  return (
    <aside className="h-fit rounded-none border border-[#cbd5e1] bg-white p-2 lg:sticky lg:top-[130px]">
      <nav aria-label="Account" className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={path === i.href ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center justify-between rounded-none px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
              path === i.href
                ? "bg-[#0b3b60] text-white"
                : "text-[#334155] hover:bg-[#f1f5f9] hover:text-[#0b3b60]",
            )}
          >
            <span>{i.label}</span>
            {i.href === "/account/notifications" && unread > 0 && (
              <span
                className={cn(
                  "rounded-none px-1.5 py-0.2 text-[10px] font-bold",
                  path === i.href ? "bg-[#ffb81c] text-[#051a2e]" : "bg-[#cc0000] text-white",
                )}
              >
                {unread}
              </span>
            )}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin"
            className="mt-2 flex shrink-0 items-center rounded-none border-t border-[#cbd5e1] pt-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#b45309] hover:bg-[#fefce8]"
          >
            Admin Panel
          </Link>
        )}
      </nav>
    </aside>
  );
}
