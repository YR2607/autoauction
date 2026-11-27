import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { SignOutButton } from "./sign-out-button";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { SearchBar } from "@/components/vehicles/search-bar";
import { Logo } from "./logo";
import { Shield, User, Globe, HelpCircle } from "lucide-react";

const mainLinks = [
  { href: "/vehicles", label: "Find Vehicles" },
  { href: "/auctions", label: "Live Auctions", badge: "LIVE" },
  { href: "/buy-now", label: "Buy Now" },
  { href: "/#how-it-works", label: "How It Works" },
];

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-40 w-full shadow-md">
      <div className="bg-[#051a2e] text-[#cbd5e1] border-b border-[#0f2e4d]">
        <div className="mx-auto flex h-7 max-w-7xl items-center justify-between px-3 text-[11px] sm:px-6">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-white/80">Online Vehicle Auctions</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1">
              <Globe className="h-3 w-3 text-[#ffb81c]" /> EUR / USD
            </span>
            <span className="text-white/40">|</span>
            <span className="font-bold text-white">EN</span>
            <span className="text-white/40">|</span>
            <Link href="/#how-it-works" className="hover:text-white flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> Help
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-[#0b3b60] border-b border-[#072a47]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center" aria-label="AutoAuction Home">
            <Logo inverted className="h-10 w-auto" />
          </Link>

          <div className="hidden flex-1 max-w-xl md:block mx-4">
            <SearchBar placeholder="Search make, model, VIN or lot number..." />
          </div>

          <div className="hidden items-center gap-3 md:flex shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1 bg-[#072a47] border border-[#ffb81c]/50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#ffb81c] hover:bg-[#051a2e]"
                  >
                    <Shield className="h-3.5 w-3.5" /> Admin
                  </Link>
                )}
                <Link
                  href="/account"
                  className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20"
                >
                  <User className="h-3.5 w-3.5 text-[#ffb81c]" /> Account
                </Link>
                <SignOutButton />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="border border-white/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-[#ffb81c] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#051a2e] transition-colors hover:bg-[#e5a519]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <MobileNav user={user} links={mainLinks} />
        </div>
      </div>

      <div className="bg-[#072a47] border-b border-[#051a2e]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6">
          <NavLinks links={mainLinks} />

          <div className="hidden lg:flex items-center gap-4 text-xs font-bold uppercase text-[#cbd5e1] py-1">
            <span className="text-[#86efac]">● Online Bidding 24/7</span>
            <Link href="/vehicles?saleType=BUY_NOW" className="hover:text-white">
              Buy It Now
            </Link>
            <Link href="/vehicles?auctionStatus=LIVE" className="hover:text-[#ffb81c]">
              Hot Auctions
            </Link>
          </div>
        </div>
      </div>

      <div className="md:hidden bg-[#072a47] px-3 py-2 border-t border-[#051a2e]">
        <SearchBar placeholder="Make, model, VIN or lot number..." />
      </div>
    </header>
  );
}
