import { getSetting } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings · Admin" };

const KEYS: { key: string; label: string; type: "text" | "number" }[] = [
  { key: "platform.name", label: "Platform name", type: "text" },
  { key: "platform.defaultCurrency", label: "Default currency", type: "text" },
  { key: "platform.timeZone", label: "Time zone", type: "text" },
  { key: "auction.extensionWindowSec", label: "Extension window (seconds)", type: "number" },
  { key: "auction.extensionDurationSec", label: "Extension duration (seconds)", type: "number" },
  { key: "auction.defaultDurationSec", label: "Default auction duration (seconds)", type: "number" },
  { key: "auction.defaultIncrementMinor.EUR", label: "Default increment EUR (minor units)", type: "number" },
  { key: "auction.defaultIncrementMinor.USD", label: "Default increment USD (minor units)", type: "number" },
  { key: "auction.defaultIncrementMinor.GBP", label: "Default increment GBP (minor units)", type: "number" },
  { key: "media.maxImages", label: "Max images per vehicle", type: "number" },
  { key: "rate.bidsPerMin", label: "Bid rate limit (per min/user)", type: "number" },
  { key: "rate.authPerMin", label: "Auth rate limit (per min/IP)", type: "number" },
];

export default function SettingsPage() {
  const values = Object.fromEntries(KEYS.map((k) => [k.key, getSetting(k.key)]));
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Settings</h1>
      <p className="mt-1 text-sm text-muted">Configurable business rules. Changes apply within ~10 seconds.</p>
      <div className="mt-6 max-w-xl">
        <SettingsForm fields={KEYS} values={values} />
      </div>
    </div>
  );
}
