"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/dialog";

export function VehicleStatusActions({ vehicleId, status }: { vehicleId: string; status: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<"PUBLISHED" | "ARCHIVED" | null>(null);
  const [busy, setBusy] = useState(false);

  async function setStatus(s: string) {
    setBusy(true);
    await fetch(`/api/admin/vehicles/${vehicleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    setBusy(false);
    setConfirm(null);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {status !== "PUBLISHED" && (
        <Button size="sm" onClick={() => setConfirm("PUBLISHED")}>Publish</Button>
      )}
      {status !== "ARCHIVED" && (
        <Button size="sm" variant="outline" onClick={() => setConfirm("ARCHIVED")}>Archive</Button>
      )}
      <ConfirmModal
        open={confirm != null}
        onClose={() => setConfirm(null)}
        onConfirm={() => setStatus(confirm!)}
        title={confirm === "PUBLISHED" ? "Publish vehicle" : "Archive vehicle"}
        confirmLabel={confirm === "PUBLISHED" ? "Publish" : "Archive"}
        danger={confirm === "ARCHIVED"}
        busy={busy}
      >
        {confirm === "PUBLISHED"
          ? "The vehicle will become publicly visible."
          : "The vehicle will be hidden from the public catalog."}
      </ConfirmModal>
    </div>
  );
}
