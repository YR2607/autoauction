"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DashboardDots as LayoutDashboard, ShoppingBag, Heart, Bell, User, ShieldCheck } from "iconoir-react";
import { Gavel } from "@phosphor-icons/react/ssr";

const items = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/bids", label: "My Bids", icon: Gavel },
  { href: "/account/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/account/favorites", label: "Favorites", icon: Heart },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/profile", label: "Profile", icon: User },
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
    <aside className="h-fit rounded-lg border border-line bg-white p-2 lg:sticky lg:top-20">
      <nav aria-label="Account" className="scroll-thin flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={path === i.href ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-md px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              path === i.href
                ? "bg-ink text-white"
                : "text-graphite/70 hover:bg-graphite/5",
            )}
          >
            <i.icon className="h-4 w-4 shrink-0" aria-hidden />
            {i.label}
            {i.href === "/account/notifications" && unread > 0 && (
              <span
                className={cn(
                  "ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold",
                  path === i.href ? "bg-white/20 text-white" : "bg-cta text-white",
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
            className="mt-1 flex shrink-0 items-center gap-2.5 rounded-lg border-t border-line px-3.5 py-2.5 text-sm font-bold text-primary hover:bg-primary/5"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden /> Admin panel
          </Link>
        )}
      </nav>
    </aside>
  );
}
