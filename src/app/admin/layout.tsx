import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { pendingOrderRows } from "@/features/admin/queries";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/login");

  const pendingOrders = pendingOrderRows().length;
  const pendingApprovals = db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(eq(schema.orders.status, "PENDING_APPROVAL"))
    .all().length;

  return (
    <div className="min-h-screen bg-[#eaedf1] text-[#1e293b]">
      <header className="sticky top-0 z-40 border-b border-[#072a47] bg-[#0b3b60] text-white">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-none bg-[#ffb81c] text-[#051a2e] text-xs font-black">A</span>
              <span className="text-base font-black tracking-tight text-white">AutoAuction <span className="text-white/60 font-bold">Admin</span></span>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/" className="rounded-none border border-white/30 px-3 py-1 font-bold uppercase tracking-wider text-white hover:bg-white/10">Site</Link>
            <span className="hidden text-white/70 sm:inline font-semibold">{user.email}</span>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[232px_1fr]">
        <AdminNav counts={{ approvals: pendingApprovals, orders: pendingOrders }} />
        <div className="min-w-0">
          <AdminBreadcrumb />
          {children}
        </div>
      </div>
    </div>
  );
}
