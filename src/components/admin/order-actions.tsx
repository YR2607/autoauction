"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ConfirmModal, Modal } from "@/components/ui/dialog";

export function OrderActions({
  orderId,
  approved,
  endedByBuyNow,
}: {
  orderId: string;
  approved?: boolean;
  /** true when this Buy Now order ended an auction — rejection must choose a recovery path */
  endedByBuyNow?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [auctionAction, setAuctionAction] = useState<"REOPEN" | "UNSOLD">("REOPEN");
  const [reopenH, setReopenH] = useState(24);

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    const r = await fetch(`/api/admin/orders/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setErr(d.error ?? "Action failed");
    else {
      setApproveOpen(false);
      setRejectOpen(false);
      setCompleteOpen(false);
    }
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
      {!approved ? (
        <>
          <Button size="sm" onClick={() => setApproveOpen(true)}>Approve</Button>
          <Button size="sm" variant="danger" onClick={() => setRejectOpen(true)}>Reject</Button>
        </>
      ) : (
        <Button size="sm" onClick={() => setCompleteOpen(true)}>Mark completed</Button>
      )}
      {err && <span className="text-xs font-semibold text-error">{err}</span>}

      <ConfirmModal open={approveOpen} onClose={() => setApproveOpen(false)} onConfirm={() => call({ action: "approve" })} title="Approve purchase" confirmLabel="Approve" busy={busy}>
        The buyer is notified and the vehicle is marked as sold.
      </ConfirmModal>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject purchase request"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Back</Button>
            <Button
              variant="danger"
              disabled={busy || reason.trim().length < 3}
              onClick={() =>
                call({
                  action: "reject",
                  reason,
                  ...(endedByBuyNow
                    ? {
                        auctionAction,
                        newEndsAt:
                          auctionAction === "REOPEN" ? Date.now() + reopenH * 3600_000 : undefined,
                      }
                    : {}),
                })
              }
            >
              Reject
            </Button>
          </>
        }
      >
        <Label>Reason (required)</Label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason…" />
        <p className="mt-2 text-xs">The vehicle will return to published status.</p>
        {endedByBuyNow && (
          <div className="mt-3 rounded-lg border border-line bg-surface p-3">
            <Label>This Buy Now request ended an auction. Choose recovery</Label>
            <div className="mt-2 space-y-1.5 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name={`auctionAction-${orderId}`}
                  checked={auctionAction === "REOPEN"}
                  onChange={() => setAuctionAction("REOPEN")}
                />
                <span>
                  <b>Reopen auction</b>: resumes LIVE for 24h with all previous bids kept.
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  name={`auctionAction-${orderId}`}
                  checked={auctionAction === "UNSOLD"}
                  onChange={() => setAuctionAction("UNSOLD")}
                />
                <span>
                  <b>Mark unsold</b>: closes the auction permanently; vehicle goes back on sale.
                </span>
              </label>
            </div>
            {auctionAction === "REOPEN" && (
              <div className="mt-3">
                <Label>New duration (hours)</Label>
                <Input
                  type="number"
                  min={1}
                  max={720}
                  value={reopenH}
                  onChange={(e) => setReopenH(Math.max(1, Number(e.target.value) || 24))}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal open={completeOpen} onClose={() => setCompleteOpen(false)} onConfirm={() => call({ action: "complete", paymentStatus: "paid" })} title="Complete order" confirmLabel="Complete" busy={busy}>
        Mark the order as completed and payment as received.
      </ConfirmModal>
    </div>
  );
}
