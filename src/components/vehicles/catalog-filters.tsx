"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { FilterChip } from "@/components/ui/chip";
import { SlidersHorizontal, Search, RotateCcw, Filter } from "lucide-react";

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

export function FiltersPanel({
  options,
  current,
  onApply,
}: {
  options: FilterOptions;
  current: Record<string, string | string[] | undefined>;
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
    router.push(`/vehicles?${params.toString()}`);
    onApply?.();
  }

  const sel = (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    apply({ [key]: e.target.value });

  return (
    <div className="overflow-hidden rounded-none border border-[#cbd5e1] bg-white">
      <div className="flex items-center justify-between border-b-2 border-[#ffb81c] bg-[#0b3b60] px-3.5 py-2.5 text-white">
        <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-xs">
          <Filter className="h-3.5 w-3.5 text-[#ffb81c]" />
          <span>Search Filters</span>
        </div>
        <button
          type="button"
          onClick={() => router.push("/vehicles")}
          className="text-[11px] text-[#cbd5e1] hover:text-[#ffb81c] flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      <div className="p-3.5 space-y-4 text-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply({ q });
          }}
        >
          <Label>Keyword or Lot Number</Label>
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

        <div className="border-t border-[#e2e8f0] pt-3">
          <Label>Sale or Auction Type</Label>
          <Select value={g("saleType")} onChange={sel("saleType")}>
            <option value="">All Sale Types</option>
            <option value="AUCTION">Live Online Auction</option>
            <option value="BUY_NOW">Buy Now (Fixed Price)</option>
            <option value="AUCTION_BUY_NOW">Auction + Buy Now</option>
          </Select>
        </div>

        <div>
          <Label>Auction Status</Label>
          <Select value={g("auctionStatus")} onChange={sel("auctionStatus")}>
            <option value="">All Statuses</option>
            <option value="LIVE">Live Now</option>
            <option value="SCHEDULED">Upcoming</option>
          </Select>
        </div>

        <div>
          <Label>Vehicle Make</Label>
          <Select value={g("make")} onChange={sel("make")}>
            <option value="">All Makes</option>
            {options.makes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Year From</Label>
            <Input
              type="number"
              defaultValue={g("yearFrom")}
              placeholder="2015"
              onBlur={(e) => apply({ yearFrom: e.target.value })}
            />
          </div>
          <div>
            <Label>Year To</Label>
            <Input
              type="number"
              defaultValue={g("yearTo")}
              placeholder="2024"
              onBlur={(e) => apply({ yearTo: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label>Max Price (€ / $)</Label>
          <Input
            type="number"
            defaultValue={g("priceMax")}
            placeholder="50000"
            onBlur={(e) => apply({ priceMax: e.target.value })}
          />
        </div>

        <div>
          <Label>Max Mileage (mi / km)</Label>
          <Input
            type="number"
            defaultValue={g("mileageMax")}
            placeholder="150000"
            onBlur={(e) => apply({ mileageMax: e.target.value })}
          />
        </div>

        <div>
          <Label>Fuel Type</Label>
          <Select value={g("fuelType")} onChange={sel("fuelType")}>
            <option value="">All Fuels</option>
            {options.fuelTypes.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Transmission</Label>
          <Select value={g("transmission")} onChange={sel("transmission")}>
            <option value="">All Transmissions</option>
            {options.transmissions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Body Type</Label>
          <Select value={g("bodyType")} onChange={sel("bodyType")}>
            <option value="">All Body Types</option>
            {options.bodyTypes.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </div>

        <Button
          variant="outline"
          className="w-full text-xs font-bold uppercase"
          type="button"
          onClick={() => router.push("/vehicles")}
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
  onOpenFilters,
}: {
  total: number;
  current: Record<string, string | string[] | undefined>;
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
    router.push(`/vehicles?${params.toString()}`);
  }
  function sort(v: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("sort", v);
    params.delete("page");
    router.push(`/vehicles?${params.toString()}`);
  }

  return (
    <div className="mb-4 space-y-2 border border-[#cbd5e1] bg-white p-3 rounded-none">
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
            onClick={() => router.push("/vehicles")}
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
  children,
}: {
  options: FilterOptions;
  current: Record<string, string | string[] | undefined>;
  total: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
      <aside className="hidden h-fit lg:block">
        <FiltersPanel options={options} current={current} />
      </aside>
      <div className="min-w-0">
        <CatalogToolbar total={total} current={current} onOpenFilters={() => setOpen(true)} />
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
        <FiltersPanel options={options} current={current} onApply={() => setOpen(false)} />
      </Drawer>
    </div>
  );
}
