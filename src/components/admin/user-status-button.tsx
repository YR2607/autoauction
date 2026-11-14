"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/dialog";

export function UserStatusButton({ userId, status }: { userId: string; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const suspend = status === "active";

  return (
    <>
      <button
        className={`text-xs font-bold hover:underline ${suspend ? "text-error" : "text-success"}`}
        onClick={() => setOpen(true)}
      >
        {suspend ? "Suspend" : "Reactivate"}
      </button>
      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={async () => {
          setBusy(true);
          await fetch(`/api/admin/users/${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: suspend ? "suspended" : "active" }),
          });
          setBusy(false);
          setOpen(false);
          router.refresh();
        }}
        title={suspend ? "Suspend user" : "Reactivate user"}
        confirmLabel={suspend ? "Suspend" : "Reactivate"}
        danger={suspend}
        busy={busy}
      >
        {suspend
          ? "The user loses access immediately; active sessions are revoked."
          : "The user regains the ability to sign in and bid."}
      </ConfirmModal>
    </>
  );
}
