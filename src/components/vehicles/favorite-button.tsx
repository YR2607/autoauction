"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
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
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
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
        "flex h-11 w-11 items-center justify-center rounded-full border transition-all",
        fav
          ? "border-error/30 bg-error/10 text-error"
          : "border-line bg-white text-muted hover:text-error",
      )}
    >
      <Heart className={cn("h-5 w-5", fav && "fill-current")} />
    </button>
  );
}
