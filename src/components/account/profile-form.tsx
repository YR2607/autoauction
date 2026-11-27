"use client";
import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProfileForm({
  user,
  initial,
}: {
  user?: {
    email: string;
    profile?: {
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      country: string | null;
      city: string | null;
    } | null;
  };
  initial?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    addressLine?: string;
    city?: string;
    country?: string;
  };
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const initFirst = initial?.firstName ?? user?.profile?.firstName ?? "";
  const initLast = initial?.lastName ?? user?.profile?.lastName ?? "";
  const initPhone = initial?.phone ?? user?.profile?.phone ?? "";
  const initCity = initial?.city ?? user?.profile?.city ?? "";
  const initCountry = initial?.country ?? user?.profile?.country ?? "";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      firstName: fd.get("firstName") || null,
      lastName: fd.get("lastName") || null,
      phone: fd.get("phone") || null,
      country: fd.get("country") || null,
      city: fd.get("city") || null,
    };
    const r = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setMsg(r.ok ? "Profile saved." : "Save failed. Try again.");
    setBusy(false);
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const currentPassword = String(fd.get("currentPassword") || "");
    const newPassword = String(fd.get("newPassword") || "");
    const r = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const d = await r.json();
    if (r.ok && d.ok) {
      setMsg("Password updated.");
      form.reset();
    } else {
      setMsg(d.error || "Password change failed.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4 rounded-none border border-[#cbd5e1] bg-white p-5 text-xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0b3b60] border-b border-[#cbd5e1] pb-2">Profile Information</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>First Name</Label>
            <Input name="firstName" defaultValue={initFirst} />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input name="lastName" defaultValue={initLast} />
          </div>
          {user?.email && (
            <div>
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
          )}
          <div>
            <Label>Phone</Label>
            <Input name="phone" defaultValue={initPhone} />
          </div>
          <div>
            <Label>City</Label>
            <Input name="city" defaultValue={initCity} />
          </div>
          <div>
            <Label>Country</Label>
            <Input name="country" defaultValue={initCountry} />
          </div>
        </div>
        <Button type="submit" loading={busy} variant="primary" size="md">Save Profile</Button>
      </form>

      <form onSubmit={changePassword} className="space-y-4 rounded-none border border-[#cbd5e1] bg-white p-5 text-xs">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#0b3b60] border-b border-[#cbd5e1] pb-2">Change Password</h2>
        <div className="max-w-md space-y-3">
          <div>
            <Label>Current Password</Label>
            <Input type="password" name="currentPassword" required />
          </div>
          <div>
            <Label>New Password</Label>
            <Input type="password" name="newPassword" required minLength={8} />
          </div>
        </div>
        <Button type="submit" loading={busy} variant="outline" size="md">Update Password</Button>
      </form>

      {msg && (
        <p
          role="status"
          className={`rounded-none border px-3 py-2 text-xs font-bold ${
            msg.includes("fail") || msg.includes("Fail")
              ? "border-[#fca5a5] bg-[#fef2f2] text-[#b91c1c]"
              : "border-[#86efac] bg-[#f0fdf4] text-[#15803d]"
          }`}
        >
          {msg}
        </p>
      )}
    </div>
  );
}
