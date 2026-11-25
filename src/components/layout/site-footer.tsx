import Link from "next/link";
import { Mail, Globe } from "iconoir-react";
import { siteConfig } from "@/lib/site";
import { Logo } from "./logo";

export function SiteFooter({ flush = false }: { flush?: boolean }) {
  return (
    <footer className={`${flush ? "" : "mt-20 "}bg-ink text-white`}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
          <div>
            <Logo inverted />
            <p className="mt-4 max-w-xs font-display text-[19px] font-medium leading-snug text-white/85">
              Independent automotive auction house.
            </p>
            <p className="mt-3 max-w-xs text-[13.5px] leading-relaxed text-white/55">
              Timed auctions and fixed-price listings. Every sale reviewed by
              our team.
            </p>
            <p className="mt-5 flex items-center gap-2 font-mono text-[11.5px] uppercase tracking-[0.12em] text-white/45">
              <Globe className="h-3.5 w-3.5" /> {siteConfig.currencies.join(" · ")}
            </p>
            {siteConfig.contactEmail && (
              <p className="mt-1.5 flex items-center gap-2 font-mono text-[11.5px] tracking-[0.06em] text-white/55">
                <Mail className="h-3.5 w-3.5" />{" "}
                <a href={`mailto:${siteConfig.contactEmail}`} className="hover:text-white">
                  {siteConfig.contactEmail}
                </a>
              </p>
            )}
          </div>
          <FooterCol
            title="Auctions"
            items={[
              ["Live auctions", "/auctions"],
              ["Results archive", "/auctions?auctionStatus=ended"],
              ["Buy Now", "/buy-now"],
              ["Sell your car", "/sell"],
            ]}
          />
          <FooterCol
            title="Catalog"
            items={[
              ["All vehicles", "/vehicles"],
              ["How it works", "/#how-it-works"],
              ["About", "/#about"],
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
            title="Legal"
            items={[
              ["Terms of use", "/legal/terms"],
              ["Privacy policy", "/legal/privacy"],
              ["Sign in", "/login"],
              ["Create account", "/register"],
            ]}
          />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/35 sm:px-6">
          <span>© {new Date().getFullYear()} AutoAuction</span>
          <span>Timed auctions · Fixed-price listings</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h4 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {items.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-[13.5px] text-white/55 transition-colors hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
