import { z } from "zod";

const opt = z.string().trim().max(200).optional().nullable().transform((v) => v || null);
const optNum = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => (v === "" || v == null ? null : Number(v)))
  .refine((v) => v == null || Number.isFinite(v), "must be a number");
const optBool = z
  .union([z.boolean(), z.string()])
  .optional()
  .nullable()
  .transform((v) => (v == null || v === "" ? null : v === true || v === "true" || v === "on"));

export const vehicleSchema = z.object({
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  trim: opt,
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  vin: z.string().trim().max(32).optional().nullable().transform((v) => v || null),
  vinVisibility: z.enum(["last4", "full", "hidden"]).default("last4"),
  mileage: optNum,
  bodyType: opt,
  fuelType: opt,
  transmission: opt,
  drivetrain: opt,
  engineCapacityCc: optNum,
  enginePowerHp: optNum,
  exteriorColor: opt,
  interiorColor: opt,
  doors: optNum,
  seats: optNum,
  locationCity: opt,
  locationCountry: opt,
  conditionOverall: opt,
  accidentHistory: opt,
  damageType: opt,
  engineCondition: opt,
  transmissionCondition: opt,
  chassisCondition: opt,
  airbagStatus: opt,
  floodDamage: optBool,
  starts: optBool,
  drives: optBool,
  keysAvailable: optBool,
  description: z.string().max(10000).optional().nullable().transform((v) => v || null),
  sellerNotes: z.string().max(10000).optional().nullable().transform((v) => v || null),
  serviceHistory: z.string().max(10000).optional().nullable().transform((v) => v || null),
  registrationInfo: z.string().max(5000).optional().nullable().transform((v) => v || null),
  saleType: z.enum(["BUY_NOW", "AUCTION", "AUCTION_BUY_NOW"]),
  buyNowPrice: optNum.transform((v) => (v == null ? null : Math.round(v * 100))), // major → minor
  buyNowCurrency: z.enum(["USD", "EUR", "GBP"]).optional().nullable(),
});

export const auctionSchema = z.object({
  vehicleId: z.string().min(1),
  currency: z.enum(["USD", "EUR", "GBP"]),
  startingPrice: z.coerce.number().positive().transform((v) => Math.round(v * 100)),
  bidIncrement: z.coerce.number().positive().transform((v) => Math.round(v * 100)),
  startsAt: z.coerce.number().int().positive(),
  endsAt: z.coerce.number().int().positive(),
  extensionWindowSec: optNum,
  extensionDurationSec: optNum,
});
