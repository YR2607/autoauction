"use client";
import { useEffect, useRef, useState } from "react";
import { Countdown } from "./countdown";
import { formatMoney, type Currency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/dialog";
import { TrendingUp, AlertTriangle } from "lucide-react";

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
  SCHEDULED: "Upcoming Auction",
  LIVE: "Live Auction",
  ENDED: "Auction Ended",
  AWAITING_ADMIN_APPROVAL: "Awaiting Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SOLD: "Sold",
  UNSOLD: "Unsold",
  CANCELLED: "Cancelled",
  DRAFT: "Draft",
};

function humanize(r?: string) {
  switch (r) {
    case "auction_not_live":
      return "Auction is not accepting bids right now.";
    case "bid_too_low":
      return "Bid must be at least the minimum next bid.";
    case "outbid":
      return "A higher bid was placed just before yours.";
    default:
      return "Unable to place bid. Please try again.";
  }
}

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
        setMsg({ ok: true, text: "Bid accepted. You are currently in the lead." });
        keyRef.current = "";
        setSt(data.auction);
      } else {
        setMsg({ ok: false, text: humanize(data.reason) });
        if (data.auction) setSt(data.auction);
      }
    } catch {
      setMsg({ ok: false, text: "Network error. Your bid was not recorded. Please try again." });
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
    <div className="overflow-hidden rounded-none border-2 border-[#0b3b60] bg-white">
      <div className="flex items-center justify-between border-b border-[#0b3b60] bg-[#0b3b60] px-4 py-2 text-white">
        <span className="flex items-center gap-2">
          {live ? (
            <span className="bg-[#cc0000] text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
              LIVE AUCTION
            </span>
          ) : (
            <span className="text-xs font-bold uppercase tracking-wider text-[#cbd5e1]">
              {STATUS_LABELS[st.status] ?? st.status}
            </span>
          )}
        </span>
        <span className="rounded-none bg-[#072a47] px-2 py-0.5 text-xs font-bold text-white">
          {st.bidCount} {st.bidCount === 1 ? "bid" : "bids"}
        </span>
      </div>

      <div className="p-4 bg-white text-[#1e293b]">
        <div className="grid grid-cols-2 items-end gap-3 border-b border-[#e2e8f0] pb-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              {st.currentBid != null ? "Current Bid:" : "Starting Price:"}
            </p>
            <p className="tnum mt-0.5 font-mono text-2xl font-black text-[#0b3b60] leading-none">
              {formatMoney(st.currentBid ?? st.startingPrice, st.currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              {live ? "Time Remaining:" : scheduled ? "Starts In:" : "Status:"}
            </p>
            <Countdown
              endsAt={st.endsAt}
              serverDriftMs={drift.current}
              className={`tnum text-lg font-black ${live ? "text-[#cc0000]" : "text-[#64748b]"}`}
            />
          </div>
        </div>

        {isAuthed && st.isLeading != null && (live || st.bidCount > 0) && (
          <p
            className={`mt-3 flex items-center gap-1.5 rounded-none border px-3 py-1.5 text-xs font-bold ${
              st.isLeading
                ? "border-[#86efac] bg-[#f0fdf4] text-[#15803d]"
                : "border-[#fde047] bg-[#fefce8] text-[#a16207]"
            }`}
            role="status"
          >
            {st.isLeading ? (
              <><TrendingUp className="h-4 w-4" /> You are leading this auction</>
            ) : (
              <><AlertTriangle className="h-4 w-4" /> You have been outbid</>
            )}
          </p>
        )}

        {live && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-[#475569]">
              <span>Minimum next bid:</span>
              <b className="tnum font-mono text-sm font-black text-[#0b3b60]">
                {formatMoney(st.minNextBid, st.currency)}
              </b>
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {quick.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`tnum rounded-none border py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                    amount === v
                      ? "border-[#0b3b60] bg-[#0b3b60] text-white"
                      : "border-[#cbd5e1] bg-[#f8fafc] text-[#334155] hover:border-[#0b3b60] hover:bg-white"
                  }`}
                >
                  {formatMoney(v, st.currency)}
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={Math.floor(st.minNextBid / 100)}
                  step={Math.max(1, Math.floor(st.bidIncrement / 100))}
                  value={Math.floor(amount / 100)}
                  onChange={(e) => setAmount(Math.round(Number(e.target.value) * 100))}
                  aria-label={`Bid amount in ${st.currency}`}
                  className="tnum h-9 w-full rounded-none border border-[#cbd5e1] bg-white px-3 pr-12 text-sm font-bold text-[#1e293b] outline-none focus:border-[#0b3b60]"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748b]">
                  {st.currency}
                </span>
              </div>
              <Button
                variant="primary"
                size="md"
                className="px-6"
                onClick={() => (isAuthed ? setConfirm(true) : (location.href = "/login"))}
              >
                Bid Now
              </Button>
            </div>
          </div>
        )}

        {scheduled && (
          <div className="mt-4 border border-[#cbd5e1] bg-[#f8fafc] p-3 text-center text-xs text-[#64748b]">
            Bidding will open when the countdown reaches zero.
          </div>
        )}

        {!live && !scheduled && (
          <div className="mt-4 border border-[#cbd5e1] bg-[#f8fafc] p-3 text-center text-xs text-[#64748b]">
            This auction has concluded.
          </div>
        )}

        {msg && (
          <p
            className={`mt-3 rounded-none border p-2 text-xs font-bold ${
              msg.ok
                ? "border-[#86efac] bg-[#f0fdf4] text-[#15803d]"
                : "border-[#fca5a5] bg-[#fef2f2] text-[#b91c1c]"
            }`}
            role="status"
          >
            {msg.text}
          </p>
        )}
      </div>

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={submitBid}
        title="Confirm Live Auction Bid"
        confirmLabel={`Submit Bid of ${formatMoney(amount, st.currency)}`}
        busy={busy}
      >
        You are about to place a binding bid of{" "}
        <b className="text-[#0b3b60]">{formatMoney(amount, st.currency)}</b>. If this bid wins, you will be obligated to complete the purchase according to auction terms.
      </ConfirmModal>
    </div>
  );
}
