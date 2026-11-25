import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { siteConfig } from "@/lib/site";
import { ArrowRight } from "iconoir-react";

export const metadata: Metadata = {
  title: "Sell your car",
  description:
    "Consign your vehicle with AutoAuction — curated timed auctions and fixed-price listings.",
};

export default function SellPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
            Consignment
          </p>
          <h1 className="mt-4 font-display text-[36px] font-medium leading-[1.08] text-ink sm:text-[46px]">
            Sell your vehicle with AutoAuction.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-graphite/80">
            Every listing on AutoAuction is curated. Our team reviews each
            vehicle, prepares the lot documentation and presents it to bidders
            through a timed auction or a fixed-price listing.
          </p>
        </div>

        <ol className="mt-12 max-w-3xl divide-y divide-line border-y border-line">
          {[
            {
              t: "Tell us about the vehicle",
              d: "Share the make, model, year, mileage, service history and condition details.",
            },
            {
              t: "Documentation & photography",
              d: "We prepare a lot page with detailed photography, a condition report and supporting documents.",
            },
            {
              t: "Auction or fixed price",
              d: "Your vehicle is offered through a live timed auction or a fixed-price listing.",
            },
            {
              t: "Reviewed sale",
              d: "Every winning bid and purchase request is reviewed by our team before the deal is finalized.",
            },
          ].map((s, i) => (
            <li
              key={s.t}
              className="grid gap-1.5 py-6 sm:grid-cols-[72px_260px_1fr] sm:items-baseline sm:gap-6"
            >
              <span className="tnum font-display text-[26px] font-medium text-tech/60">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display text-[19px] font-medium text-ink">
                {s.t}
              </h2>
              <p className="text-sm leading-relaxed text-muted">{s.d}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex max-w-3xl flex-wrap items-center gap-x-8 gap-y-4 border border-line bg-surface px-6 py-6">
          <div>
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-tech">
              Get in touch
            </p>
            <p className="mt-1.5 text-[14.5px] text-graphite/80">
              {siteConfig.contactEmail
                ? "Send us your vehicle details to start the consignment review."
                : "Consignment requests are handled directly by our team. Create an account to get started."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {siteConfig.contactEmail ? (
              <a
                href={`mailto:${siteConfig.contactEmail}?subject=Consignment request`}
                className="inline-flex h-11 items-center gap-2 bg-ink px-7 text-[14px] font-semibold text-white transition-colors hover:bg-primary"
              >
                {siteConfig.contactEmail}
              </a>
            ) : (
              <Link
                href="/register"
                className="inline-flex h-11 items-center gap-2 bg-ink px-7 text-[14px] font-semibold text-white transition-colors hover:bg-primary"
              >
                Create an account
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              href="/vehicles"
              className="inline-flex h-11 items-center border border-line px-7 font-mono text-[11.5px] font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
            >
              Browse the catalog
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
