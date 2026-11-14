"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CatalogFilters({
  options,
  current,
}: {
  options: { makes: string[]; fuelTypes: string[]; transmissions: string[]; bodyTypes: string[] };
  current: Record<string, string | string[] | undefined>;
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
  }

  const sel = (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    apply({ [key]: e.target.value });

  return (
    <aside className="h-fit rounded-[14px] border border-line bg-white p-5 lg:sticky lg:top-20">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="mb-5"
      >
        <Label>Search</Label>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Make, model, lot…"
        />
      </form>

      <div className="space-y-4">
        <div>
          <Label>Sale type</Label>
          <Select value={g("saleType")} onChange={sel("saleType")}>
            <option value="">All</option>
            <option value="AUCTION">Auction</option>
            <option value="BUY_NOW">Buy Now</option>
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
        <div>
          <Label>Sort by</Label>
          <Select value={g("sort")} onChange={sel("sort")}>
            <option value="newest">Newest first</option>
            <option value="price_asc">Lowest price</option>
            <option value="price_desc">Highest price</option>
            <option value="ending_soon">Ending soon</option>
            <option value="highest_bid">Highest current bid</option>
          </Select>
        </div>
        <Button
          variant="outline"
          className="w-full"
          type="button"
          onClick={() => router.push("/vehicles")}
        >
          Reset filters
        </Button>
      </div>
    </aside>
  );
}
