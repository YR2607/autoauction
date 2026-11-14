// Development seed data — clearly marked as SAMPLE data.
// Run: pnpm db:seed  (after pnpm db:migrate)
import { randomUUID } from "node:crypto";
import { hashPassword } from "../auth/password";
import { db, schema, sqlite } from "./index";
import { DEFAULT_SETTINGS } from "../../config/defaults";
import { eq } from "drizzle-orm";

const uuid = () => randomUUID();
const now = () => Date.now();
const H = 3600_000;
const D = 24 * H;

function upsertSettings() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    db.insert(schema.platformSettings)
      .values({ key, value: JSON.stringify(value) })
      .onConflictDoNothing()
      .run();
  }
}

function user(email: string, password: string, role: "buyer" | "admin", first = "", last = "") {
  const id = uuid();
  db.insert(schema.users)
    .values({ id, email, passwordHash: hashPassword(password), role, createdAt: now(), updatedAt: now() })
    .onConflictDoNothing()
    .run();
  db.insert(schema.userProfiles)
    .values({ userId: id, firstName: first, lastName: last })
    .onConflictDoNothing()
    .run();
  return id;
}

const VEHICLES: Array<{
  make: string; model: string; trim?: string; year: number; mileage: number;
  body: string; fuel: string; trans: string; hp: number; cc: number;
  color: string; city: string; country: string;
  sale: "BUY_NOW" | "AUCTION" | "AUCTION_BUY_NOW";
  buyNow?: [number, "EUR" | "USD" | "GBP"];
  auction?: { start: number; incr: number; cur: "EUR" | "USD" | "GBP"; startsInH: number; durH: number };
  condition: string; desc: string;
}> = [
  { make: "BMW", model: "530d", trim: "M Sport", year: 2022, mileage: 41200, body: "Sedan", fuel: "Diesel", trans: "Automatic", hp: 286, cc: 2993, color: "Black Sapphire", city: "Munich", country: "Germany", sale: "AUCTION_BUY_NOW", buyNow: [3850000, "EUR"], auction: { start: 2400000, incr: 25000, cur: "EUR", startsInH: -30, durH: 48 }, condition: "Excellent", desc: "One-owner 530d M Sport with full BMW service history. M Sport package, adaptive LED, Harman Kardon, heated seats." },
  { make: "Mercedes-Benz", model: "E 220 d", trim: "AMG Line", year: 2021, mileage: 58400, body: "Sedan", fuel: "Diesel", trans: "Automatic", hp: 194, cc: 1993, color: "Obsidian Black", city: "Berlin", country: "Germany", sale: "AUCTION", auction: { start: 1950000, incr: 25000, cur: "EUR", startsInH: -20, durH: 50 }, condition: "Very good", desc: "AMG Line with widescreen cockpit, Burmester audio and driver assistance package." },
  { make: "Audi", model: "A6 Avant", trim: "45 TFSI S line", year: 2023, mileage: 22800, body: "Estate", fuel: "Petrol", trans: "Automatic", hp: 265, cc: 1984, color: "Daytona Grey", city: "Vienna", country: "Austria", sale: "AUCTION", auction: { start: 3200000, incr: 25000, cur: "EUR", startsInH: -10, durH: 60 }, condition: "Excellent", desc: "S line Avant with matrix LED, virtual cockpit and panoramic roof. Dealer maintained." },
  { make: "Porsche", model: "911 Carrera", trim: "992", year: 2021, mileage: 18900, body: "Coupe", fuel: "Petrol", trans: "Automatic", hp: 385, cc: 2981, color: "GT Silver", city: "Stuttgart", country: "Germany", sale: "AUCTION_BUY_NOW", buyNow: [11900000, "EUR"], auction: { start: 9500000, incr: 50000, cur: "EUR", startsInH: -6, durH: 90 }, condition: "Excellent", desc: "992 Carrera PDK in GT Silver. Sport Chrono, PASM, 20/21-inch Carrera Classic wheels." },
  { make: "Tesla", model: "Model 3", trim: "Long Range", year: 2023, mileage: 15400, body: "Sedan", fuel: "Electric", trans: "Automatic", hp: 498, cc: 0, color: "Pearl White", city: "Amsterdam", country: "Netherlands", sale: "BUY_NOW", buyNow: [3190000, "EUR"], condition: "Excellent", desc: "Long Range AWD, Autopilot, full self-driving capable hardware. Battery health 96%." },
  { make: "Range Rover", model: "Sport", trim: "HSE Dynamic", year: 2022, mileage: 36700, body: "SUV", fuel: "Diesel", trans: "Automatic", hp: 300, cc: 2997, color: "Santorini Black", city: "London", country: "United Kingdom", sale: "AUCTION", auction: { start: 5200000, incr: 50000, cur: "GBP", startsInH: 8, durH: 72 }, condition: "Very good", desc: "HSE Dynamic with air suspension, Meridian sound and panoramic roof." },
  { make: "Volkswagen", model: "Golf", trim: "GTI", year: 2022, mileage: 28900, body: "Hatchback", fuel: "Petrol", trans: "Manual", hp: 245, cc: 1984, color: "Pure White", city: "Wolfsburg", country: "Germany", sale: "BUY_NOW", buyNow: [2450000, "EUR"], condition: "Very good", desc: "Mk8 GTI manual — increasingly rare. IQ.Light, digital cockpit, heated seats." },
  { make: "Toyota", model: "Land Cruiser", trim: "300 GR Sport", year: 2023, mileage: 12300, body: "SUV", fuel: "Diesel", trans: "Automatic", hp: 304, cc: 3346, color: "Precious White", city: "Dubai", country: "UAE", sale: "AUCTION", auction: { start: 6800000, incr: 50000, cur: "USD", startsInH: -2, durH: 96 }, condition: "Excellent", desc: "LC300 GR Sport, twin-turbo V6 diesel. KDSS, crawl control, rear entertainment." },
  { make: "Ford", model: "Mustang", trim: "GT 5.0", year: 2021, mileage: 24600, body: "Coupe", fuel: "Petrol", trans: "Manual", hp: 460, cc: 5038, color: "Race Red", city: "Dallas", country: "USA", sale: "AUCTION", auction: { start: 2800000, incr: 25000, cur: "USD", startsInH: -40, durH: 65 }, condition: "Very good", desc: "5.0 V8 GT with 6-speed manual, active exhaust and Recaro seats." },
  { make: "Volvo", model: "XC60", trim: "B5 Inscription", year: 2022, mileage: 33100, body: "SUV", fuel: "Hybrid", trans: "Automatic", hp: 250, cc: 1969, color: "Onyx Black", city: "Stockholm", country: "Sweden", sale: "BUY_NOW", buyNow: [3890000, "EUR"], condition: "Excellent", desc: "Mild-hybrid B5 Inscription. Pilot Assist, Bowers & Wilkins, ventilated seats." },
  { make: "Lamborghini", model: "Huracán", trim: "EVO", year: 2021, mileage: 9800, body: "Coupe", fuel: "Petrol", trans: "Automatic", hp: 640, cc: 5204, color: "Verde Mantis", city: "Milan", country: "Italy", sale: "AUCTION", auction: { start: 18500000, incr: 100000, cur: "EUR", startsInH: 20, durH: 120 }, condition: "Excellent", desc: "Huracán EVO in Verde Mantis. Lifting system, magneto suspension, full PPF." },
  { make: "BMW", model: "M4", trim: "Competition", year: 2023, mileage: 14200, body: "Coupe", fuel: "Petrol", trans: "Automatic", hp: 510, cc: 2993, color: "São Paulo Yellow", city: "Munich", country: "Germany", sale: "AUCTION_BUY_NOW", buyNow: [7900000, "EUR"], auction: { start: 6200000, incr: 50000, cur: "EUR", startsInH: -48, durH: 55 }, condition: "Excellent", desc: "G82 M4 Competition, carbon bucket seats, laser light, head-up display." },
];

function seed() {
  console.log("Seeding…");
  upsertSettings();

  const adminId = user("admin@autoauction.dev", "admin12345", "admin", "Admin", "User");
  const buyer1 = user("buyer@autoauction.dev", "buyer12345", "buyer", "Alex", "Carter");
  const buyer2 = user("buyer2@autoauction.dev", "buyer12345", "buyer", "Mia", "Novak");
  user("buyer3@autoauction.dev", "buyer12345", "buyer", "Sam", "Ortiz");

  VEHICLES.forEach((v, i) => {
    const id = uuid();
    const slug = `${v.make}-${v.model}-${v.year}-${i + 1}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    db.insert(schema.vehicles)
      .values({
        id,
        slug,
        lotNumber: `AA-${1000 + i + 1}`,
        make: v.make,
        model: v.model,
        trim: v.trim ?? null,
        year: v.year,
        vin: `WBA${String(10 + i)}TEST${String(100000 + i * 7)}`,
        mileage: v.mileage,
        bodyType: v.body,
        fuelType: v.fuel,
        transmission: v.trans,
        drivetrain: v.body === "SUV" ? "AWD" : "RWD",
        engineCapacityCc: v.cc || null,
        enginePowerHp: v.hp,
        exteriorColor: v.color,
        interiorColor: "Black",
        doors: v.body === "Coupe" ? 2 : 4,
        seats: v.body === "Coupe" ? 4 : 5,
        locationCity: v.city,
        locationCountry: v.country,
        conditionOverall: v.condition,
        accidentHistory: "None reported",
        engineCondition: "Excellent",
        transmissionCondition: "Excellent",
        chassisCondition: "Good",
        airbagStatus: "Intact",
        floodDamage: false,
        starts: true,
        drives: true,
        keysAvailable: true,
        description: v.desc + " [SAMPLE LISTING]",
        serviceHistory: "Documented service history available.",
        saleType: v.sale,
        buyNowPrice: v.buyNow?.[0] ?? null,
        buyNowCurrency: v.buyNow?.[1] ?? null,
        status: "PUBLISHED",
        createdById: adminId,
        createdAt: now() - (VEHICLES.length - i) * H,
        updatedAt: now(),
      })
      .run();

    // 3 images per vehicle
    for (let k = 0; k < 3; k++) {
      const imgIdx = ((i * 3 + k) % 36) + 1;
      db.insert(schema.vehicleImages)
        .values({
          id: uuid(),
          vehicleId: id,
          url: `/seed-images/car-${String(imgIdx).padStart(2, "0")}.jpg`,
          sortOrder: k,
          isCover: k === 0,
          createdAt: now(),
        })
        .run();
    }

    if (v.auction) {
      const startsAt = now() + v.auction.startsInH * H;
      const endsAt = startsAt + v.auction.durH * H;
      const status = startsAt <= now() ? "LIVE" : "SCHEDULED";
      db.insert(schema.auctions)
        .values({
          id: uuid(),
          vehicleId: id,
          status,
          currency: v.auction.cur,
          startingPrice: v.auction.start,
          bidIncrement: v.auction.incr,
          startsAt,
          endsAt,
          createdAt: now(),
          updatedAt: now(),
        })
        .run();
    }
  });

  // a couple of accepted bids on the BMW so the homepage isn't static
  const bmw = db.select().from(schema.vehicles).where(eq(schema.vehicles.slug, "bmw-530d-2022-1")).get();
  const bmwAuction = bmw
    ? db.select().from(schema.auctions).where(eq(schema.auctions.vehicleId, bmw.id)).get()
    : null;
  if (bmwAuction && bmwAuction.status === "LIVE") {
    const amounts = [bmwAuction.startingPrice, bmwAuction.startingPrice + bmwAuction.bidIncrement];
    const users = [buyer1, buyer2];
    amounts.forEach((amount, k) => {
      db.insert(schema.bids)
        .values({
          id: uuid(),
          auctionId: bmwAuction.id,
          vehicleId: bmwAuction.vehicleId,
          userId: users[k],
          amount,
          status: "ACCEPTED",
          idempotencyKey: uuid(),
          createdAt: now() - (amounts.length - k) * 600_000,
        })
        .run();
    });
    db.update(schema.auctions)
      .set({
        currentBid: amounts[amounts.length - 1],
        highestBidderId: users[1],
        bidCount: amounts.length,
        version: amounts.length,
      })
      .where(eq(schema.auctions.id, bmwAuction.id))
      .run();
  }

  console.log("Seed complete. Logins: admin@autoauction.dev / admin12345 · buyer@autoauction.dev / buyer12345");
  sqlite.close();
}

seed();
