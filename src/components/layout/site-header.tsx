import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { SignOutButton } from "./sign-out-button";
import { MobileNav } from "./mobile-nav";

const links = [
  { href: "/vehicles", label: "Vehicles" },
  { href: "/auctions", label: "Auctions" },
  { href: "/buy-now", label: "Buy Now" },
];

export async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-graphite text-sm font-black text-white">
            A
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            AutoAuction
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-graphite/80 transition-colors hover:bg-graphite/5 hover:text-graphite"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/account"
                className="rounded-full px-4 py-2 text-sm font-semibold text-graphite/80 hover:bg-graphite/5"
              >
                Account
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-graphite/80 hover:bg-graphite/5"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-graphite px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink"
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
