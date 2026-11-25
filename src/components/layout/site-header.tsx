import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { SignOutButton } from "./sign-out-button";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { Logo } from "./logo";
import { Search } from "iconoir-react";

const links = [
  { href: "/auctions", label: "Auctions" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/auctions?auctionStatus=ended", label: "Results" },
  { href: "/buy-now", label: "Buy Now" },
  { href: "/#about", label: "About" },
];

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6">
          <Link href="/" aria-label="AutoAuction home" className="shrink-0">
            <Logo />
          </Link>

          <NavLinks links={links} />

          <div className="hidden items-center gap-3 xl:flex">
            {/* Catalog search — GET to /vehicles?q= */}
            <form action="/vehicles" method="get" className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tech" />
              <input
                type="search"
                name="q"
                placeholder="Make, model, lot…"
                className="h-8.5 w-44 border border-line bg-bg pl-8 pr-3 font-mono text-[12px] text-ink placeholder:text-tech focus:border-graphite2"
                aria-label="Search vehicles"
              />
            </form>
            <Link
              href="/sell"
              className="h-8.5 border border-ink px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-white"
            >
              Sell your car
            </Link>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-graphite2 transition-colors hover:text-ink"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/account"
                  className="px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-graphite2 transition-colors hover:text-ink"
                >
                  Account
                </Link>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-graphite2 transition-colors hover:text-ink"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-primary px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary-dark"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <MobileNav user={user} links={links} />
        </div>
    </header>
  );
}
