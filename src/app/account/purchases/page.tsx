import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { myOrders, myOrdersCount } from "@/features/account/queries";
import { Pagination } from "@/components/vehicles/pagination";
import { EmptyState } from "@/components/ui/empty";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Purchases" };

const statusLabel: Record<string, { text: string; cls: string }> = {
  PENDING_APPROVAL: { text: "● Awaiting approval", cls: "text-amber-700" },
  APPROVED: { text: "● Approved", cls: "text-success" },
  COMPLETED: { text: "● Completed", cls: "text-success" },
  REJECTED: { text: "● Rejected", cls: "text-primary" },
  CANCELLED: { text: "○ Cancelled", cls: "text-muted" },
};

const paymentLabel: Record<string, { text: string; cls: string }> = {
  unpaid: { text: "Unpaid", cls: "text-muted" },
  paid: { text: "Paid", cls: "text-success" },
  refunded: { text: "Refunded", cls: "text-muted" },
};

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const perPage = 20;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const total = myOrdersCount(user.id);
  const rows = myOrders(user.id, perPage, (page - 1) * perPage);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-4">
        <h1 className="font-display text-[28px] font-medium text-ink">Purchases</h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-tech">
          Transaction ledger · {total} record{total === 1 ? "" : "s"}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No purchases yet"
          body="Won auctions and Buy Now requests will appear here."
          action={<Link href="/buy-now" className="rounded-md bg-cta px-5 py-2.5 text-sm font-semibold text-white">Browse Buy Now</Link>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-line/70 text-left">
                <th className="py-2.5 pr-4">Lot / vehicle</th>
                <th className="py-2.5 pr-4">Type</th>
                <th className="py-2.5 pr-4">Amount</th>
                <th className="py-2.5 pr-4">Status</th>
                <th className="py-2.5 pr-4">Payment</th>
                <th className="py-2.5 pr-4">Date</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = statusLabel[r.order.status] ?? statusLabel.CANCELLED;
                const pay = paymentLabel[r.order.paymentStatus] ?? paymentLabel.unpaid;
                return (
                  <tr key={r.order.id} className="group border-b border-line/70">
                    <td className="py-3.5 pr-4">
                      <Link href={`/vehicles/${r.vehicle.slug}`} className="flex items-center gap-3">
                        {r.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.coverUrl} alt="" className="aspect-[3/2] w-[84px] shrink-0 object-cover" />
                        ) : (
                          <span className="aspect-[3/2] w-[84px] shrink-0 bg-graphite/5" />
                        )}
                        <span>
                          <span className="tnum block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-tech">
                            Lot {r.vehicle.lotNumber}
                          </span>
                          <span className="mt-0.5 block font-display text-[15.5px] font-medium text-ink group-hover:text-primary">
                            {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">
                      {r.order.type === "BUY_NOW" ? "Buy Now" : "Auction win"}
                    </td>
                    <td className="tnum py-3.5 pr-4 font-mono text-[13px] font-semibold text-ink">
                      {formatMoney(r.order.amount, r.order.currency as Currency)}
                    </td>
                    <td className={`py-3.5 pr-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] ${st.cls}`}>
                      {st.text}
                    </td>
                    <td className={`py-3.5 pr-4 font-mono text-[10.5px] uppercase tracking-[0.1em] ${pay.cls}`}>
                      {pay.text}
                    </td>
                    <td className="tnum py-3.5 pr-4 font-mono text-[11.5px] text-muted">
                      {new Date(r.order.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/vehicles/${r.vehicle.slug}`}
                        className="border-b border-ink/40 pb-px font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:border-primary hover:text-primary"
                      >
                        View lot
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} perPage={perPage} total={total} params={sp} basePath="/account/purchases" />
    </div>
  );
}
