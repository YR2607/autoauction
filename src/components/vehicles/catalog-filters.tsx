"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { FilterChip } from "@/components/ui/chip";
import { SlidersHorizontal, Search, RotateCcw, Filter, ChevronRight } from "lucide-react";

export type FilterOptions = {
  makes: string[];
  fuelTypes: string[];
  transmissions: string[];
  bodyTypes: string[];
};

const SORTS = [
  ["newest", "Newest first"],
  ["price_asc", "Price: Low to High"],
  ["price_desc", "Price: High to Low"],
  ["ending_soon", "Ending soonest"],
  ["highest_bid", "Highest bid first"],
] as const;

const FILTER_LABELS: Record<string, (v: string) => string> = {
  q: (v) => `“${v}”`,
  make: (v) => `Make: ${v}`,
  model: (v) => `Model: ${v}`,
  yearFrom: (v) => `Year ≥ ${v}`,
  yearTo: (v) => `Year ≤ ${v}`,
  priceMax: (v) => `≤ ${Number(v).toLocaleString("en-US")} €`,
  mileageMax: (v) => `≤ ${Number(v).toLocaleString("en-US")} mi`,
  fuelType: (v) => `Fuel: ${v}`,
  transmission: (v) => `Trans: ${v}`,
  bodyType: (v) => `Body: ${v}`,
  saleType: (v) => (v === "BUY_NOW" ? "Buy Now" : v === "AUCTION" ? "Auction" : v),
  currency: (v) => `Currency: ${v}`,
  auctionStatus: (v) => (v === "LIVE" ? "Live Auction" : v === "SCHEDULED" ? "Upcoming" : v),
};

function FilterGroup({
  label,
  summary,
  defaultOpen = false,
  children,
}: {
  label: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#e2e8f0] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between px-3.5 py-3 text-left text-[13px] font-semibold text-[#1e293b] transition-colors hover:bg-[#f8fafc]"
      >
        <span className="flex min-w-0 items-baseline gap-2">
          {label}
          {summary && !open && (
            <span className="truncate text-[11px] font-medium text-[#0b3b60]">{summary}</span>
          )}
        </span>
        <ChevronRight
          className={`h-3.5 w-3.5 shrink-0 text-[#94a3b8] transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && <div className="px-3.5 pb-3.5">{children}</div>}
    </div>
  );
}

export function FiltersPanel({
  options,
  current,
  total,
  basePath = "/vehicles",
  hideQuickToggles = false,
  onApply,
}: {
  options: FilterOptions;
  current: Record<string, string | string[] | undefined>;
  total?: number;
  basePath?: string;
  hideQuickToggles?: boolean;
  onApply?: () => void;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const g = (k: string) => (typeof current[k] === "string" ? (current[k] as string) : "");
  const [q, setQ] = useState(g("q"));

  function apply(kv: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(kv)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
    onApply?.();
  }

  const sel = (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    apply({ [key]: e.target.value });

  const buyNowOnly = g("saleType") === "BUY_NOW";
  const liveOnly = g("auctionStatus") === "LIVE";

  return (
    <div className="overflow-hidden rounded-none border border-[#cbd5e1] bg-white">
      <div className="flex items-center justify-between border-b-2 border-[#ffb81c] bg-[#0b3b60] px-3.5 py-2.5 text-white">
        <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-xs">
          <Filter className="h-3.5 w-3.5 text-[#ffb81c]" />
          <span>Search Filters</span>
        </div>
        <button
          type="button"
          onClick={() => router.push(basePath)}
          className="text-[11px] text-[#cbd5e1] hover:text-[#ffb81c] flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      {total != null && (
        <p className="border-b border-[#e2e8f0] px-3.5 py-2.5 text-[11.5px] font-semibold text-[#64748b]">
          Found <span className="font-black text-[#0b3b60]">{total}</span> lot{total === 1 ? "" : "s"}
        </p>
      )}

      {/* keyword */}
      <form
        className="border-b border-[#e2e8f0] px-3.5 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Make, model, VIN, lot..."
            className="pl-8 text-xs"
          />
        </div>
      </form>

      {/* accordion groups */}
      <div className="text-xs">
        <FilterGroup label="Make" summary={g("make")} defaultOpen={!!g("make")}>
          <Select value={g("make")} onChange={sel("make")}>
            <option value="">All Makes</option>
            {options.makes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </FilterGroup>

        <FilterGroup
          label="Year"
          summary={[g("yearFrom") || "…", g("yearTo") || "…"].join(" – ")}
          defaultOpen={!!(g("yearFrom") || g("yearTo"))}
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>From</Label>
              <Input
                type="number"
                defaultValue={g("yearFrom")}
                placeholder="2015"
                onBlur={(e) => apply({ yearFrom: e.target.value })}
              />
            </div>
            <div>
              <Label>To</Label>
              <Input
                type="number"
                defaultValue={g("yearTo")}
                placeholder="2024"
                onBlur={(e) => apply({ yearTo: e.target.value })}
              />
            </div>
          </div>
        </FilterGroup>

        <FilterGroup label="Price" summary={g("priceMax") ? `≤ ${Number(g("priceMax")).toLocaleString("en-US")}` : undefined} defaultOpen={!!g("priceMax")}>
          <Label>Max price (€ / $)</Label>
          <Input
            type="number"
            defaultValue={g("priceMax")}
            placeholder="50000"
            onBlur={(e) => apply({ priceMax: e.target.value })}
          />
        </FilterGroup>

        <FilterGroup label="Mileage" summary={g("mileageMax") ? `≤ ${Number(g("mileageMax")).toLocaleString("en-US")}` : undefined} defaultOpen={!!g("mileageMax")}>
          <Label>Max mileage (mi / km)</Label>
          <Input
            type="number"
            defaultValue={g("mileageMax")}
            placeholder="150000"
            onBlur={(e) => apply({ mileageMax: e.target.value })}
          />
        </FilterGroup>

        <FilterGroup label="Fuel type" summary={g("fuelType")} defaultOpen={!!g("fuelType")}>
          <Select value={g("fuelType")} onChange={sel("fuelType")}>
            <option value="">All Fuels</option>
            {options.fuelTypes.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </Select>
        </FilterGroup>

        <FilterGroup label="Transmission" summary={g("transmission")} defaultOpen={!!g("transmission")}>
          <Select value={g("transmission")} onChange={sel("transmission")}>
            <option value="">All Transmissions</option>
            {options.transmissions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </FilterGroup>

        <FilterGroup label="Body type" summary={g("bodyType")} defaultOpen={!!g("bodyType")}>
          <Select value={g("bodyType")} onChange={sel("bodyType")}>
            <option value="">All Body Types</option>
            {options.bodyTypes.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </FilterGroup>

        <FilterGroup
          label="Auction status"
          summary={g("auctionStatus") === "ended" ? "Results" : g("auctionStatus") === "LIVE" ? "Live" : g("auctionStatus") === "SCHEDULED" ? "Upcoming" : undefined}
          defaultOpen={!!g("auctionStatus")}
        >
          <Select value={g("auctionStatus")} onChange={sel("auctionStatus")}>
            <option value="">All Statuses</option>
            <option value="LIVE">Live Now</option>
            <option value="SCHEDULED">Upcoming</option>
            <option value="ended">Results (Ended)</option>
          </Select>
        </FilterGroup>
      </div>

      {/* checkbox toggles */}
      {!hideQuickToggles && (
      <div className="border-t border-[#e2e8f0]">
        <label className="flex cursor-pointer items-center justify-between px-3.5 py-3 text-[13px] font-semibold text-[#1e293b] transition-colors hover:bg-[#f8fafc]">
          Buy Now only
          <input
            type="checkbox"
            checked={buyNowOnly}
            onChange={(e) => apply({ saleType: e.target.checked ? "BUY_NOW" : "" })}
            className="h-4 w-4 cursor-pointer accent-[#0b3b60]"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between border-t border-[#e2e8f0] px-3.5 py-3 text-[13px] font-semibold text-[#1e293b] transition-colors hover:bg-[#f8fafc]">
          Live auctions only
          <input
            type="checkbox"
            checked={liveOnly}
            onChange={(e) => apply({ auctionStatus: e.target.checked ? "LIVE" : "" })}
            className="h-4 w-4 cursor-pointer accent-[#0b3b60]"
          />
        </label>
      </div>
      )}

      <div className="border-t border-[#e2e8f0] p-3">
        <Button
          variant="outline"
          className="w-full text-xs font-bold uppercase"
          type="button"
          onClick={() => router.push(basePath)}
        >
          Clear All Filters
        </Button>
      </div>
    </div>
  );
}

export function CatalogToolbar({
  total,
  current,
  basePath = "/vehicles",
  onOpenFilters,
}: {
  total: number;
  current: Record<string, string | string[] | undefined>;
  basePath?: string;
  onOpenFilters: () => void;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const g = (k: string) => (typeof current[k] === "string" ? (current[k] as string) : "");

  const active = Object.keys(FILTER_LABELS).filter((k) => g(k));
  function remove(k: string) {
    const params = new URLSearchParams(sp.toString());
    params.delete(k);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }
  function sort(v: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("sort", v);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="space-y-2 border border-[#cbd5e1] bg-white p-3 rounded-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold text-[#0b3b60]">
          Total Lots Found: <span className="text-[#051a2e] font-black">{total}</span>
          {active.length > 0 && ` (${active.length} active filter${active.length === 1 ? "" : "s"})`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={onOpenFilters}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters{active.length > 0 && ` (${active.length})`}
          </Button>
          <div className="flex items-center gap-1 text-xs">
            <span className="hidden sm:inline text-[#64748b]">Sort by:</span>
            <Select
              aria-label="Sort by"
              value={g("sort") || "newest"}
              onChange={(e) => sort(e.target.value)}
              className="h-8 w-auto text-xs font-semibold"
            >
              {SORTS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>
      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-[#f1f5f9] pt-2">
          {active.map((k) => (
            <FilterChip key={k} label={FILTER_LABELS[k](g(k))} onRemove={() => remove(k)} />
          ))}
          <button
            onClick={() => router.push(basePath)}
            className="text-[11px] font-bold text-[#0b3b60] hover:underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

export function CatalogLayout({
  options,
  current,
  total,
  basePath = "/vehicles",
  hideQuickToggles = false,
  children,
}: {
  options: FilterOptions;
  current: Record<string, string | string[] | undefined>;
  total: number;
  basePath?: string;
  hideQuickToggles?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-[118px] max-h-[calc(100vh-136px)] overflow-y-auto">
          <FiltersPanel options={options} current={current} total={total} basePath={basePath} hideQuickToggles={hideQuickToggles} />
        </div>
      </aside>
      <div className="min-w-0">
        <div className="sticky top-[118px] z-30 bg-[#eaedf1] pb-4">
          <CatalogToolbar total={total} current={current} basePath={basePath} onOpenFilters={() => setOpen(true)} />
        </div>
        {children}
      </div>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Search Filters"
        footer={
          <Button className="w-full" onClick={() => setOpen(false)}>
            Show {total} lots
          </Button>
        }
      >
        <FiltersPanel options={options} current={current} total={total} basePath={basePath} hideQuickToggles={hideQuickToggles} onApply={() => setOpen(false)} />
      </Drawer>
    </div>
  );
}
