"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const GENERAL: FieldDef[] = [
  { name: "make", label: "Make", required: true },
  { name: "model", label: "Model", required: true },
  { name: "trim", label: "Trim" },
  { name: "year", label: "Year", type: "number", required: true },
  { name: "vin", label: "VIN" },
  { name: "vinVisibility", label: "VIN visibility", options: ["last4", "full", "hidden"] },
];

const SPECS: FieldDef[] = [
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

const CONDITION: FieldDef[] = [
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

type FieldDef = { name: string; label: string; type?: string; options?: string[]; required?: boolean };

const STEPS = [
  "General",
  "Specifications",
  "Condition",
  "Sale & pricing",
  "Records",
  "Review",
] as const;

export function VehicleForm({
  vehicleId,
  initial,
}: {
  vehicleId?: string;
  initial?: Record<string, unknown>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const v = (k: string) => (initial?.[k] ?? "") as string;
  const vb = (k: string) => initial?.[k] === true || initial?.[k] === 1;
  const last = STEPS.length - 1;

  function collectBody() {
    const fd = new FormData(formRef.current!);
    const body: Record<string, unknown> = {};
    for (const f of [...GENERAL, ...SPECS, ...CONDITION]) {
      if (f.type === "checkbox") body[f.name] = fd.get(f.name) === "on";
      else body[f.name] = fd.get(f.name);
    }
    for (const k of ["description", "sellerNotes", "serviceHistory", "registrationInfo", "saleType", "buyNowPrice", "buyNowCurrency"]) {
      body[k] = fd.get(k);
    }
    return body;
  }

  async function save() {
    const body = collectBody();
    if (!body.make || !body.model || !body.year) {
      setErr("Make, model and year are required.");
      setStep(0);
      return;
    }
    setBusy(true);
    setErr(null);
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

  function reviewRows() {
    const b = collectBody();
    const pick = (k: string) => (b[k] ? String(b[k]) : "—");
    return [
      ["Vehicle", `${pick("make")} ${pick("model")} ${pick("trim")} ${pick("year")}`.replace(/\s+/g, " ")],
      ["VIN", pick("vin")],
      ["Mileage", b.mileage ? `${Number(b.mileage).toLocaleString("en-GB")} km` : "—"],
      ["Body / fuel", `${pick("bodyType")} · ${pick("fuelType")}`],
      ["Condition", pick("conditionOverall")],
      ["Sale type", String(b.saleType ?? "—").replace(/_/g, " + ")],
      ["Buy Now", b.buyNowPrice ? `${b.buyNowPrice} ${b.buyNowCurrency}` : "—"],
    ];
  }

  return (
    <div>
      {/* stepper */}
      <ol className="scroll-thin mb-6 flex gap-1 overflow-x-auto rounded-[14px] border border-line bg-white p-1.5">
        {STEPS.map((label, i) => (
          <li key={label} className="shrink-0">
            <button
              type="button"
              onClick={() => setStep(i)}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors",
                i === step
                  ? "bg-graphite text-white"
                  : i < step
                    ? "text-success hover:bg-graphite/5"
                    : "text-muted hover:bg-graphite/5",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  i === step ? "bg-white/20" : i < step ? "bg-success/10" : "bg-graphite/5",
                )}
              >
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      <form
        ref={formRef}
        onSubmit={(e) => e.preventDefault()}
        className="space-y-6"
      >
        <div className={cn(step !== 0 && "hidden")}>
          <Section title="General information">
            <Grid>{GENERAL.map((f) => <Field key={f.name} f={f} defaultValue={v(f.name)} />)}</Grid>
          </Section>
        </div>

        <div className={cn(step !== 1 && "hidden")}>
          <Section title="Specifications">
            <Grid>{SPECS.map((f) => <Field key={f.name} f={f} defaultValue={v(f.name)} />)}</Grid>
          </Section>
        </div>

        <div className={cn(step !== 2 && "hidden")}>
          <Section title="Condition">
            <Grid>{CONDITION.map((f) => <Field key={f.name} f={f} defaultValue={v(f.name)} defaultChecked={vb(f.name)} />)}</Grid>
          </Section>
        </div>

        <div className={cn(step !== 3 && "hidden")}>
          <Section title="Sale & pricing">
            <Grid>
              <div>
                <Label>Sale type</Label>
                <Select name="saleType" defaultValue={(initial?.saleType as string) ?? "AUCTION"}>
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
            <p className="mt-3 text-xs text-muted">
              Auction settings (schedule, start price, increment) are configured on the vehicle page after creation.
            </p>
          </Section>
        </div>

        <div className={cn(step !== 4 && "hidden")}>
          <Section title="Description & records">
            <div className="space-y-4">
              <div><Label>Description</Label><Textarea name="description" defaultValue={v("description")} /></div>
              <div><Label>Seller notes</Label><Textarea name="sellerNotes" defaultValue={v("sellerNotes")} /></div>
              <div><Label>Service history</Label><Textarea name="serviceHistory" defaultValue={v("serviceHistory")} /></div>
              <div><Label>Registration info</Label><Textarea name="registrationInfo" defaultValue={v("registrationInfo")} /></div>
            </div>
          </Section>
        </div>

        {step === last && (
          <Section title="Review">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {reviewRows().map(([k, val]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line/50 pb-2 text-sm">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-semibold">{val}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 rounded-lg bg-graphite/5 px-3.5 py-2.5 text-xs font-semibold text-muted">
              The vehicle is {vehicleId ? "updated in place" : "created as DRAFT"} — photos, documents
              and auction scheduling are managed on the vehicle page.
            </p>
          </Section>
        )}

        {err && (
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm font-semibold text-error">
            {err}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            {step < last ? (
              <Button type="button" onClick={() => setStep((s) => Math.min(last, s + 1))}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" size="lg" loading={busy} onClick={save}>
                {vehicleId ? "Save changes" : "Create vehicle"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
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
  f: FieldDef;
  defaultValue?: string;
  defaultChecked?: boolean;
}) {
  if (f.type === "checkbox") {
    return (
      <label className="flex h-11 items-center gap-2.5 rounded-xl border border-line bg-white px-4 text-sm font-semibold transition-colors hover:border-graphite/30">
        <input type="checkbox" name={f.name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#2563eb]" />
        {f.label}
      </label>
    );
  }
  return (
    <div>
      <Label>
        {f.label}
        {f.required && <span className="ml-0.5 text-error">*</span>}
      </Label>
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
