"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DashboardDots as LayoutDashboard, ShoppingBag, Heart, Bell, User, ShieldCheck } from "iconoir-react";
import { Gavel } from "@phosphor-icons/react/ssr";

const accountItems = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/bids", label: "My Bids", icon: Gavel },
  { href: "/account/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/account/favorites", label: "Favorites", icon: Heart },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
];

const settingsItems = [{ href: "/account/profile", label: "Profile", icon: User }];

export function AccountNav({
  isAdmin,
  unread = 0,
}: {
  isAdmin: boolean;
  unread?: number;
}) {
  const path = usePathname();

  const renderItem = (i: (typeof accountItems)[0]) => {
    const active = path === i.href;
    return (
      <Link
        key={i.href}
        href={i.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex min-w-0 shrink-0 items-center gap-3 px-4 py-2.5 text-[13.5px] font-medium transition-colors lg:px-4",
          active
            ? "bg-white text-ink before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary"
            : "text-graphite2 hover:bg-white/60 hover:text-ink",
        )}
      >
        <i.icon className={cn("h-[17px] w-[17px] shrink-0", active ? "text-primary" : "text-tech")} aria-hidden />
        <span className="truncate">{i.label}</span>
        {i.href === "/account/notifications" && unread > 0 && (
          <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center bg-primary px-1 font-mono text-[9.5px] font-semibold text-white">
            {unread}
          </span>
        )}
      </Link>
    );
  };

  const section = (label: string, items: typeof accountItems) => (
    <div>
      <p className="px-4 pb-1.5 pt-4 font-mono text-[9.5px] font-semibold uppercase tracking-[0.22em] text-tech first:pt-3">
        {label}
      </p>
      <div className="flex flex-col">{items.map(renderItem)}</div>
    </div>
  );

  return (
    <aside className="h-fit w-full lg:sticky lg:top-20">
      <nav
        aria-label="Account"
        className="scroll-thin flex overflow-x-auto border-y border-line/70 lg:block lg:overflow-visible lg:border"
      >
        <div className="hidden lg:block">
          {section("Account", accountItems)}
          {section("Settings", settingsItems)}
          {isAdmin && (
            <div className="border-t border-line/70">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 text-[13.5px] font-semibold text-primary transition-colors hover:bg-white/60"
              >
                <ShieldCheck className="h-[17px] w-[17px] shrink-0" aria-hidden />
                Admin panel
              </Link>
            </div>
          )}
        </div>
        {/* mobile: flat strip */}
        <div className="flex lg:hidden">
          {[...accountItems, ...settingsItems].map((i) => {
            const active = path === i.href;
            return (
              <Link
                key={i.href}
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em]",
                  active ? "border-primary text-ink" : "border-transparent text-muted",
                )}
              >
                {i.label}
                {i.href === "/account/notifications" && unread > 0 && (
                  <span className="flex h-[16px] min-w-[16px] items-center justify-center bg-primary px-1 font-mono text-[9px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
