"use client";
import { useEffect, useRef, useState } from "react";
import { Countdown } from "./countdown";
import { formatMoney, type Currency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/dialog";
import { GraphUp as TrendingUp, WarningTriangle as AlertTriangle } from "iconoir-react";
import { Gavel } from "@phosphor-icons/react/ssr";

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
  isLeading?: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Upcoming",
  LIVE: "Live",
  ENDED: "Ended",
  AWAITING_ADMIN_APPROVAL: "Awaiting approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SOLD: "Sold",
  UNSOLD: "Unsold",
  CANCELLED: "Cancelled",
  DRAFT: "Draft",
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
        setMsg({ ok: true, text: "Bid accepted. You're in the lead." });
        keyRef.current = "";
        setSt(data.auction);
      } else {
        setMsg({ ok: false, text: humanize(data.reason) });
        if (data.auction) setSt(data.auction);
      }
    } catch {
      setMsg({ ok: false, text: "Network error. Your bid was not confirmed. Try again." });
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  const live = st.status === "LIVE";
  const scheduled = st.status === "SCHEDULED";
  const quick = [1, 2, 5].map(
    (n) => st.minNextBid + st.bidIncrement * (n - 1),
  );

  return (
    <div className="overflow-hidden rounded-lg bg-ink text-white shadow-card">
      {/* header strip */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <span className="flex items-center gap-2">
          {live ? (
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-red-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
              </span>
              Live auction
            </span>
          ) : (
            <span className="text-[11px] font-bold uppercase tracking-wide text-white/50">
              {STATUS_LABELS[st.status] ?? st.status}
            </span>
          )}
        </span>
        <span className="text-xs font-semibold text-white/50">
          {st.bidCount} bid{st.bidCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 items-end gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
              {st.currentBid != null ? "Current bid" : "Starting price"}
            </p>
            <p className="tnum mt-0.5 font-display text-[28px] font-extrabold leading-none">
              {formatMoney(st.currentBid ?? st.startingPrice, st.currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
              {live ? "Ends in" : scheduled ? "Ended in" : "Ended"}
            </p>
            <Countdown
              endsAt={st.endsAt}
              serverDriftMs={drift.current}
              className={`tnum font-display text-xl font-extrabold ${live ? "text-amber-300" : "text-white/40"}`}
            />
          </div>
        </div>

        {/* leading / outbid */}
        {isAuthed && st.isLeading != null && (live || st.bidCount > 0) && (
          <p
            className={`mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-bold ${
              st.isLeading
                ? "bg-success/15 text-emerald-300"
                : "bg-amber-400/15 text-amber-300"
            }`}
            role="status"
          >
            {st.isLeading ? (
              <><TrendingUp className="h-4 w-4" /> You're leading this auction</>
            ) : (
              <><AlertTriangle className="h-4 w-4" /> You've been outbid</>
            )}
          </p>
        )}

        {live && (
          <div className="mt-5">
            <p className="text-sm text-white/60">
              Minimum next bid{" "}
              <b className="tnum text-white">
                {formatMoney(st.minNextBid, st.currency)}
              </b>
            </p>

            {/* quick amounts */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {quick.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`tnum rounded-lg border px-2 py-2 text-[13px] font-bold transition-colors ${
                    amount === v
                      ? "border-primary bg-primary text-white"
                      : "border-white/15 bg-white/5 text-white/80 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {formatMoney(v, st.currency)}
                </button>
              ))}
            </div>

            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={Math.floor(st.minNextBid / 100)}
                  step={Math.max(1, Math.floor(st.bidIncrement / 100))}
                  value={Math.floor(amount / 100)}
                  onChange={(e) => setAmount(Math.round(Number(e.target.value) * 100))}
                  aria-label={`Bid amount in ${st.currency}`}
                  className="tnum h-11 w-full rounded-lg border border-white/15 bg-white/5 px-4 pr-14 text-sm font-bold text-white outline-none transition-colors focus:border-white/40 focus:ring-2 focus:ring-white/20"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40">
                  {st.currency}
                </span>
              </div>
              <Button
                size="lg"
                loading={busy}
                className="bg-white text-ink hover:bg-white/85"
                onClick={() =>
                  isAuthed ? setConfirm(true) : (location.href = "/login")
                }
              >
                {isAuthed ? "Place bid" : "Sign in to bid"}
              </Button>
            </div>
            <button
              className="mt-2 text-xs font-semibold text-white/50 transition-colors hover:text-white"
              onClick={() => setAmount(st.minNextBid)}
            >
              Reset to minimum
            </button>
          </div>
        )}

        {scheduled && (
          <p className="mt-4 rounded-lg bg-white/5 px-3 py-2.5 text-sm font-semibold text-white/60">
            Bidding opens when the auction goes live.
          </p>
        )}
        {!live && !scheduled && (
          <p className="mt-4 rounded-lg bg-white/5 px-3 py-2.5 text-sm font-semibold text-white/60">
            This auction is no longer accepting bids.
          </p>
        )}

        {msg && (
          <p
            className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${
              msg.ok ? "bg-success/15 text-emerald-300" : "bg-error/20 text-red-300"
            }`}
            role="alert"
          >
            {msg.text}
          </p>
        )}
      </div>

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
        firm offer — if you win and the result is approved, you commit to purchase.
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
