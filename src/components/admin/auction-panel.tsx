"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal, Modal } from "@/components/ui/dialog";
import { formatMoney, type Currency } from "@/lib/currency";

type Auction = {
  id: string;
  status: string;
  currency: string;
  startingPrice: number;
  bidIncrement: number;
  currentBid: number | null;
  bidCount: number;
  startsAt: number;
  endsAt: number;
};

export function AuctionPanel({
  vehicleId,
  saleType,
  auction,
}: {
  vehicleId: string;
  saleType: string;
  auction: Auction | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const needsAuction = saleType !== "BUY_NOW";

  async function action(body: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    const r = await fetch(`/api/admin/auctions/${auction!.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setErr(d.error ?? "Action failed");
    setCancelOpen(false);
    router.refresh();
    setBusy(false);
  }

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const startH = Number(fd.get("startsInH"));
    const durH = Number(fd.get("durationH"));
    const r = await fetch("/api/admin/auctions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId,
        currency: fd.get("currency"),
        startingPrice: Number(fd.get("startingPrice")),
        bidIncrement: Number(fd.get("bidIncrement")),
        startsAt: Date.now() + startH * 3600_000,
        endsAt: Date.now() + (startH + durH) * 3600_000,
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setErr(d.error ?? "Create failed");
    router.refresh();
    setBusy(false);
  }

  if (!needsAuction)
    return <p className="text-xs text-[#64748b]">Sale type is Buy Now. No auction needed.</p>;

  if (!auction) {
    return (
      <form onSubmit={create} className="space-y-3">
        <div>
          <Label>Currency</Label>
          <Select name="currency" defaultValue="EUR">
            <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Start price</Label><Input name="startingPrice" type="number" required min="1" /></div>
          <div><Label>Increment</Label><Input name="bidIncrement" type="number" required min="1" defaultValue="250" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Starts in (hours)</Label><Input name="startsInH" type="number" required min="0" defaultValue="1" step="0.1" /></div>
          <div><Label>Duration (hours)</Label><Input name="durationH" type="number" required min="1" defaultValue="72" /></div>
        </div>
        {err && <p className="text-xs font-semibold text-error">{err}</p>}
        <Button type="submit" size="sm" loading={busy} className="w-full">Create auction (draft)</Button>
      </form>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <Badge tone={auction.status === "LIVE" ? "live" : auction.status === "SCHEDULED" ? "warning" : "neutral"} pulse={auction.status === "LIVE"}>
          {auction.status}
        </Badge>
        <span className="text-xs text-muted">{auction.bidCount} bids</span>
      </div>
      <dl className="space-y-1.5 text-xs">
        <Row k="Start price" v={formatMoney(auction.startingPrice, auction.currency as Currency)} />
        <Row k="Increment" v={formatMoney(auction.bidIncrement, auction.currency as Currency)} />
        <Row k="Current bid" v={formatMoney(auction.currentBid, auction.currency as Currency)} />
        <Row k="Starts" v={new Date(auction.startsAt).toLocaleString("en-GB")} />
        <Row k="Ends" v={new Date(auction.endsAt).toLocaleString("en-GB")} />
      </dl>

      {auction.status === "DRAFT" && (
        <Button size="sm" className="w-full" loading={busy} onClick={() => action({ action: "schedule" })}>
          Schedule auction
        </Button>
      )}
      {(auction.status === "DRAFT" || auction.status === "SCHEDULED" || auction.status === "LIVE") && (
        <Button size="sm" variant="danger" className="w-full" loading={busy} onClick={() => setCancelOpen(true)}>
          Cancel auction
        </Button>
      )}
      {err && <p className="text-xs font-semibold text-error">{err}</p>}

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel auction"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Back</Button>
            <Button variant="danger" disabled={busy || cancelReason.trim().length < 3} onClick={() => action({ action: "cancel", reason: cancelReason })}>
              Cancel auction
            </Button>
          </>
        }
      >
        <p className="mb-3">A reason is required and recorded in the audit log.</p>
        <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason…" />
      </Modal>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
