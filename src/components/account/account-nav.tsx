"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/bids", label: "My Bids" },
  { href: "/account/purchases", label: "Purchases" },
  { href: "/account/favorites", label: "Favorites" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  return (
    <aside className="h-fit rounded-[14px] border border-line bg-white p-2 lg:sticky lg:top-20">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={cn(
            "block rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
            path === i.href
              ? "bg-graphite text-white"
              : "text-graphite/70 hover:bg-graphite/5",
          )}
        >
          {i.label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          href="/admin"
          className="mt-1 block rounded-lg border-t border-line px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5"
        >
          → Admin panel
        </Link>
      )}
    </aside>
  );
}
