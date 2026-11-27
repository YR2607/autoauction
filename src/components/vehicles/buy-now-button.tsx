"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/dialog";
import { formatMoney, type Currency } from "@/lib/currency";
import { CheckCircle2 } from "lucide-react";

export function BuyNowButton({
  vehicleId,
  price,
  currency,
  isAuthed,
}: {
  vehicleId: string;
  price: number;
  currency: Currency;
  isAuthed: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"ok" | string | null>(null);

  async function submit() {
    setBusy(true);
    try {
      const r = await fetch(`/api/vehicles/${vehicleId}/buy-now`, { method: "POST" });
      const d = await r.json();
      setDone(r.ok && d.ok ? "ok" : d.error ?? "Purchase request failed.");
    } catch {
      setDone("Network error. Please try again.");
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  if (done === "ok")
    return (
      <div className="rounded-none border border-[#86efac] bg-[#f0fdf4] p-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-[#15803d]">
          <CheckCircle2 className="h-4 w-4" /> Purchase Request Submitted
        </div>
        <p className="mt-1 text-xs text-[#475569]">
          The vehicle is reserved for you. An auction administrator will confirm the sale shortly.
        </p>
      </div>
    );

  return (
    <div className="rounded-none border border-[#cbd5e1] bg-white p-4">
      <div className="flex items-baseline justify-between border-b border-[#f1f5f9] pb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
          Instant Purchase Price:
        </span>
        <Badge tone="dark">DIRECT SALE</Badge>
      </div>
      <p className="tnum mt-1 font-mono text-2xl font-black text-[#0b3b60]">
        {formatMoney(price, currency)}
      </p>
      <Button
        className="mt-3 w-full"
        variant="secondary"
        size="md"
        loading={busy}
        onClick={() => (isAuthed ? setConfirm(true) : (location.href = "/login"))}
      >
        Buy It Now
      </Button>
      <p className="mt-2 text-center text-[11px] text-[#64748b]">
        Instantly reserves the vehicle and locks the purchase price.
      </p>
      {done && done !== "ok" && (
        <p className="mt-2 rounded-none border border-[#fca5a5] bg-[#fef2f2] px-3 py-1.5 text-xs font-bold text-[#b91c1c]">
          {done}
        </p>
      )}
      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={submit}
        title="Confirm Fixed-Price Purchase"
        confirmLabel="Reserve & Purchase"
        busy={busy}
      >
        You are requesting to buy this vehicle for{" "}
        <b className="text-[#0b3b60]">{formatMoney(price, currency)}</b>. The lot will be reserved and assigned to your account.
      </ConfirmModal>
    </div>
  );
}
