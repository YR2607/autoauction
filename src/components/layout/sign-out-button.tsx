"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="rounded-md border border-line px-4 py-2 text-[13.5px] font-medium text-graphite/70 transition-colors hover:bg-graphite/5 hover:text-ink disabled:opacity-50"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.refresh();
        router.push("/");
      }}
    >
      Sign out
    </button>
  );
}
