"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function SearchBar({ placeholder = "Search make, model, VIN or lot number…" }: { placeholder?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/vehicles${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
      }}
      className="flex w-full overflow-hidden rounded-none border-2 border-[#ffb81c] bg-white"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-white px-3 py-1.5 text-xs text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
      />
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 bg-[#ffb81c] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#051a2e] transition-colors hover:bg-[#e5a519] cursor-pointer"
      >
        <Search className="h-3.5 w-3.5" /> Search
      </button>
    </form>
  );
}
