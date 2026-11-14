"use client";
import { usePathname } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const LABELS: Record<string, string> = {
  vehicles: "Vehicles",
  new: "New vehicle",
  auctions: "Auctions",
  approvals: "Approvals",
  orders: "Orders",
  bids: "Bids",
  users: "Users",
  settings: "Settings",
};

export function AdminBreadcrumb() {
  const path = usePathname();
  const segs = path.split("/").filter(Boolean).slice(1); // drop "admin"
  if (segs.length === 0) return null;

  const items: { label: string; href?: string }[] = [{ label: "Admin", href: "/admin" }];
  segs.forEach((s, i) => {
    const href = i === segs.length - 1 ? undefined : `/admin/${segs.slice(0, i + 1).join("/")}`;
    items.push({ label: LABELS[s] ?? `#${s.slice(0, 8)}`, href });
  });
  return <Breadcrumb items={items} className="mb-4" />;
}
