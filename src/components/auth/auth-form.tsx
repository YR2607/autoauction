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
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-none border border-[#cbd5e1] bg-white p-5 text-xs">
      {isReg && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" name="firstName" autoComplete="given-name" />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" name="lastName" autoComplete="family-name" />
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="email">Email Address</Label>
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
          <p className="mt-1 text-[11px] text-[#64748b]">Minimum 8 characters required.</p>
        ) : (
          <p className="mt-1 text-right text-[11px]">
            <Link href="/forgot-password" className="font-bold text-[#0b3b60] hover:underline">
              Forgot password?
            </Link>
          </p>
        )}
      </div>
      {err && (
        <p className="rounded-none border border-[#fca5a5] bg-[#fef2f2] px-3 py-2 text-xs font-bold text-[#b91c1c]" role="alert">
          {err}
        </p>
      )}
      <Button type="submit" variant="primary" className="w-full" size="md" loading={busy}>
        {isReg ? "Register Account" : "Sign In"}
      </Button>
      <p className="text-center text-xs text-[#64748b] pt-1">
        {isReg ? (
          <>Already have an account? <Link href="/login" className="font-bold text-[#0b3b60] hover:underline">Sign In</Link></>
        ) : (
          <>No account yet? <Link href="/register" className="font-bold text-[#0b3b60] hover:underline">Register now</Link></>
        )}
      </p>
    </form>
  );
}
