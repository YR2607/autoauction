"use client";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  vehicleId,
  initial,
  isAuthed,
}: {
  vehicleId: string;
  initial: boolean;
  isAuthed: boolean;
}) {
  const [fav, setFav] = useState(initial);
  const [busy, setBusy] = useState(false);
  return (
    <button
      aria-label={fav ? "Remove from watchlist" : "Add to watchlist"}
      disabled={busy}
      onClick={async () => {
        if (!isAuthed) return (location.href = "/login");
        setBusy(true);
        const r = await fetch(`/api/vehicles/${vehicleId}/favorite`, {
          method: fav ? "DELETE" : "POST",
        });
        if (r.ok) setFav(!fav);
        setBusy(false);
      }}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-none border px-3 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
        fav
          ? "border-[#cc0000] bg-[#cc0000] text-white"
          : "border-[#cbd5e1] bg-white text-[#0b3b60] hover:bg-[#f1f5f9]",
      )}
    >
      <Bookmark className={cn("h-3.5 w-3.5", fav && "fill-current")} />
      <span>{fav ? "Watching" : "Watch"}</span>
    </button>
  );
}
