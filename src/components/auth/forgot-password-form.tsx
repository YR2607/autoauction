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
      <div className="mt-8 rounded-xl border border-line bg-surface p-5 text-sm text-graphite/80">
        <p className="font-semibold text-ink">Check your inbox.</p>
        <p className="mt-1">
          If an account exists for that email, a reset link is on its way. It expires in 30 minutes.
        </p>
        <Link href="/login" className="mt-4 inline-block font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      {err && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-sm font-semibold text-error" role="alert">
          {err}
        </p>
      )}
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-muted">
        Remembered it? <Link href="/login" className="font-semibold text-primary">Sign in</Link>
      </p>
    </form>
  );
}
