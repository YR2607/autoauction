"use client";
import { useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SettingsForm({
  fields,
  values,
}: {
  fields: { key: string; label: string; type: "text" | "number" }[];
  values: Record<string, unknown>;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = fd.get(f.key);
      body[f.key] = f.type === "number" ? Number(raw) : String(raw ?? "");
    }
    const r = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMsg(r.ok ? "Settings saved." : "Save failed.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-none border border-[#cbd5e1] bg-white p-5 text-xs">
      {fields.map((f) => (
        <div key={f.key}>
          <Label>{f.label}</Label>
          <Input name={f.key} type={f.type} defaultValue={String(values[f.key] ?? "")} />
          <p className="mt-0.5 text-[10px] text-[#64748b]">{f.key}</p>
        </div>
      ))}
      {msg && <p className="rounded-none border border-[#86efac] bg-[#f0fdf4] text-[#15803d] px-3 py-2 text-xs font-bold">{msg}</p>}
      <Button type="submit" loading={busy} size="md">Save Settings</Button>
    </form>
  );
}
