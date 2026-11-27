"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    if (password !== confirm) {
      setErr("Passwords do not match.");
      setBusy(false);
      return;
    }
    const r = await fetch("/api/auth/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(d.error ?? "Something went wrong.");
      setBusy(false);
      return;
    }
    router.push("/login?reset=1");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-none border border-[#cbd5e1] bg-white p-5 text-xs">
      <div>
        <Label htmlFor="password">New Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        <p className="mt-1 text-[11px] text-[#64748b]">At least 8 characters. All active sessions will be signed out.</p>
      </div>
      <div>
        <Label htmlFor="confirm">Repeat Password</Label>
        <Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      {err && (
        <p className="rounded-none border border-[#fca5a5] bg-[#fef2f2] px-3 py-2 text-xs font-bold text-[#b91c1c]" role="alert">
          {err}
        </p>
      )}
      <Button type="submit" variant="primary" className="w-full" size="md" loading={busy}>
        Set New Password
      </Button>
    </form>
  );
}
