import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { myNotifications, myNotificationsCount } from "@/features/account/queries";
import { Pagination } from "@/components/vehicles/pagination";
import { EmptyState } from "@/components/ui/empty";
import { MarkAllRead } from "@/components/account/mark-all-read";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications" };

function notifType(t: string) {
  return t.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const perPage = 25;
  const page = Math.max(1, Number(typeof sp.page === "string" ? sp.page : 1) || 1);
  const unreadOnly = sp.f === "unread";
  const total = myNotificationsCount(user.id);
  const all = myNotifications(user.id);
  const items = (unreadOnly ? all.filter((n) => !n.readAt) : all).slice(
    (page - 1) * perPage,
    page * perPage,
  );
  const shown = unreadOnly ? all.filter((n) => !n.readAt).length : total;
  const hasUnread = all.some((n) => !n.readAt);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-ink pb-4">
        <h1 className="font-display text-[28px] font-medium text-ink">Notifications</h1>
        {hasUnread && <MarkAllRead />}
      </div>

      <nav className="flex gap-0 border-b border-line/70" aria-label="Notification filter">
        {[
          { key: "all", label: "All" },
          { key: "unread", label: "Unread" },
        ].map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/account/notifications" : "/account/notifications?f=unread"}
            className={`shrink-0 border-b-2 px-4 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] transition-colors ${
              (f.key === "unread") === unreadOnly
                ? "border-primary text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={unreadOnly ? "No unread notifications" : "No notifications"}
          body="Auction activity will show up here."
        />
      ) : (
        <table className="w-full">
          <tbody>
            {items.map((n) => {
              const isNew = !n.readAt;
              return (
                <tr key={n.id} className="border-b border-line/70 align-top">
                  <td className="w-[150px] whitespace-nowrap py-3.5 pr-4">
                    <span className="tnum font-mono text-[10.5px] uppercase tracking-[0.08em] text-tech">
                      {new Date(n.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="w-[170px] py-3.5 pr-4">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                      {notifType(n.type)}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <p className={`text-[13.5px] leading-snug ${isNew ? "font-semibold text-ink" : "text-graphite2"}`}>
                      {isNew && (
                        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-gold align-middle" aria-label="Unread" />
                      )}
                      {n.title}
                    </p>
                    {n.body && <p className="mt-0.5 text-xs leading-relaxed text-muted">{n.body}</p>}
                  </td>
                  <td className="w-[70px] py-3.5 text-right">
                    {isNew && (
                      <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-gold">
                        New
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <Pagination page={page} perPage={perPage} total={shown} params={sp} basePath="/account/notifications" />
    </div>
  );
}
