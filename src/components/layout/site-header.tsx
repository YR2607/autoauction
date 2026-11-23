import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { SignOutButton } from "./sign-out-button";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { Logo } from "./logo";

const links = [
  { href: "/#about", label: "About" },
  { href: "/auctions", label: "Auctions" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/buy-now", label: "Buy Now" },
  { href: "/#how-it-works", label: "How It Works" },
];

export async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="AutoAuction home">
          <Logo />
        </Link>

        <NavLinks links={links} />

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-md px-4 py-2 text-[13.5px] font-medium text-graphite/70 transition-colors hover:bg-graphite/5 hover:text-ink"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/account"
                className="rounded-md px-4 py-2 text-[13.5px] font-medium text-graphite/70 transition-colors hover:bg-graphite/5 hover:text-ink"
              >
                Account
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-4 py-2 text-[13.5px] font-medium text-graphite/70 transition-colors hover:bg-graphite/5 hover:text-ink"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-cta px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-cta-hover"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <MobileNav user={user} links={links} />
      </div>
    </header>
  );
}
