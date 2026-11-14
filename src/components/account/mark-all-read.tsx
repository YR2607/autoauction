"use client";
import { useRouter } from "next/navigation";

export function MarkAllRead() {
  const router = useRouter();
  return (
    <button
      className="text-sm font-bold text-primary hover:underline"
      onClick={async () => {
        await fetch("/api/notifications/read-all", { method: "POST" });
        router.refresh();
      }}
    >
      Mark all as read
    </button>
  );
}
