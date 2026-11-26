"use client";
import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/auth/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(fd.get("email") ?? "") }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setErr(d.error ?? "Something went wrong.");
    } else {
      setSent(true);
    }
    setBusy(false);
  }

  if (sent) {
    return (
      <div className="mt-4 rounded-none border border-[#cbd5e1] bg-white p-5 text-xs text-[#334155]">
        <p className="font-bold text-[#0b3b60]">Check your inbox.</p>
        <p className="mt-1 text-[#64748b]">
          If an account exists for that email, a reset link is on its way. It expires in 30 minutes.
        </p>
        <Link href="/login" className="mt-3 inline-block font-bold text-[#0b3b60] hover:underline">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-none border border-[#cbd5e1] bg-white p-5 text-xs">
      <div>
        <Label htmlFor="email">Account Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      {err && (
        <p className="rounded-none border border-[#fca5a5] bg-[#fef2f2] px-3 py-2 text-xs font-bold text-[#b91c1c]" role="alert">
          {err}
        </p>
      )}
      <Button type="submit" variant="primary" className="w-full" size="md" loading={busy}>
        Send Reset Link
      </Button>
      <p className="text-center text-xs text-[#64748b] pt-1">
        Remember your password? <Link href="/login" className="font-bold text-[#0b3b60] hover:underline">Sign In</Link>
      </p>
    </form>
  );
}
