"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="border border-line px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-graphite2 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
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
