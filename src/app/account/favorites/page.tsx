import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { myFavorites } from "@/features/account/queries";
import { EmptyState } from "@/components/ui/empty";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Watchlist | AutoAuction" };

export default async function FavoritesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const items = myFavorites(user.id);

  return (
    <div>
      <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-3 mb-4">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-[#0b3b60]">Vehicle Watchlist</h1>
          <p className="mt-0.5 text-xs text-[#64748b]">Saved vehicles and bookmarked lots for monitoring.</p>
        </div>
        <span className="text-xs font-bold text-[#64748b]">Total Lots: {items.length}</span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="Your watchlist is empty"
          body="Click the Watch button on any vehicle page to keep track of auctions and fixed-price listings."
          action={<Link href="/vehicles" className="rounded-none bg-[#0b3b60] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#072a47]">Browse Vehicles</Link>}
        />
      ) : (
        <Card className="mt-4 overflow-x-auto rounded-none">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="border-b border-[#cbd5e1] bg-[#f8fafc] text-left uppercase tracking-wider text-[#64748b]">
                <th className="px-4 py-2.5 font-bold">Vehicle</th>
                <th className="px-4 py-2.5 font-bold">Mileage</th>
                <th className="px-4 py-2.5 font-bold">Fuel / Trans</th>
                <th className="px-4 py-2.5 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {items.map((r) => (
                <tr key={r.vehicle.id} className="hover:bg-[#f8fafc]">
                  <td className="px-4 py-3">
                    <Link href={`/vehicles/${r.vehicle.slug}`} className="flex items-center gap-3 hover:underline">
                      {r.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.coverUrl} alt="" className="h-10 w-16 shrink-0 rounded-none object-cover" />
                      ) : (
                        <span className="h-10 w-16 shrink-0 rounded-none bg-[#e2e8f0]" />
                      )}
                      <div>
                        <p className="font-bold text-[#0b3b60]">{r.vehicle.year} {r.vehicle.make} {r.vehicle.model}</p>
                        <p className="text-[11px] text-[#64748b]">Lot {r.vehicle.lotNumber}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#1e293b]">
                    {r.vehicle.mileage != null ? `${r.vehicle.mileage.toLocaleString("en-US")} mi` : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-[#64748b]">
                    {r.vehicle.fuelType ?? "Gasoline"} / {r.vehicle.transmission ?? "Automatic"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/vehicles/${r.vehicle.slug}`}
                      className="inline-block rounded-none bg-[#0b3b60] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-[#072a47]"
                    >
                      View Lot
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
