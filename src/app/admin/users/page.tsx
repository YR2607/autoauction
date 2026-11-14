import { allUsers } from "@/features/admin/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserStatusButton } from "@/components/admin/user-status-button";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Users · Admin" };

export default function UsersPage() {
  const rows = allUsers();
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Users</h1>
      <Card className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line bg-bg/60 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Bids</th>
              <th className="px-5 py-3 font-semibold">Joined</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user.id} className="border-b border-line/60 last:border-0">
                <td className="px-5 py-3 font-bold">{r.user.email}</td>
                <td className="px-5 py-3 text-muted">
                  {[r.profile?.firstName, r.profile?.lastName].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="px-5 py-3">
                  <Badge tone={r.user.role === "admin" ? "primary" : "neutral"}>{r.user.role}</Badge>
                </td>
                <td className="px-5 py-3 text-muted">{r.bidCount}</td>
                <td className="px-5 py-3 text-muted">{new Date(r.user.createdAt).toLocaleDateString("en-GB")}</td>
                <td className="px-5 py-3">
                  <Badge tone={r.user.status === "active" ? "success" : "live"}>{r.user.status}</Badge>
                </td>
                <td className="px-5 py-3 text-right">
                  {r.user.role !== "admin" && (
                    <UserStatusButton userId={r.user.id} status={r.user.status} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
