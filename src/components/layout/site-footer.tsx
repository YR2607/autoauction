import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-graphite text-sm font-black text-white">
              A
            </span>
            <span className="font-display text-lg font-extrabold">AutoAuction</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            Premium vehicles. Transparent auctions. Every sale reviewed by our team.
          </p>
        </div>
        <FooterCol
          title="Marketplace"
          items={[
            ["All vehicles", "/vehicles"],
            ["Live auctions", "/auctions"],
            ["Buy Now", "/buy-now"],
          ]}
        />
        <FooterCol
          title="Account"
          items={[
            ["Dashboard", "/account"],
            ["My bids", "/account/bids"],
            ["Purchases", "/account/purchases"],
            ["Favorites", "/account/favorites"],
          ]}
        />
        <FooterCol
          title="Company"
          items={[
            ["How it works", "/#how-it-works"],
            ["Sign in", "/login"],
            ["Create account", "/register"],
          ]}
        />
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} AutoAuction. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h4 className="text-[13px] font-bold uppercase tracking-wider text-graphite">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {items.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-muted transition-colors hover:text-graphite">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
