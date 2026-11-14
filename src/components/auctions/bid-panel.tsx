"use client";
import { useEffect, useRef, useState } from "react";
import { Countdown } from "./countdown";
import { formatMoney, type Currency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type State = {
  id: string;
  status: string;
  currency: Currency;
  startingPrice: number;
  bidIncrement: number;
  currentBid: number | null;
  bidCount: number;
  endsAt: number;
  minNextBid: number;
  serverTime: number;
};

export function BidPanel({
  auctionId,
  initial,
  isAuthed,
}: {
  auctionId: string;
  initial: State;
  isAuthed: boolean;
}) {
  const [st, setSt] = useState(initial);
  const [amount, setAmount] = useState(initial.minNextBid);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const keyRef = useRef<string>("");
  const drift = useRef(0);
  drift.current = Date.now() - st.serverTime;

  // Live updates via SSE; refetch authoritative state on every event/reconnect.
  useEffect(() => {
    const refresh = () =>
      fetch(`/api/auctions/${auctionId}/state`)
        .then((r) => r.json())
        .then((s: State) => {
          setSt(s);
          setAmount((a) => (a < s.minNextBid ? s.minNextBid : a));
        })
        .catch(() => {});
    const es = new EventSource(`/api/auctions/${auctionId}/events`);
    es.onmessage = refresh;
    es.onerror = () => setTimeout(refresh, 1500);
    return () => es.close();
  }, [auctionId]);

  async function submitBid() {
    setBusy(true);
    setMsg(null);
    if (!keyRef.current) keyRef.current = crypto.randomUUID();
    try {
      const r = await fetch(`/api/auctions/${auctionId}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountMinor: amount, idempotencyKey: keyRef.current }),
      });
      const data = await r.json();
      if (data.ok) {
        setMsg({ ok: true, text: "Bid accepted — you're in the lead." });
        keyRef.current = "";
        setSt(data.auction);
      } else {
        setMsg({ ok: false, text: humanize(data.reason) });
        if (data.auction) setSt(data.auction);
      }
    } catch {
      setMsg({ ok: false, text: "Network error — your bid was not confirmed. Try again." });
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  const live = st.status === "LIVE";
  const ended = !live;

  return (
    <div className="rounded-[14px] border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        {live ? <Badge tone="live" pulse>Live auction</Badge> : <Badge tone="neutral">{st.status}</Badge>}
        <span className="text-xs font-semibold text-muted">{st.bidCount} bids</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {st.currentBid != null ? "Current bid" : "Starting price"}
          </p>
          <p className="font-display text-[26px] font-extrabold leading-tight">
            {formatMoney(st.currentBid ?? st.startingPrice, st.currency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {live ? "Ends in" : "Ended"}
          </p>
          <Countdown
            endsAt={st.endsAt}
            serverDriftMs={drift.current}
            className={`font-display text-xl font-extrabold ${live ? "text-error" : "text-muted"}`}
          />
        </div>
      </div>

      {live && (
        <>
          <p className="mt-3 text-sm text-muted">
            Minimum next bid:{" "}
            <b className="text-graphite">{formatMoney(st.minNextBid, st.currency)}</b>
            {" · "}increment {formatMoney(st.bidIncrement, st.currency)}
          </p>
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Input
                type="number"
                min={st.minNextBid}
                step={st.bidIncrement}
                value={Math.floor(amount / 100)}
                onChange={(e) => setAmount(Math.round(Number(e.target.value) * 100))}
                aria-label="Bid amount"
                className="pr-14"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                {st.currency}
              </span>
            </div>
            <Button onClick={() => isAuthed ? setConfirm(true) : (location.href = "/login")}>
              Place bid
            </Button>
          </div>
          <button
            className="mt-2 text-xs font-semibold text-primary hover:underline"
            onClick={() => setAmount(st.minNextBid)}
          >
            Set to minimum
          </button>
        </>
      )}

      {msg && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${
            msg.ok ? "bg-success/10 text-success" : "bg-error/10 text-error"
          }`}
          role="status"
        >
          {msg.text}
        </p>
      )}

      {ended && (
        <p className="mt-4 rounded-lg bg-graphite/5 px-3 py-2 text-sm font-semibold text-muted">
          This auction is no longer accepting bids.
        </p>
      )}

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={submitBid}
        title="Confirm your bid"
        confirmLabel="Place bid"
        busy={busy}
      >
        You are about to bid{" "}
        <b className="text-graphite">{formatMoney(amount, st.currency)}</b>. This is a
        binding offer — if you win and the result is approved, you commit to purchase.
      </ConfirmModal>
    </div>
  );
}

function humanize(reason?: string) {
  if (!reason) return "Bid rejected.";
  if (reason.startsWith("below_minimum")) return "Bid is below the required minimum.";
  if (reason === "auction_not_live") return "This auction is not live.";
  if (reason === "auction_ended") return "This auction has ended.";
  if (reason === "forbidden_role") return "This account cannot place bids.";
  return "Bid rejected.";
}
