import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

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
      "We do not sell personal data. Other bidders identities are not disclosed. Public bid history shows masked aliases only.",
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
  return { title: `${PAGES[slug]?.title ?? "Legal"} | AutoAuction` };
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
    <div className="min-h-screen bg-[#eaedf1] text-[#1e293b]">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-3 py-8 sm:px-6">
        <div className="border border-[#cbd5e1] bg-white p-6">
          <div className="border-b border-[#cbd5e1] pb-3 mb-4">
            <span className="inline-block rounded-none bg-[#f8fafc] border border-[#cbd5e1] px-2 py-0.5 text-[10px] font-bold uppercase text-[#64748b]">
              Official Policy
            </span>
            <h1 className="mt-2 text-xl font-bold uppercase text-[#0b3b60]">{page.title}</h1>
          </div>
          <div className="space-y-3 text-xs leading-relaxed text-[#334155]">
            {page.body.map((p, i) => (
              <p key={i}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
