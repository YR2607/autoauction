"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <button
      disabled={busy}
      className="rounded-none border border-white/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 disabled:opacity-50 cursor-pointer"
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
