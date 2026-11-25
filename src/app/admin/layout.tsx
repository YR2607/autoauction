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
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-line bg-ink text-white">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-baseline gap-2.5">
              <span className="font-display text-lg font-medium">AutoAuction</span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em]">
            <Link href="/" className="px-3 py-1.5 font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white">← Site</Link>
            <span className="hidden text-white/50 sm:inline">{user.email}</span>
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[232px_1fr]">
        <AdminNav counts={{ approvals: pendingApprovals, orders: pendingOrders }} />
        <div className="min-w-0">
          <AdminBreadcrumb />
          {children}
        </div>
      </div>
    </div>
  );
}
