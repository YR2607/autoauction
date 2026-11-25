import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { accountDashboard } from "@/features/account/queries";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { Countdown } from "@/components/auctions/countdown";
import Link from "next/link";
import { formatMoney, type Currency } from "@/lib/currency";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

function greetingName(email: string, firstName?: string | null) {
  if (firstName?.trim()) return firstName.trim();
  const local = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return local ? local[0].toUpperCase() + local.slice(1) : "there";
}

function notifType(t: string) {
  return t.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const d = accountDashboard(user.id);
  const profile = db
    .select({ firstName: schema.userProfiles.firstName })
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, user.id))
    .get();

  const liveBids = d.bidEntries
    .filter((e) => e.auction.status === "LIVE")
    .sort((a, b) => a.auction.endsAt - b.auction.endsAt);
  const closingSoon = liveBids.slice(0, 3);
  const pct = d.activeBids > 0 ? Math.round((d.leadingCount / d.activeBids) * 100) : 0;

  return (
    <div>
      {/* ── Desk heading ──────────────────────────────────────── */}
      <header className="border-b-2 border-ink pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h1 className="font-display text-[28px] font-medium leading-tight text-ink">
            Welcome back, {greetingName(user.email, profile?.firstName)}
          </h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-tech">
            Member account · {user.email}
          </p>
        </div>
        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted">
          <span className="text-success">● {d.leadingCount} leading</span>
          <span className="mx-2 text-line">·</span>
          <span className={d.outbidCount > 0 ? "text-primary" : ""}>
            {d.outbidCount > 0 ? "●" : "○"} {d.outbidCount} outbid
          </span>
          {d.pendingOrders > 0 && (
            <>
              <span className="mx-2 text-line">·</span>
              <span className="text-amber-700">● {d.pendingOrders} order{d.pendingOrders === 1 ? "" : "s"} awaiting approval</span>
            </>
          )}
        </p>
      </header>

      {/* ── Auction performance strip ─────────────────────────── */}
      <div className="grid grid-cols-2 divide-x divide-line/70 border-b border-line/70 sm:grid-cols-4">
        {[
          { label: "Active bids", value: d.activeBids, href: "/account/bids", cls: "text-ink" },
          { label: "Leading", value: d.leadingCount, href: "/account/bids", cls: "text-success" },
          { label: "Outbid", value: d.outbidCount, href: "/account/bids?f=outbid", cls: d.outbidCount > 0 ? "text-primary" : "text-tech" },
          { label: "Won", value: d.wonCount, href: "/account/purchases", cls: "text-gold" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="group px-5 py-4 first:pl-0">
            <p className="flex items-baseline gap-2">
              <span className={`tnum font-mono text-[30px] font-semibold leading-none ${s.cls}`}>
                {s.value}
              </span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted group-hover:text-ink">
                {s.label}
              </span>
            </p>
          </Link>
        ))}
      </div>

      {/* lead share — technical indicator */}
      <div className="flex items-center gap-4 border-b border-line/70 py-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-tech">Lead share</span>
        <div className="h-px flex-1 bg-line/80">
          <div
            className="h-px bg-success transition-[width] duration-500"
            style={{ width: `${Math.max(pct, d.activeBids > 0 ? 4 : 0)}%` }}
          />
        </div>
        <span className="tnum font-mono text-[11px] font-semibold text-ink">{pct}%</span>
      </div>

      {/* ── Middle: active bids | closing soon + archive index ── */}
      <div className="mt-7 grid gap-x-10 gap-y-8 xl:grid-cols-12">
        <section className="xl:col-span-8">
          <div className="flex items-baseline justify-between border-b border-ink/80 pb-2">
            <h2 className="font-display text-[20px] font-medium text-ink">Active bids</h2>
            <Link
              href="/account/bids"
              className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted transition-colors hover:text-primary"
            >
              All bids →
            </Link>
          </div>

          {liveBids.length === 0 ? (
            <p className="border-b border-line/70 py-6 text-sm text-muted">
              No bids on live auctions.{" "}
              <Link href="/auctions" className="font-semibold text-primary underline underline-offset-4">
                Browse live auctions
              </Link>
            </p>
          ) : (
            <table className="w-full">
              <tbody>
                {liveBids.slice(0, 5).map((e) => {
                  const leading = e.auction.highestBidderId === user.id;
                  return (
                    <tr key={e.auction.id} className="group border-b border-line/70 align-middle">
                      <td className="w-[104px] py-3.5 pr-4">
                        <Link href={`/vehicles/${e.vehicle.slug}`} className="block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={e.coverUrl ?? ""}
                            alt={`${e.vehicle.make} ${e.vehicle.model}`}
                            className="aspect-[3/2] w-[104px] object-cover"
                            loading="lazy"
                          />
                        </Link>
                      </td>
                      <td className="min-w-0 py-3.5 pr-4">
                        <p className="tnum font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-tech">
                          Lot {e.vehicle.lotNumber}
                          <span className="mx-2 text-line">·</span>
                          <span className="text-primary">
                            <Countdown endsAt={e.auction.endsAt} />
                          </span>
                        </p>
                        <Link
                          href={`/vehicles/${e.vehicle.slug}`}
                          className="mt-1 block truncate font-display text-[17px] font-medium text-ink transition-colors group-hover:text-primary"
                        >
                          {e.vehicle.year} {e.vehicle.make} {e.vehicle.model}
                        </Link>
                        <p className="tnum mt-1 font-mono text-[12px] text-muted">
                          My bid{" "}
                          <span className="font-semibold text-ink">
                            {formatMoney(e.bid.amount, e.auction.currency as Currency)}
                          </span>
                          <span className="mx-1.5 text-line">·</span>
                          Current{" "}
                          <span className="font-semibold text-ink">
                            {formatMoney(e.auction.currentBid, e.auction.currency as Currency)}
                          </span>
                        </p>
                      </td>
                      <td className="w-[130px] py-3.5 text-right">
                        <p
                          className={`font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${
                            leading ? "text-success" : "text-primary"
                          }`}
                        >
                          ● {leading ? "Leading" : "Outbid"}
                        </p>
                        <Link
                          href={`/vehicles/${e.vehicle.slug}`}
                          className="mt-2 inline-block border-b border-ink/40 pb-px font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:border-primary hover:text-primary"
                        >
                          {leading ? "View lot" : "Raise bid"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* ── Right rail: closing soon + archive index ────────── */}
        <div className="space-y-8 xl:col-span-4">
          {closingSoon.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between border-b border-ink/80 pb-2">
                <h2 className="font-display text-[18px] font-medium text-ink">Closing soon</h2>
              </div>
              <ul>
                {closingSoon.map((e) => {
                  const leading = e.auction.highestBidderId === user.id;
                  return (
                    <li key={e.auction.id} className="border-b border-line/70 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <Link
                          href={`/vehicles/${e.vehicle.slug}`}
                          className="min-w-0 truncate text-[13.5px] font-semibold text-ink hover:text-primary"
                        >
                          {e.vehicle.year} {e.vehicle.make} {e.vehicle.model}
                        </Link>
                        <span className="tnum shrink-0 font-mono text-[11px] font-semibold text-primary">
                          <Countdown endsAt={e.auction.endsAt} />
                        </span>
                      </div>
                      <p className="tnum mt-0.5 font-mono text-[11px] text-muted">
                        Lot {e.vehicle.lotNumber} · {formatMoney(e.auction.currentBid, e.auction.currency as Currency)}
                        <span className={`ml-2 ${leading ? "text-success" : "text-primary"}`}>
                          {leading ? "LEADING" : "OUTBID"}
                        </span>
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section>
            <div className="flex items-baseline justify-between border-b border-ink/80 pb-2">
              <h2 className="font-display text-[18px] font-medium text-ink">Watchlist &amp; archive</h2>
            </div>
            <div>
              {[
                { label: "Lots won", value: d.wonCount, href: "/account/purchases" },
                { label: "Pending orders", value: d.pendingOrders, href: "/account/purchases" },
                { label: "Saved favorites", value: d.favorites, href: "/account/favorites" },
              ].map((r) => (
                <Link
                  key={r.label}
                  href={r.href}
                  className="group flex items-baseline justify-between border-b border-line/70 py-3"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted group-hover:text-ink">
                    {r.label}
                  </span>
                  <span className="tnum font-mono text-[20px] font-semibold leading-none text-ink">
                    {r.value}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/auctions"
              className="mt-3 inline-block border-b-2 border-ink pb-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:border-primary hover:text-primary"
            >
              Explore live auctions →
            </Link>
          </section>
        </div>
      </div>

      {/* ── Bottom: full-width activity log ───────────────────── */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between border-b border-ink/80 pb-2">
          <h2 className="font-display text-[20px] font-medium text-ink">Recent activity</h2>
          <Link
            href="/account/notifications"
            className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted transition-colors hover:text-primary"
          >
            Full log{d.unread > 0 && ` (${d.unread} unread)`} →
          </Link>
        </div>

        {d.recentNotifications.length === 0 ? (
          <p className="border-b border-line/70 py-6 text-sm text-muted">No activity yet.</p>
        ) : (
          <table className="w-full">
            <tbody>
              {d.recentNotifications.map((n) => {
                const isNew = !n.readAt;
                return (
                  <tr key={n.id} className="border-b border-line/70 align-top">
                    <td className="w-[150px] whitespace-nowrap py-3 pr-4">
                      <span className="tnum font-mono text-[10.5px] uppercase tracking-[0.08em] text-tech">
                        {new Date(n.createdAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="w-[170px] py-3 pr-4">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                        {notifType(n.type)}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <p className={`text-[13.5px] leading-snug ${isNew ? "font-semibold text-ink" : "text-graphite2"}`}>
                        {isNew && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-gold align-middle" aria-label="Unread" />}
                        {n.title}
                      </p>
                      {n.body && <p className="mt-0.5 text-xs leading-relaxed text-muted">{n.body}</p>}
                    </td>
                    <td className="w-[80px] py-3 text-right">
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
      </section>
    </div>
  );
}
