import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ---------- users / auth ----------

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["buyer", "admin"] })
      .notNull()
      .default("buyer"),
    status: text("status", { enum: ["active", "suspended"] })
      .notNull()
      .default("active"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const userProfiles = sqliteTable("user_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  addressLine: text("address_line"),
  city: text("city"),
  country: text("country"),
  avatarUrl: text("avatar_url"),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(), // sha256 hex of the bearer token
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const passwordResetTokens = sqliteTable(
  "password_reset_tokens",
  {
    id: text("id").primaryKey(), // sha256 hex of the emailed token
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at").notNull(),
    usedAt: integer("used_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("pwd_reset_user_idx").on(t.userId)],
);

// ---------- vehicles ----------

export const vehicleStatus = [
  "DRAFT",
  "PUBLISHED",
  "RESERVED",
  "SOLD",
  "ARCHIVED",
] as const;
export const saleTypes = ["BUY_NOW", "AUCTION", "AUCTION_BUY_NOW"] as const;
export const currencies = ["USD", "EUR", "GBP"] as const;

export const vehicles = sqliteTable(
  "vehicles",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    lotNumber: text("lot_number").notNull(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    trim: text("trim"),
    year: integer("year").notNull(),
    vin: text("vin"),
    vinVisibility: text("vin_visibility", {
      enum: ["last4", "full", "hidden"],
    })
      .notNull()
      .default("last4"),
    mileage: integer("mileage"),
    bodyType: text("body_type"),
    fuelType: text("fuel_type"),
    transmission: text("transmission"),
    drivetrain: text("drivetrain"),
    engineCapacityCc: integer("engine_capacity_cc"),
    enginePowerHp: integer("engine_power_hp"),
    exteriorColor: text("exterior_color"),
    interiorColor: text("interior_color"),
    doors: integer("doors"),
    seats: integer("seats"),
    locationCountry: text("location_country"),
    locationCity: text("location_city"),
    conditionOverall: text("condition_overall"),
    accidentHistory: text("accident_history"),
    damageType: text("damage_type"),
    engineCondition: text("engine_condition"),
    transmissionCondition: text("transmission_condition"),
    chassisCondition: text("chassis_condition"),
    airbagStatus: text("airbag_status"),
    floodDamage: integer("flood_damage", { mode: "boolean" }),
    starts: integer("starts", { mode: "boolean" }),
    drives: integer("drives", { mode: "boolean" }),
    keysAvailable: integer("keys_available", { mode: "boolean" }),
    description: text("description"),
    sellerNotes: text("seller_notes"),
    serviceHistory: text("service_history"),
    registrationInfo: text("registration_info"),
    saleType: text("sale_type", { enum: saleTypes }).notNull(),
    buyNowPrice: integer("buy_now_price"), // minor units
    buyNowCurrency: text("buy_now_currency", { enum: currencies }),
    status: text("status", { enum: vehicleStatus })
      .notNull()
      .default("DRAFT"),
    createdById: text("created_by_id").references(() => users.id),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("vehicles_slug_idx").on(t.slug),
    uniqueIndex("vehicles_lot_idx").on(t.lotNumber),
    index("vehicles_status_saletype_idx").on(t.status, t.saleType),
    index("vehicles_make_model_idx").on(t.make, t.model),
    index("vehicles_year_idx").on(t.year),
  ],
);

export const vehicleImages = sqliteTable(
  "vehicle_images",
  {
    id: text("id").primaryKey(),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isCover: integer("is_cover", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("vehicle_images_vehicle_idx").on(t.vehicleId, t.sortOrder)],
);

export const vehicleDocuments = sqliteTable(
  "vehicle_documents",
  {
    id: text("id").primaryKey(),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    kind: text("kind", {
      enum: ["inspection", "registration", "ownership", "other"],
    })
      .notNull()
      .default("other"),
    isPublic: integer("is_public", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("vehicle_docs_vehicle_idx").on(t.vehicleId)],
);

// ---------- auctions ----------

export const auctionStatuses = [
  "DRAFT",
  "SCHEDULED",
  "LIVE",
  "ENDED",
  "AWAITING_ADMIN_APPROVAL",
  "APPROVED",
  "REJECTED",
  "SOLD",
  "UNSOLD",
  "CANCELLED",
] as const;
export type AuctionStatus = (typeof auctionStatuses)[number];

export const auctions = sqliteTable(
  "auctions",
  {
    id: text("id").primaryKey(),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    status: text("status", { enum: auctionStatuses })
      .notNull()
      .default("DRAFT"),
    currency: text("currency", { enum: currencies }).notNull(),
    startingPrice: integer("starting_price").notNull(), // minor units
    bidIncrement: integer("bid_increment").notNull(), // minor units
    currentBid: integer("current_bid"), // NULL = no bids yet
    highestBidderId: text("highest_bidder_id").references(() => users.id),
    bidCount: integer("bid_count").notNull().default(0),
    startsAt: integer("starts_at").notNull(),
    endsAt: integer("ends_at").notNull(),
    extensionWindowSec: integer("extension_window_sec"), // NULL → platform default
    extensionDurationSec: integer("extension_duration_sec"), // NULL → platform default
    winnerUserId: text("winner_user_id").references(() => users.id),
    winningBidId: text("winning_bid_id"),
    finalizedAt: integer("finalized_at"),
    cancelReason: text("cancel_reason"),
    version: integer("version").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("auctions_vehicle_idx").on(t.vehicleId),
    index("auctions_status_ends_idx").on(t.status, t.endsAt),
    index("auctions_starts_idx").on(t.status, t.startsAt),
  ],
);

export const bidStatuses = ["ACCEPTED", "REJECTED"] as const;

export const bids = sqliteTable(
  "bids",
  {
    id: text("id").primaryKey(),
    auctionId: text("auction_id")
      .notNull()
      .references(() => auctions.id, { onDelete: "cascade" }),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    amount: integer("amount").notNull(), // minor units, auction currency
    status: text("status", { enum: bidStatuses }).notNull(),
    rejectReason: text("reject_reason"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    // Idempotency is scoped to the bidder: a retry of *your own* request must
    // return your recorded bid, while the same key from another user is an
    // independent bid (evaluated on its own merits).
    uniqueIndex("bids_idem_idx").on(t.auctionId, t.userId, t.idempotencyKey),
    index("bids_auction_amount_idx").on(t.auctionId, t.amount),
    index("bids_user_idx").on(t.userId, t.createdAt),
  ],
);

export const auctionEvents = sqliteTable(
  "auction_events",
  {
    id: text("id").primaryKey(),
    auctionId: text("auction_id")
      .notNull()
      .references(() => auctions.id),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    actorId: text("actor_id"),
    reason: text("reason"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("auction_events_auction_idx").on(t.auctionId)],
);

// ---------- commerce ----------

export const orderStatuses = [
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    auctionId: text("auction_id").references(() => auctions.id),
    buyerId: text("buyer_id")
      .notNull()
      .references(() => users.id),
    type: text("type", { enum: ["AUCTION_WIN", "BUY_NOW"] }).notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency", { enum: currencies }).notNull(),
    status: text("status", { enum: orderStatuses })
      .notNull()
      .default("PENDING_APPROVAL"),
    adminNote: text("admin_note"),
    decidedById: text("decided_by_id").references(() => users.id),
    decidedAt: integer("decided_at"),
    paymentStatus: text("payment_status", {
      enum: ["unpaid", "paid", "refunded"],
    })
      .notNull()
      .default("unpaid"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    index("orders_vehicle_idx").on(t.vehicleId),
    index("orders_buyer_idx").on(t.buyerId, t.createdAt),
    index("orders_status_idx").on(t.status),
    // At most one PENDING_APPROVAL order per vehicle — belt & braces on top of
    // the serialized engine transactions.
    uniqueIndex("orders_pending_vehicle_idx")
      .on(t.vehicleId)
      .where(sql`${t.status} = 'PENDING_APPROVAL'`),
  ],
);

export const favorites = sqliteTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.vehicleId] }),
    index("favorites_user_idx").on(t.userId),
  ],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    payloadJson: text("payload_json"),
    readAt: integer("read_at"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("notifications_user_idx").on(t.userId, t.createdAt),
    index("notifications_unread_idx").on(t.userId, t.readAt),
  ],
);

export const adminAuditLogs = sqliteTable(
  "admin_audit_logs",
  {
    id: text("id").primaryKey(),
    adminId: text("admin_id")
      .notNull()
      .references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    beforeJson: text("before_json"),
    afterJson: text("after_json"),
    reason: text("reason"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("audit_entity_idx").on(t.entityType, t.entityId),
    index("audit_admin_idx").on(t.adminId, t.createdAt),
  ],
);

export const platformSettings = sqliteTable("platform_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON-encoded
});
