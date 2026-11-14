"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-graphite/80 hover:bg-graphite/5 disabled:opacity-50"
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
