"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { FilterChip } from "@/components/ui/chip";
import { SlidersHorizontal, Search } from "lucide-react";

export type FilterOptions = {
  makes: string[];
  fuelTypes: string[];
  transmissions: string[];
  bodyTypes: string[];
};

const SORTS = [
  ["newest", "Newest first"],
  ["price_asc", "Lowest price"],
  ["price_desc", "Highest price"],
  ["ending_soon", "Ending soon"],
  ["highest_bid", "Highest bid"],
] as const;

const FILTER_LABELS: Record<string, (v: string) => string> = {
  q: (v) => `“${v}”`,
  make: (v) => v,
  model: (v) => v,
  yearFrom: (v) => `Year ≥ ${v}`,
  yearTo: (v) => `Year ≤ ${v}`,
  priceMax: (v) => `≤ ${Number(v).toLocaleString("en-GB")}`,
  mileageMax: (v) => `≤ ${Number(v).toLocaleString("en-GB")} km`,
  fuelType: (v) => v,
  transmission: (v) => v,
  bodyType: (v) => v,
  saleType: (v) => (v === "BUY_NOW" ? "Buy Now" : v === "AUCTION" ? "Auction" : v),
  auctionStatus: (v) => (v === "LIVE" ? "Live auctions" : v === "SCHEDULED" ? "Upcoming" : v),
};

/** Fields rendered inside the filters panel (desktop aside + mobile drawer). */
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
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="mb-5"
      >
        <Label>Search</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Make, model, lot…"
            className="pl-9"
          />
        </div>
      </form>

      <div className="space-y-4">
        <div>
          <Label>Sale type</Label>
          <Select value={g("saleType")} onChange={sel("saleType")}>
            <option value="">All</option>
            <option value="AUCTION">Auction</option>
            <option value="BUY_NOW">Buy Now</option>
            <option value="AUCTION_BUY_NOW">Auction + Buy Now</option>
          </Select>
        </div>
        <div>
          <Label>Auction status</Label>
          <Select value={g("auctionStatus")} onChange={sel("auctionStatus")}>
            <option value="">All</option>
            <option value="LIVE">Live now</option>
            <option value="SCHEDULED">Upcoming</option>
          </Select>
        </div>
        <div>
          <Label>Make</Label>
          <Select value={g("make")} onChange={sel("make")}>
            <option value="">All makes</option>
            {options.makes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Year from</Label>
            <Input
              type="number"
              defaultValue={g("yearFrom")}
              placeholder="2018"
              onBlur={(e) => apply({ yearFrom: e.target.value })}
            />
          </div>
          <div>
            <Label>Year to</Label>
            <Input
              type="number"
              defaultValue={g("yearTo")}
              placeholder="2024"
              onBlur={(e) => apply({ yearTo: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Max price (major units)</Label>
          <Input
            type="number"
            defaultValue={g("priceMax")}
            placeholder="50000"
            onBlur={(e) => apply({ priceMax: e.target.value })}
          />
        </div>
        <div>
          <Label>Max mileage (km)</Label>
          <Input
            type="number"
            defaultValue={g("mileageMax")}
            placeholder="60000"
            onBlur={(e) => apply({ mileageMax: e.target.value })}
          />
        </div>
        <div>
          <Label>Fuel</Label>
          <Select value={g("fuelType")} onChange={sel("fuelType")}>
            <option value="">All</option>
            {options.fuelTypes.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Transmission</Label>
          <Select value={g("transmission")} onChange={sel("transmission")}>
            <option value="">All</option>
            {options.transmissions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Body type</Label>
          <Select value={g("bodyType")} onChange={sel("bodyType")}>
            <option value="">All</option>
            {options.bodyTypes.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </div>
        <Button
          variant="outline"
          className="w-full"
          type="button"
          onClick={() => router.push("/vehicles")}
        >
          Clear all filters
        </Button>
      </div>
    </div>
  );
}

/**
 * Catalog chrome: result count, active-filter chips, sort control and the
 * mobile filter drawer trigger. `panel` is the <FiltersPanel/> instance —
 * rendered once for the aside and once for the drawer by the page.
 */
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
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted">
          <b className="text-graphite">{total}</b> vehicle{total === 1 ? "" : "s"}
          {active.length > 0 && ` · ${active.length} filter${active.length === 1 ? "" : "s"}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={onOpenFilters}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters{active.length > 0 && ` (${active.length})`}
          </Button>
          <Select
            aria-label="Sort by"
            value={g("sort") || "newest"}
            onChange={(e) => sort(e.target.value)}
            className="h-9 w-auto text-[13px]"
          >
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </div>
      </div>
      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {active.map((k) => (
            <FilterChip key={k} label={FILTER_LABELS[k](g(k))} onRemove={() => remove(k)} />
          ))}
          <button
            onClick={() => router.push("/vehicles")}
            className="text-xs font-bold text-primary hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

/** Client wrapper owning the drawer state — used by the page around the aside. */
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
    <div className="grid gap-8 lg:grid-cols-[264px_1fr]">
      <aside className="hidden h-fit rounded-[14px] border border-line bg-white p-5 shadow-xs lg:sticky lg:top-20 lg:block">
        <FiltersPanel options={options} current={current} />
      </aside>
      <div className="min-w-0">
        <CatalogToolbar total={total} current={current} onOpenFilters={() => setOpen(true)} />
        {children}
      </div>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        footer={
          <Button className="w-full" onClick={() => setOpen(false)}>
            Show {total} results
          </Button>
        }
      >
        <FiltersPanel options={options} current={current} onApply={() => setOpen(false)} />
      </Drawer>
    </div>
  );
}
