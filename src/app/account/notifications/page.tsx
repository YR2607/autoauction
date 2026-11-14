import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { myNotifications } from "@/features/account/queries";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty";
import { MarkAllRead } from "@/components/account/mark-all-read";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const items = myNotifications(user.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">Notifications</h1>
        {items.some((n) => !n.readAt) && <MarkAllRead />}
      </div>
      {items.length === 0 ? (
        <EmptyState className="mt-6" title="No notifications" body="Auction activity will show up here." />
      ) : (
        <Card className="mt-6 divide-y divide-line/60">
          {items.map((n) => (
            <div key={n.id} className={cn("px-5 py-4", !n.readAt && "bg-primary/[0.03]")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">
                    {!n.readAt && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" />}
                    {n.title}
                  </p>
                  {n.body && <p className="mt-0.5 text-sm text-muted">{n.body}</p>}
                </div>
                <span className="shrink-0 text-[11px] text-muted">{new Date(n.createdAt).toLocaleString("en-GB")}</span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
