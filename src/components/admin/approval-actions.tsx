"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ConfirmModal, Modal } from "@/components/ui/dialog";

export function ApprovalActions({ auctionId, endsAt }: { auctionId: string; endsAt: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [next, setNext] = useState<"REOPEN" | "NEXT_BIDDER" | "UNSOLD">("UNSOLD");
  const [reopenH, setReopenH] = useState(24);

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    const r = await fetch(`/api/admin/auctions/${auctionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) setErr(d.error ?? "Action failed");
    else {
      setApproveOpen(false);
      setRejectOpen(false);
    }
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
      <Button size="sm" onClick={() => setApproveOpen(true)}>Approve result</Button>
      <Button size="sm" variant="danger" onClick={() => setRejectOpen(true)}>Reject result</Button>
      {err && <span className="text-xs font-semibold text-error">{err}</span>}

      <ConfirmModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onConfirm={() => call({ action: "approve" })}
        title="Approve auction result"
        confirmLabel="Approve"
        busy={busy}
      >
        The winning bid becomes a confirmed sale. The buyer is notified and the
        vehicle is marked as sold.
      </ConfirmModal>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject auction result"
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
                  next,
                  newEndsAt: next === "REOPEN" ? Date.now() + reopenH * 3600_000 : undefined,
                })
              }
            >
              Reject & apply
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <Label>Reason (required, goes to audit log)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Suspected shill bidding" />
          </div>
          <div>
            <Label>Next action</Label>
            <Select value={next} onChange={(e) => setNext(e.target.value as typeof next)}>
              <option value="UNSOLD">Mark vehicle as unsold</option>
              <option value="NEXT_BIDDER">Award next eligible bidder</option>
              <option value="REOPEN">Reopen auction</option>
            </Select>
          </div>
          {next === "REOPEN" && (
            <div>
              <Label>New duration (hours)</Label>
              <Input type="number" min={1} value={reopenH} onChange={(e) => setReopenH(Number(e.target.value))} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
