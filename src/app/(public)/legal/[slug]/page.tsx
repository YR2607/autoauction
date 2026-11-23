import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

/**
 * Draft legal documents. These texts describe how the marketplace
 * operates, but they are NOT final legal terms — the launch jurisdiction
 * is not confirmed yet and every page is marked accordingly.
 */
const PAGES: Record<string, { title: string; body: string[] }> = {
  terms: {
    title: "Terms of Use",
    body: [
      "AutoAuction is an online vehicle marketplace. Vehicles are offered via timed auctions and fixed-price (Buy Now) listings.",
      "By placing a bid or submitting a Buy Now request you express your intent to purchase. Every winning bid and every purchase request is reviewed by our team. A sale is completed only after it has been confirmed by the marketplace operator.",
      "Vehicle information, including condition and damage disclosures, is provided for each listing. Buyers are encouraged to review all available documentation and images before bidding.",
      "Accounts may be suspended for abusive behavior, fraudulent bids or violations of marketplace rules.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "The marketplace stores the data required to operate: your account details, bids, orders, favorites and notifications.",
      "We do not sell personal data. Other bidders' identities are not disclosed. Public bid history shows masked aliases only.",
      "Questions about your data can be raised through the contact channel published on this website.",
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: PAGES[slug]?.title ?? "Legal" };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <p className="inline-flex items-center rounded bg-warning/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#92600a]">
          Draft · pending legal review
        </p>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">{page.title}</h1>
        <div className="mt-6 space-y-4">
          {page.body.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-graphite/80">
              {p}
            </p>
          ))}
        </div>
        <p className="mt-10 rounded-lg border border-line bg-bg px-5 py-4 text-sm leading-relaxed text-muted">
          This document is a working draft prepared for the product launch and has
          not been approved as binding legal text. Applicable jurisdiction and the
          final wording will be confirmed before public release.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
