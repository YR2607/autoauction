import Link from "next/link";
import { Mail, Globe } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-black text-ink">
              A
            </span>
            <span className="font-display text-lg font-extrabold">AutoAuction</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
            Premium vehicles. Transparent auctions. Every sale reviewed by our team.
          </p>
          <p className="mt-5 flex items-center gap-2 text-sm text-white/60">
            <Globe className="h-4 w-4" /> EUR · USD · GBP
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-white/60">
            <Mail className="h-4 w-4" /> support@autoauction.dev
          </p>
        </div>
        <FooterCol
          title="Marketplace"
          items={[
            ["All cars", "/vehicles"],
            ["Live auctions", "/auctions"],
            ["Buy Now", "/buy-now"],
            ["How it works", "/#how-it-works"],
          ]}
        />
        <FooterCol
          title="Account"
          items={[
            ["Dashboard", "/account"],
            ["My bids", "/account/bids"],
            ["Purchases", "/account/purchases"],
            ["Favorites", "/account/favorites"],
            ["Notifications", "/account/notifications"],
          ]}
        />
        <FooterCol
          title="Company"
          items={[
            ["Sign in", "/login"],
            ["Create account", "/register"],
            ["Terms of use", "/legal/terms"],
            ["Privacy policy", "/legal/privacy"],
          ]}
        />
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © {new Date().getFullYear()} AutoAuction. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h4 className="text-[13px] font-bold uppercase tracking-wider text-white/80">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {items.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-white/55 transition-colors hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
