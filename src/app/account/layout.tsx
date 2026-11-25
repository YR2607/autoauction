import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AccountNav } from "@/components/account/account-nav";
import { db, schema } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.status !== "active") redirect("/login");

  const unread = db
    .select({ id: schema.notifications.id })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, user.id), isNull(schema.notifications.readAt)))
    .all().length;

  return (
    <>
      <SiteHeader />
      <div className="bg-white">
        <main className="mx-auto w-full max-w-[1380px] px-4 py-8 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <AccountNav isAdmin={user.role === "admin"} unread={unread} />
            <div className="min-w-0">{children}</div>
          </div>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
