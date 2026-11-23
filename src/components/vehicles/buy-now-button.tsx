"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/dialog";
import { formatMoney, type Currency } from "@/lib/currency";

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
      setDone("Network error. Try again.");
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  if (done === "ok")
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-5 text-center">
        <p className="font-display text-lg font-bold text-success">Request received</p>
        <p className="mt-1 text-sm text-muted">
          Your purchase request is pending administrator approval.
        </p>
      </div>
    );

  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Buy Now price
        </p>
        <Badge tone="dark">Fixed price</Badge>
      </div>
      <p className="tnum font-display text-[26px] font-extrabold leading-tight">
        {formatMoney(price, currency)}
      </p>
      <Button
        className="mt-4 w-full"
        size="lg"
        loading={busy}
        onClick={() => (isAuthed ? setConfirm(true) : (location.href = "/login"))}
      >
        Buy Now — request purchase
      </Button>
      <p className="mt-2.5 text-center text-xs text-muted">
        Submits a purchase request — an administrator confirms the sale.
      </p>
      {done && done !== "ok" && (
        <p className="mt-3 rounded-lg bg-error/20 px-3 py-2 text-sm font-semibold text-red-200">
          {done}
        </p>
      )}
      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={submit}
        title="Confirm purchase"
        confirmLabel="Submit purchase request"
        busy={busy}
      >
        You are requesting to buy this vehicle for{" "}
        <b>{formatMoney(price, currency)}</b>. The vehicle will be reserved and our team
        will review your request.
      </ConfirmModal>
    </div>
  );
}
