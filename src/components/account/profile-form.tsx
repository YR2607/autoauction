"use client";
import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Fields = {
  firstName: string; lastName: string; phone: string;
  addressLine: string; city: string; country: string;
};

export function ProfileForm({ initial }: { initial: Fields }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    for (const k of Object.keys(initial)) body[k] = String(fd.get(k) ?? "");
    const r = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMsg(r.ok ? "Profile saved." : "Save failed. Try again.");
    setBusy(false);
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: fd.get("currentPassword"),
        newPassword: fd.get("newPassword"),
      }),
    });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? "Password changed." : d.error ?? "Password change failed.");
    (e.target as HTMLFormElement).reset();
    setBusy(false);
  }

  return (
    <div className="grid items-start gap-x-10 gap-y-8 lg:grid-cols-2">
      <form onSubmit={submit} className="space-y-4">
        <h2 className="border-b border-ink/80 pb-2 font-display text-[18px] font-medium text-ink">
          Personal information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>First name</Label><Input name="firstName" defaultValue={initial.firstName} /></div>
          <div><Label>Last name</Label><Input name="lastName" defaultValue={initial.lastName} /></div>
        </div>
        <div><Label>Phone</Label><Input name="phone" defaultValue={initial.phone} /></div>
        <div><Label>Address</Label><Input name="addressLine" defaultValue={initial.addressLine} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><Label>City</Label><Input name="city" defaultValue={initial.city} /></div>
          <div><Label>Country</Label><Input name="country" defaultValue={initial.country} /></div>
        </div>
        <Button type="submit" loading={busy}>Save profile</Button>
      </form>

      <form onSubmit={changePassword} className="space-y-4">
        <h2 className="border-b border-ink/80 pb-2 font-display text-[18px] font-medium text-ink">
          Security
        </h2>
        <div><Label>Current password</Label><Input name="currentPassword" type="password" required /></div>
        <div><Label>New password (8+ chars)</Label><Input name="newPassword" type="password" required minLength={8} /></div>
        <Button type="submit" variant="outline" loading={busy}>Change password</Button>
      </form>

      {msg && <p role="status" className={`px-3 py-2 text-sm font-semibold lg:col-span-2 ${msg.includes("fail") || msg.includes("Fail") ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}>{msg}</p>}
    </div>
  );
}
