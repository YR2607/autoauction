"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { FilterChip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import {
  FilterList as SlidersHorizontal,
  Search,
  NavArrowRight,
  Check,
} from "iconoir-react";

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
  priceMin: (v) => `≥ ${Number(v).toLocaleString("en-GB")}`,
  priceMax: (v) => `≤ ${Number(v).toLocaleString("en-GB")}`,
  mileageMax: (v) => `≤ ${Number(v).toLocaleString("en-GB")} km`,
  fuelType: (v) => v,
  transmission: (v) => v,
  bodyType: (v) => v,
  saleType: (v) => (v === "BUY_NOW" ? "Buy Now" : v === "AUCTION" ? "Auction" : v),
  currency: (v) => v,
  auctionStatus: (v) => (v === "LIVE" ? "Live auctions" : v === "SCHEDULED" ? "Upcoming" : v),
};

/** Collapsible filter section — module-level so re-renders don't remount inputs. */
function FilterSection({
  title,
  summary,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  summary?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
      >
        <span className="min-w-0">
          <span className="block text-[13.5px] font-semibold text-ink">
            {title}
          </span>
          {summary && (
            <span className="mt-0.5 block truncate text-xs text-primary">
              {summary}
            </span>
          )}
        </span>
        <NavArrowRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200",
            expanded && "rotate-90",
          )}
          aria-hidden
        />
      </button>
      {expanded && <div className="pb-4">{children}</div>}
    </div>
  );
}

/** Checkbox-style option list — module-level for the same reason. */
function FilterOptList({
  items,
  activeValue,
  onPick,
}: {
  items: (string | [string, string])[];
  activeValue: string;
  onPick: (value: string) => void;
}) {
  return (
    <ul className="scroll-thin -mx-1 max-h-44 overflow-y-auto">
      {items.map((it) => {
        const [v, label] = Array.isArray(it) ? it : [it, it];
        const active = activeValue === v;
        return (
          <li key={v}>
            <button
              type="button"
              onClick={() => onPick(v)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded px-1.5 py-1.5 text-left text-[13px] transition-colors",
                active
                  ? "font-bold text-ink"
                  : "text-graphite/70 hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                  active ? "border-ink bg-ink" : "border-graphite/30",
                )}
              >
                {active && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </span>
              {label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

const SECTION_PARAMS: Record<string, string[]> = {
  make: ["make", "model"],
  fuel: ["fuelType"],
  year: ["yearFrom", "yearTo"],
  transmission: ["transmission"],
  mileage: ["mileageMax"],
  price: ["priceMin", "priceMax", "currency"],
  body: ["bodyType"],
  sale: ["saleType"],
  status: ["auctionStatus"],
};

/** Accordion filter sidebar — mobile.de-style collapsible sections. */
export function FiltersPanel({
  options,
  current,
  total,
  basePath = "/vehicles",
  onApply,
}: {
  options: FilterOptions;
  current: Record<string, string | string[] | undefined>;
  total: number;
  basePath?: string;
  onApply?: () => void;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const g = (k: string) => (typeof current[k] === "string" ? (current[k] as string) : "");

  // Text inputs are drafted locally so typing doesn't navigate; they apply
  // on blur / Enter. Drafts re-sync whenever the applied params change.
  const DRAFT_KEYS = ["q", "model", "yearFrom", "yearTo", "mileageMax", "priceMin", "priceMax"] as const;
  const curKey = DRAFT_KEYS.map((k) => g(k)).join("|");
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(DRAFT_KEYS.map((k) => [k, g(k)])),
  );
  const [preview, setPreview] = useState<number | null>(null);
  useEffect(() => {
    setDraft(Object.fromEntries(DRAFT_KEYS.map((k) => [k, g(k)])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curKey]);

  // Live match preview while drafting — no navigation, just a count.
  useEffect(() => {
    const dirty = DRAFT_KEYS.some((k) => (draft[k] ?? "").trim() !== g(k));
    if (!dirty) {
      setPreview(null);
      return;
    }
    const t = setTimeout(() => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(current)) {
        if (typeof v === "string" && v) qs.set(k, v);
      }
      for (const k of DRAFT_KEYS) {
        const d = (draft[k] ?? "").trim();
        if (d) qs.set(k, d);
        else qs.delete(k);
      }
      qs.delete("page");
      const scope = basePath === "/auctions" ? "auctions" : basePath === "/buy-now" ? "buy-now" : "vehicles";
      qs.set("scope", scope);
      fetch(`/api/vehicles/count?${qs.toString()}`)
        .then((r) => r.json())
        .then((j) => setPreview(typeof j.total === "number" ? j.total : null))
        .catch(() => setPreview(null));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  // Sections with active values start expanded.
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      Object.entries(SECTION_PARAMS).map(([id, params]) => [
        id,
        params.some((p) => g(p)),
      ]),
    ),
  );

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

  const toggle = (id: string) => setOpen((s) => ({ ...s, [id]: !s[id] }));
  const setD = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));
  // Apply every pending draft in a single navigation — never on blur,
  // otherwise clicking the next input closes the drawer / loses focus.
  function applyDrafts() {
    const kv: Record<string, string> = {};
    for (const k of DRAFT_KEYS) {
      const v = (draft[k] ?? "").trim();
      if (v !== g(k)) kv[k] = v;
    }
    if (Object.keys(kv).length) apply(kv);
  }
  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) =>
    e.key === "Enter" && applyDrafts();

  const sectionProps = (id: string) => ({
    expanded: !!open[id],
    onToggle: () => toggle(id),
  });
  const pick = (param: string) => (v: string) =>
    apply({ [param]: g(param) === v ? "" : v });

  const buyNowOnly = g("saleType") === "BUY_NOW";
  const liveOnly = g("auctionStatus") === "LIVE";

  return (
    <div>
      {/* Result count — reference-style header */}
      <p className="border-b border-line pb-3.5 text-center text-[13px] text-muted">
        <b className="text-ink">{total.toLocaleString("en-GB")}</b>{" "}
        vehicle{total === 1 ? "" : "s"} found
      </p>
      {preview !== null && (
        <button
          type="button"
          onClick={applyDrafts}
          aria-live="polite"
          className={cn(
            "block w-full border-b border-line py-2 text-center text-xs font-bold transition-colors hover:bg-bg",
            preview === 0 ? "text-error" : "text-primary",
          )}
        >
          {preview === 0
            ? "No matches — apply anyway"
            : `${preview.toLocaleString("en-GB")} will match — click to apply`}
        </button>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q: (draft.q ?? "").trim() });
        }}
        className="border-b border-line py-3.5"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <Input
            value={draft.q ?? ""}
            onChange={setD("q")}
            placeholder="Make, model, lot…"
            className="h-9 pl-8 text-[13px]"
            aria-label="Search vehicles"
          />
        </div>
      </form>

      <FilterSection {...sectionProps("make")} title="Make" summary={[g("make"), g("model")].filter(Boolean).join(" · ") || undefined}>
        <FilterOptList activeValue={g("make")} onPick={pick("make")} items={options.makes} />
        <Input
          value={draft.model ?? ""}
          onChange={setD("model")}
          placeholder="Model, e.g. M4"
          className="mt-2.5 h-9 text-[13px]"
          onKeyDown={onEnter}
          aria-label="Model"
        />
      </FilterSection>

      <FilterSection {...sectionProps("fuel")} title="Fuel type" summary={g("fuelType") || undefined}>
        <FilterOptList activeValue={g("fuelType")} onPick={pick("fuelType")} items={options.fuelTypes} />
      </FilterSection>

      <FilterSection {...sectionProps("year")}
      title="Year"
        summary={
          g("yearFrom") || g("yearTo")
            ? `${g("yearFrom") || "…"} to ${g("yearTo") || "…"}`
            : undefined
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            value={draft.yearFrom ?? ""}
            onChange={setD("yearFrom")}
            placeholder="From"
            className="h-9 text-[13px]"
            onKeyDown={onEnter}
            aria-label="Year from"
          />
          <Input
            type="number"
            value={draft.yearTo ?? ""}
            onChange={setD("yearTo")}
            placeholder="To"
            className="h-9 text-[13px]"
            onKeyDown={onEnter}
            aria-label="Year to"
          />
        </div>
      </FilterSection>

      <FilterSection {...sectionProps("transmission")} title="Transmission" summary={g("transmission") || undefined}>
        <FilterOptList activeValue={g("transmission")} onPick={pick("transmission")} items={options.transmissions} />
      </FilterSection>

      <FilterSection {...sectionProps("mileage")}
      title="Mileage"
        summary={g("mileageMax") ? `≤ ${Number(g("mileageMax")).toLocaleString("en-GB")} km` : undefined}
      >
        <Input
          type="number"
          value={draft.mileageMax ?? ""}
          onChange={setD("mileageMax")}
          placeholder="Max km"
          className="h-9 text-[13px]"
          onKeyDown={onEnter}
          aria-label="Max mileage"
        />
      </FilterSection>

      <FilterSection {...sectionProps("price")}
      title="Price"
        summary={
          g("priceMin") || g("priceMax")
            ? `${g("priceMin") ? `≥ ${Number(g("priceMin")).toLocaleString("en-GB")}` : "…"} to ${g("priceMax") ? `≤ ${Number(g("priceMax")).toLocaleString("en-GB")}` : "…"} ${g("currency") || ""}`.trim()
            : g("currency") || undefined
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            value={draft.priceMin ?? ""}
            onChange={setD("priceMin")}
            placeholder="Min"
            className="h-9 text-[13px]"
            onKeyDown={onEnter}
            aria-label="Min price (major units)"
          />
          <Input
            type="number"
            value={draft.priceMax ?? ""}
            onChange={setD("priceMax")}
            placeholder="Max"
            className="h-9 text-[13px]"
            onKeyDown={onEnter}
            aria-label="Max price (major units)"
          />
        </div>
        <Select
          value={g("currency")}
          onChange={(e) => apply({ currency: e.target.value })}
          className="mt-2 h-9 text-[13px]"
          aria-label="Currency"
        >
          <option value="">Any currency</option>
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
        </Select>
      </FilterSection>

      <FilterSection {...sectionProps("body")} title="Body type" summary={g("bodyType") || undefined}>
        <FilterOptList activeValue={g("bodyType")} onPick={pick("bodyType")} items={options.bodyTypes} />
      </FilterSection>

      {basePath === "/vehicles" && (
        <FilterSection {...sectionProps("sale")}
      title="Sale type"
          summary={g("saleType") ? FILTER_LABELS.saleType(g("saleType")) : undefined}
        >
          <FilterOptList activeValue={g("saleType")} onPick={pick("saleType")} items={[
              ["AUCTION", "Auction"],
              ["BUY_NOW", "Buy Now"],
              ["AUCTION_BUY_NOW", "Auction + Buy Now"],
            ]}
          />
        </FilterSection>
      )}

      <FilterSection {...sectionProps("status")}
      title="Auction status"
        summary={g("auctionStatus") ? FILTER_LABELS.auctionStatus(g("auctionStatus")) : undefined}
      >
        <FilterOptList activeValue={g("auctionStatus")} onPick={pick("auctionStatus")} items={[
            ["LIVE", "Live now"],
            ["SCHEDULED", "Upcoming"],
          ]}
        />
      </FilterSection>

      {/* Standalone quick checkboxes — reference-style */}
      {basePath === "/vehicles" && (
        <label className="flex cursor-pointer items-center gap-2.5 border-b border-line py-3.5 text-[13.5px] font-semibold text-ink">
          <input
            type="checkbox"
            checked={buyNowOnly}
            onChange={(e) => apply({ saleType: e.target.checked ? "BUY_NOW" : "" })}
            className="h-4 w-4 rounded-[3px] border-graphite/30 accent-ink"
          />
          Buy now only
        </label>
      )}
      <label className="flex cursor-pointer items-center gap-2.5 border-b border-line py-3.5 text-[13.5px] font-semibold text-ink">
        <input
          type="checkbox"
          checked={liveOnly}
          onChange={(e) => apply({ auctionStatus: e.target.checked ? "LIVE" : "" })}
          className="h-4 w-4 rounded-[3px] border-graphite/30 accent-ink"
        />
        Live auctions only
      </label>

      <Button
        variant="outline"
        size="sm"
        className="mt-4 w-full"
        type="button"
        onClick={() => router.push(basePath)}
      >
        Clear all filters
      </Button>
    </div>
  );
}

/**
 * Catalog chrome: active-filter chips, sort control and the
 * mobile filter drawer trigger.
 */
export function CatalogToolbar({
  total,
  current,
  basePath = "/vehicles",
  filters = "sidebar",
  onOpenFilters,
}: {
  total: number;
  current: Record<string, string | string[] | undefined>;
  basePath?: string;
  filters?: "sidebar" | "drawer";
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
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn("text-sm font-semibold text-muted", filters === "sidebar" && "lg:hidden")}>
          <b className="text-graphite">{total}</b> vehicle{total === 1 ? "" : "s"}
          {active.length > 0 && ` · ${active.length} filter${active.length === 1 ? "" : "s"}`}
        </p>
        <div className="flex items-center gap-2 lg:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className={cn(filters === "sidebar" && "lg:hidden")}
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
            onClick={() => router.push(basePath)}
            className="text-xs font-bold text-graphite/60 underline underline-offset-2 hover:text-ink"
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
  basePath = "/vehicles",
  filters = "sidebar",
  children,
}: {
  options: FilterOptions;
  current: Record<string, string | string[] | undefined>;
  total: number;
  basePath?: string;
  /** "sidebar" — desktop aside + mobile drawer; "drawer" — filter button + drawer everywhere. */
  filters?: "sidebar" | "drawer";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(filters === "sidebar" && "grid gap-8 lg:grid-cols-[264px_1fr]")}>
      {filters === "sidebar" && (
        <aside className="hidden h-fit rounded-lg border border-line bg-white px-5 pt-4 pb-5 lg:sticky lg:top-20 lg:block">
          <FiltersPanel options={options} current={current} total={total} basePath={basePath} />
        </aside>
      )}
      <div className="min-w-0">
        <CatalogToolbar total={total} current={current} basePath={basePath} filters={filters} onOpenFilters={() => setOpen(true)} />
        {children}
      </div>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        desktop={filters === "drawer"}
        footer={
          <Button className="w-full" onClick={() => setOpen(false)}>
            Show {total} results
          </Button>
        }
      >
        <FiltersPanel options={options} current={current} total={total} basePath={basePath} />
      </Drawer>
    </div>
  );
}
