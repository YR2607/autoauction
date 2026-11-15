import { describe, it, expect, beforeEach } from "vitest";
import { resetDb, makeUser, makeVehicle, makeAuction } from "./helpers";

beforeEach(resetDb);

const queries = () => import("@/features/vehicles/queries");
const availability = () => import("@/features/vehicles/availability");

const buyNowVehicle = (opts: Parameters<typeof makeVehicle>[0] = {}) =>
  makeVehicle({
    saleType: "AUCTION_BUY_NOW",
    buyNowPrice: 50000_00,
    buyNowCurrency: "EUR",
    ...opts,
  });

describe("buyNowAvailable predicate (mirrors engine rules)", () => {
  it("allows a plain PUBLISHED buy-now vehicle without auction", async () => {
    const { buyNowAvailable } = await availability();
    const v = {
      status: "PUBLISHED",
      saleType: "BUY_NOW",
      buyNowPrice: 100_00,
      buyNowCurrency: "EUR",
    };
    expect(buyNowAvailable(v, null)).toBe(true);
  });

  it("rejects when currentBid meets or exceeds the fixed price", async () => {
    const { buyNowAvailable } = await availability();
    const v = {
      status: "PUBLISHED",
      saleType: "AUCTION_BUY_NOW",
      buyNowPrice: 100_00,
      buyNowCurrency: "EUR",
    };
    const a = { status: "LIVE", currency: "EUR", currentBid: 100_00 };
    expect(buyNowAvailable(v, a)).toBe(false);
    expect(buyNowAvailable(v, { ...a, currentBid: 99_00 })).toBe(true);
  });

  it("rejects on auction currency mismatch", async () => {
    const { buyNowAvailable } = await availability();
    const v = {
      status: "PUBLISHED",
      saleType: "AUCTION_BUY_NOW",
      buyNowPrice: 100_00,
      buyNowCurrency: "EUR",
    };
    expect(
      buyNowAvailable(v, { status: "LIVE", currency: "USD", currentBid: null }),
    ).toBe(false);
  });

  it("respects the auction state allowlist", async () => {
    const { buyNowAvailable } = await availability();
    const v = {
      status: "PUBLISHED",
      saleType: "AUCTION_BUY_NOW",
      buyNowPrice: 100_00,
      buyNowCurrency: "EUR",
    };
    const a = (status: string) => ({ status, currency: "EUR", currentBid: null });
    for (const s of ["DRAFT", "SCHEDULED", "LIVE", "UNSOLD", "CANCELLED"])
      expect(buyNowAvailable(v, a(s)), s).toBe(true);
    for (const s of ["ENDED", "AWAITING_ADMIN_APPROVAL", "APPROVED", "REJECTED", "SOLD"])
      expect(buyNowAvailable(v, a(s)), s).toBe(false);
  });

  it("rejects non-PUBLISHED vehicles and missing price/currency", async () => {
    const { buyNowAvailable } = await availability();
    const base = {
      status: "PUBLISHED",
      saleType: "BUY_NOW",
      buyNowPrice: 100_00,
      buyNowCurrency: "EUR",
    };
    expect(buyNowAvailable({ ...base, status: "RESERVED" }, null)).toBe(false);
    expect(buyNowAvailable({ ...base, buyNowPrice: null }, null)).toBe(false);
    expect(buyNowAvailable({ ...base, buyNowCurrency: null }, null)).toBe(false);
    expect(buyNowAvailable({ ...base, saleType: "AUCTION" }, null)).toBe(false);
  });
});

describe("buyNowCards / catalog Buy Now filter", () => {
  it("excludes vehicles whose auction bid already reached the fixed price", async () => {
    const { buyNowCards, listVehicles } = await queries();
    const v1 = await buyNowVehicle(); // eligible
    const v2 = await buyNowVehicle();
    await makeAuction(v2, { status: "LIVE", currency: "EUR", currentBid: 50000_00 });

    const ids = buyNowCards().map((c) => c.id);
    expect(ids).toContain(v1);
    expect(ids).not.toContain(v2);

    const cat = listVehicles({ saleType: "BUY_NOW" });
    expect(cat.items.map((c) => c.id)).toContain(v1);
    expect(cat.items.map((c) => c.id)).not.toContain(v2);
  });

  it("excludes currency mismatches and non-purchasable auction states", async () => {
    const { buyNowCards } = await queries();
    const usd = await buyNowVehicle();
    await makeAuction(usd, { status: "SCHEDULED", currency: "USD" });
    const ended = await buyNowVehicle();
    await makeAuction(ended, { status: "ENDED", currency: "EUR" });
    const ok = await buyNowVehicle();
    await makeAuction(ok, { status: "UNSOLD", currency: "EUR", currentBid: 100_00 });

    const ids = buyNowCards().map((c) => c.id);
    expect(ids).not.toContain(usd);
    expect(ids).not.toContain(ended);
    expect(ids).toContain(ok);
  });

  it("excludes vehicles with a null Buy Now currency (JS/SQL parity)", async () => {
    const { buyNowCards, listVehicles } = await queries();
    const v = await buyNowVehicle({ buyNowCurrency: null }); // price set, currency null
    expect(buyNowCards().map((c) => c.id)).not.toContain(v);
    expect(listVehicles({ saleType: "BUY_NOW" }).items.map((c) => c.id)).not.toContain(v);
    // …and the auction-joined path (eligibility sits inside the OR branch)
    const v2 = await buyNowVehicle({ buyNowCurrency: null });
    await makeAuction(v2, { status: "DRAFT", currency: "EUR" });
    expect(buyNowCards().map((c) => c.id)).not.toContain(v2);
  });

  it("cards expose a consistent buyNowAvailable flag", async () => {
    const { listVehicles } = await queries();
    const v = await buyNowVehicle();
    await makeAuction(v, { status: "LIVE", currency: "EUR", currentBid: 60000_00 });
    const card = listVehicles({}).items.find((c) => c.id === v)!;
    expect(card.buyNowAvailable).toBe(false);
  });
});

describe("effective price semantics (sorting/filtering)", () => {
  it("priceMax filters by the displayed price", async () => {
    const { listVehicles } = await queries();
    // buy-now 40k with a live bid of 30k → display price = live bid 30k
    const v = await buyNowVehicle({ buyNowPrice: 40000_00 });
    await makeAuction(v, { status: "LIVE", currency: "EUR", currentBid: 30000_00 });

    const under35 = listVehicles({ priceMax: 35000_00 }).items.map((c) => c.id);
    const under25 = listVehicles({ priceMax: 25000_00 }).items.map((c) => c.id);
    expect(under35).toContain(v);
    expect(under25).not.toContain(v);
  });

  it("price_asc orders by displayed price across sale types", async () => {
    const { listVehicles } = await queries();
    const auctionOnly = await makeVehicle({ saleType: "AUCTION" });
    await makeAuction(auctionOnly, { status: "LIVE", currency: "EUR", currentBid: 20000_00 });
    const buyNowLow = await buyNowVehicle({ buyNowPrice: 10000_00 });

    const items = listVehicles({ sort: "price_asc" }).items;
    const iA = items.findIndex((c) => c.id === buyNowLow);
    const iB = items.findIndex((c) => c.id === auctionOnly);
    expect(iA).toBeGreaterThanOrEqual(0);
    expect(iA).toBeLessThan(iB);
  });

  it("currency filter matches the display currency", async () => {
    const { listVehicles } = await queries();
    const eur = await buyNowVehicle({ buyNowCurrency: "EUR" });
    const usd = await buyNowVehicle({ buyNowCurrency: "USD" });
    const ids = listVehicles({ currency: "USD" }).items.map((c) => c.id);
    expect(ids).toContain(usd);
    expect(ids).not.toContain(eur);
  });
});

describe("engine stays authoritative", () => {
  it("buyNow() still rejects an over-bid purchase the catalog hid", async () => {
    const { buyNow } = await import("@/features/auctions/engine");
    const buyer = await makeUser();
    const v = await buyNowVehicle();
    await makeAuction(v, { status: "LIVE", currency: "EUR", currentBid: 55000_00 });
    expect(() => buyNow({ vehicleId: v, userId: buyer })).toThrow(/Buy Now/i);
  });
});
