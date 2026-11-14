"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const FIELDS: { name: string; label: string; type?: string; options?: string[]; span?: boolean }[] = [
  { name: "make", label: "Make" },
  { name: "model", label: "Model" },
  { name: "trim", label: "Trim" },
  { name: "year", label: "Year", type: "number" },
  { name: "vin", label: "VIN" },
  { name: "vinVisibility", label: "VIN visibility", options: ["last4", "full", "hidden"] },
  { name: "mileage", label: "Mileage (km)", type: "number" },
  { name: "bodyType", label: "Body type", options: ["Sedan", "Estate", "Coupe", "Hatchback", "SUV", "Convertible", "Van", "Pickup", "Other"] },
  { name: "fuelType", label: "Fuel", options: ["Petrol", "Diesel", "Hybrid", "Electric", "LPG", "Other"] },
  { name: "transmission", label: "Transmission", options: ["Automatic", "Manual"] },
  { name: "drivetrain", label: "Drivetrain", options: ["FWD", "RWD", "AWD"] },
  { name: "engineCapacityCc", label: "Engine (cc)", type: "number" },
  { name: "enginePowerHp", label: "Power (hp)", type: "number" },
  { name: "exteriorColor", label: "Exterior color" },
  { name: "interiorColor", label: "Interior color" },
  { name: "doors", label: "Doors", type: "number" },
  { name: "seats", label: "Seats", type: "number" },
  { name: "locationCity", label: "City" },
  { name: "locationCountry", label: "Country" },
];

const CONDITION: { name: string; label: string; options?: string[]; type?: string }[] = [
  { name: "conditionOverall", label: "Overall condition", options: ["Excellent", "Very good", "Good", "Fair", "Damaged"] },
  { name: "accidentHistory", label: "Accident history", options: ["None reported", "Minor accident reported", "Major accident reported", "Unknown"] },
  { name: "damageType", label: "Damage type", options: ["None", "Front", "Rear", "Side", "Mechanical", "Flood", "Hail", "Other"] },
  { name: "engineCondition", label: "Engine", options: ["Excellent", "Good", "Needs repair", "Not working"] },
  { name: "transmissionCondition", label: "Transmission", options: ["Excellent", "Good", "Needs repair", "Not working"] },
  { name: "chassisCondition", label: "Chassis", options: ["Excellent", "Good", "Damaged"] },
  { name: "airbagStatus", label: "Airbags", options: ["Intact", "Deployed", "Missing"] },
  { name: "floodDamage", label: "Flood damage", type: "checkbox" },
  { name: "starts", label: "Starts", type: "checkbox" },
  { name: "drives", label: "Drives", type: "checkbox" },
  { name: "keysAvailable", label: "Keys available", type: "checkbox" },
];

export function VehicleForm({
  vehicleId,
  initial,
}: {
  vehicleId?: string;
  initial?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const v = (k: string) => (initial?.[k] ?? "") as string;
  const vb = (k: string) => initial?.[k] === true || initial?.[k] === 1;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    for (const f of [...FIELDS, ...CONDITION]) {
      if (f.type === "checkbox") body[f.name] = fd.get(f.name) === "on";
      else body[f.name] = fd.get(f.name);
    }
    body.description = fd.get("description");
    body.sellerNotes = fd.get("sellerNotes");
    body.serviceHistory = fd.get("serviceHistory");
    body.registrationInfo = fd.get("registrationInfo");
    body.saleType = fd.get("saleType");
    body.buyNowPrice = fd.get("buyNowPrice");
    body.buyNowCurrency = fd.get("buyNowCurrency");

    const r = await fetch(vehicleId ? `/api/admin/vehicles/${vehicleId}` : "/api/admin/vehicles", {
      method: vehicleId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(d.error ?? "Save failed");
      setBusy(false);
      return;
    }
    router.push(`/admin/vehicles/${d.id ?? vehicleId}`);
    router.refresh();
  }

  const saleType = initial?.saleType as string | undefined;

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="General information">
        <Grid>
          {FIELDS.map((f) => (
            <Field key={f.name} f={f} defaultValue={v(f.name)} />
          ))}
        </Grid>
      </Section>

      <Section title="Condition">
        <Grid>
          {CONDITION.map((f) => (
            <Field key={f.name} f={f} defaultValue={v(f.name)} defaultChecked={vb(f.name)} />
          ))}
        </Grid>
      </Section>

      <Section title="Sale configuration">
        <Grid>
          <div>
            <Label>Sale type</Label>
            <Select name="saleType" defaultValue={saleType ?? "AUCTION"}>
              <option value="AUCTION">Auction only</option>
              <option value="BUY_NOW">Buy Now only</option>
              <option value="AUCTION_BUY_NOW">Auction + Buy Now</option>
            </Select>
          </div>
          <div>
            <Label>Buy Now price (major units)</Label>
            <Input name="buyNowPrice" type="number" step="0.01" defaultValue={initial?.buyNowPrice != null ? (initial.buyNowPrice as number) / 100 : ""} />
          </div>
          <div>
            <Label>Buy Now currency</Label>
            <Select name="buyNowCurrency" defaultValue={(initial?.buyNowCurrency as string) ?? "EUR"}>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </Select>
          </div>
        </Grid>
        <p className="mt-3 text-xs text-muted">Auction settings (schedule, start price, increment) are configured on the vehicle page after creation.</p>
      </Section>

      <Section title="Description & records">
        <div className="space-y-4">
          <div><Label>Description</Label><Textarea name="description" defaultValue={v("description")} /></div>
          <div><Label>Seller notes</Label><Textarea name="sellerNotes" defaultValue={v("sellerNotes")} /></div>
          <div><Label>Service history</Label><Textarea name="serviceHistory" defaultValue={v("serviceHistory")} /></div>
          <div><Label>Registration info</Label><Textarea name="registrationInfo" defaultValue={v("registrationInfo")} /></div>
        </div>
      </Section>

      {err && <p className="rounded-lg bg-error/10 px-3 py-2 text-sm font-semibold text-error">{err}</p>}
      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Saving…" : vehicleId ? "Save changes" : "Create vehicle"}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-line bg-white p-6">
      <h2 className="mb-4 font-display text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Field({
  f,
  defaultValue,
  defaultChecked,
}: {
  f: { name: string; label: string; type?: string; options?: string[] };
  defaultValue?: string;
  defaultChecked?: boolean;
}) {
  if (f.type === "checkbox") {
    return (
      <label className="flex h-11 items-center gap-2.5 rounded-xl border border-line bg-white px-4 text-sm font-semibold">
        <input type="checkbox" name={f.name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#2563eb]" />
        {f.label}
      </label>
    );
  }
  return (
    <div>
      <Label>{f.label}</Label>
      {f.options ? (
        <Select name={f.name} defaultValue={defaultValue}>
          <option value="">—</option>
          {f.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </Select>
      ) : (
        <Input name={f.name} type={f.type ?? "text"} defaultValue={defaultValue} />
      )}
    </div>
  );
}
