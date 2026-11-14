import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const PAGES: Record<string, { title: string; body: string[] }> = {
  terms: {
    title: "Terms of Use",
    body: [
      "AutoAuction is an online vehicle marketplace. Vehicles are offered via timed auctions and fixed-price (Buy Now) listings.",
      "Placing a bid constitutes a binding offer. Winning a bid or submitting a Buy Now request starts a purchase review; the sale is confirmed only after administrator approval.",
      "Vehicle information, including condition and damage disclosures, is provided by the marketplace operator. Buyers are encouraged to review all available documentation before bidding.",
      "Accounts may be suspended for abusive behavior, fraudulent bids or policy violations.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "We store only the data required to operate the marketplace: your account details, bids, orders, favorites and notifications.",
      "We do not sell personal data. Bidder identities are never disclosed to other users — public bid history shows masked aliases only.",
      "You may request account data or deletion by contacting support.",
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
        <h1 className="font-display text-3xl font-extrabold">{page.title}</h1>
        <div className="mt-6 space-y-4">
          {page.body.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-graphite/80">
              {p}
            </p>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
