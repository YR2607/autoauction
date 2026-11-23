"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "iconoir-react";

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/vehicles${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
      }}
      className="flex items-center gap-2 rounded-lg border border-line bg-white p-2 shadow-lift"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search make, model or lot number…"
        className="focus-ring-none min-w-0 flex-1 bg-transparent px-4 text-sm text-ink outline-none placeholder:text-muted"
      />
      <button
        type="submit"
        className="inline-flex h-11 items-center gap-2 rounded-md bg-cta px-6 text-sm font-bold text-white transition-colors hover:bg-cta-hover"
      >
        <Search className="h-4 w-4" /> Search
      </button>
    </form>
  );
}
