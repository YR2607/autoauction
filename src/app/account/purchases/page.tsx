import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { myOrders, myOrdersCount } from "@/features/account/queries";
import { Pagination } from "@/components/vehicles/pagination";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty";
import { formatMoney, type Currency } from "@/lib/currency";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Purchases" };

const tone: Record<string, "success" | "live" | "warning" | "neutral"> = {
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  COMPLETED: "success",
  REJECTED: "live",
  CANCELLED: "neutral",
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
      <h1 className="font-display text-2xl font-extrabold">My Purchases</h1>
      {rows.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No purchases yet"
          body="Won auctions and Buy Now requests will appear here."
          action={<Link href="/buy-now" className="rounded-md bg-cta px-5 py-2.5 text-sm font-semibold text-white">Browse Buy Now</Link>}
        />
      ) : (
        <Card className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-bg/60 text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-semibold">Vehicle</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.order.id} className="border-b border-line/60 last:border-0">
                  <td className="px-5 py-3.5">
                    <Link href={`/vehicles/${r.vehicle.slug}`} className="flex items-center gap-3">
                      {r.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.coverUrl} alt="" className="h-11 w-16 shrink-0 rounded-md object-cover" />
                      ) : (
                        <span className="h-11 w-16 shrink-0 rounded-md bg-graphite/5" />
                      )}
                      <span className="font-bold hover:text-primary">
                        {r.vehicle.make} {r.vehicle.model} {r.vehicle.year}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">{r.order.type === "BUY_NOW" ? "Buy Now" : "Auction win"}</td>
                  <td className="px-5 py-3.5 font-bold">{formatMoney(r.order.amount, r.order.currency as Currency)}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={tone[r.order.status] ?? "neutral"}>{r.order.status.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{new Date(r.order.createdAt).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Pagination page={page} perPage={perPage} total={total} params={sp} basePath="/account/purchases" />
    </div>
  );
}
