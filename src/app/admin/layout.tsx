import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/admin-nav";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/login");

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-line bg-ink text-white">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-black">A</span>
              <span className="font-display text-base font-extrabold">AutoAuction <span className="text-white/40">Admin</span></span>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="rounded-full px-3 py-1.5 font-semibold text-white/70 hover:bg-white/10">← Site</Link>
            <span className="text-white/50">{user.email}</span>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <AdminNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
