"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isReg = mode === "register";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
    };
    if (isReg) {
      payload.firstName = String(fd.get("firstName") ?? "");
      payload.lastName = String(fd.get("lastName") ?? "");
    }
    const r = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(d.error ?? "Something went wrong.");
      setBusy(false);
      return;
    }
    router.refresh();
    router.push(d.role === "admin" ? "/admin" : "/account");
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      {isReg && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" autoComplete="given-name" />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" autoComplete="family-name" />
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={isReg ? 8 : 1}
          autoComplete={isReg ? "new-password" : "current-password"}
        />
        {isReg ? (
          <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
        ) : (
          <p className="mt-1 text-right text-xs">
            <Link href="/forgot-password" className="font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          </p>
        )}
      </div>
      {err && (
        <p className="rounded-lg bg-error/10 px-3 py-2 text-sm font-semibold text-error" role="alert">
          {err}
        </p>
      )}
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? "Please wait…" : isReg ? "Create account" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted">
        {isReg ? (
          <>Already have an account? <Link href="/login" className="font-semibold text-primary">Sign in</Link></>
        ) : (
          <>No account? <Link href="/register" className="font-semibold text-primary">Create one</Link></>
        )}
      </p>
    </form>
  );
}
