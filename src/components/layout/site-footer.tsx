import Link from "next/link";
import { Logo } from "./logo";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-14 border-t-2 border-[#ffb81c] bg-[#051a2e] text-[#cbd5e1] text-xs">
      <div className="border-b border-white/10 bg-[#072a47]/60 py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 sm:px-6">
          <span className="font-bold uppercase tracking-wider text-white">
            Online Vehicle Auction Platform
          </span>
          <div className="flex flex-wrap items-center gap-4 text-[#94a3b8]">
            <span>24/7 Online Bidding</span>
            <span className="text-white/20">|</span>
            <span>Verified Condition Reports and Titles</span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-3 py-8 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo inverted className="h-9 w-auto" />
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-[#94a3b8]">
            Online vehicle auction marketplace. Live bidding on repairable, salvage, and clean title vehicles with documented inspection details.
          </p>
          <div className="mt-4 space-y-1 text-[#cbd5e1]">
            <p>
              Accepted Currencies: {siteConfig.currencies.join(" / ")}
            </p>
            {siteConfig.contactEmail && (
              <p>
                Email:{" "}
                <a href={`mailto:${siteConfig.contactEmail}`} className="hover:text-white underline">
                  {siteConfig.contactEmail}
                </a>
              </p>
            )}
          </div>
        </div>

        <FooterCol
          title="Search and Bid"
          items={[
            ["Vehicle Inventory", "/vehicles"],
            ["Live Online Auctions", "/auctions"],
            ["Buy It Now", "/buy-now"],
            ["Auction Calendar", "/auctions"],
            ["Popular Makes", "/vehicles"],
          ]}
        />

        <FooterCol
          title="Member Portal"
          items={[
            ["Member Dashboard", "/account"],
            ["My Bids and Offers", "/account/bids"],
            ["Won Vehicles", "/account/purchases"],
            ["Watchlist", "/account/favorites"],
            ["Notifications", "/account/notifications"],
          ]}
        />

        <FooterCol
          title="Support and Rules"
          items={[
            ["How to Buy at Auction", "/#how-it-works"],
            ["Member Sign In", "/login"],
            ["Register Account", "/register"],
            ["Terms of Service", "/legal/terms"],
            ["Privacy Policy", "/legal/privacy"],
          ]}
        />
      </div>

      <div className="border-t border-white/10 bg-[#031120] py-3 text-[#64748b]">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 px-3 sm:px-6 text-[11px]">
          <p>
            © {new Date().getFullYear()} AutoAuction Inc. All rights reserved. Bidding conducted under official auction rules.
          </p>
          <p className="text-[10px] text-[#475569]">
            All vehicles sold &ldquo;As-Is, Where-Is&rdquo; without warranty.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: [label: string, href: string][];
}) {
  return (
    <div>
      <h3 className="font-bold uppercase tracking-wider text-white text-xs border-b border-white/10 pb-1.5 mb-2.5">
        {title}
      </h3>
      <ul className="space-y-1.5 text-xs text-[#94a3b8]">
        {items.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="hover:text-white hover:underline transition-colors">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
