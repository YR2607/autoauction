# Database Schema — AutoAuction MVP (SQLite / Drizzle)

All `id` columns are TEXT UUIDs. All money = `INTEGER` minor units + `CHAR(3)` currency.
All timestamps = `INTEGER` unix-ms UTC. `BOOLEAN` = INTEGER 0/1.

## users
| col | type | notes |
|---|---|---|
| id | TEXT PK | uuid |
| email | TEXT UNIQUE NOT NULL | lowercased |
| passwordHash | TEXT NOT NULL | scrypt |
| role | TEXT NOT NULL DEFAULT 'buyer' | `buyer` \| `admin` |
| status | TEXT NOT NULL DEFAULT 'active' | `active` \| `suspended` |
| createdAt, updatedAt | INTEGER NOT NULL | |

## user_profiles (1:1 users)
| firstName, lastName, phone, addressLine, city, country, avatarUrl | TEXT NULL |

## sessions
| id | TEXT PK | random 32B token (sha256 stored) |
| userId | TEXT FK→users NOT NULL | |
| expiresAt | INTEGER NOT NULL | |
| createdAt | INTEGER | |

## vehicles
| col | type | notes |
|---|---|---|
| id, slug TEXT UNIQUE, lotNumber TEXT UNIQUE | identity |
| make, model, trim | TEXT NOT NULL (trim NULL) | |
| year INTEGER, vin TEXT, mileage INTEGER | | vin stored full, masked on read |
| vinVisibility TEXT DEFAULT 'last4' | `last4` \| `full` \| `hidden` |
| bodyType, fuelType, transmission, drivetrain | TEXT | enum-like |
| engineCapacityCc INTEGER, enginePowerHp INTEGER | | |
| exteriorColor, interiorColor | TEXT | |
| doors INTEGER, seats INTEGER | | |
| locationCountry, locationCity | TEXT | |
| conditionOverall, accidentHistory, damageType | TEXT | |
| engineCondition, transmissionCondition, chassisCondition | TEXT | |
| airbagStatus TEXT, floodDamage INT, starts INT, drives INT, keysAvailable INT | | |
| description, sellerNotes, serviceHistory, registrationInfo | TEXT | |
| saleType TEXT NOT NULL | `BUY_NOW` \| `AUCTION` \| `AUCTION_BUY_NOW` |
| buyNowPrice INTEGER, buyNowCurrency TEXT | NULL unless buy-now enabled |
| status TEXT NOT NULL DEFAULT 'DRAFT' | `DRAFT`/`PUBLISHED`/`RESERVED`/`SOLD`/`ARCHIVED` |
| createdById FK→users, createdAt, updatedAt | |

Indexes: `(status, saleType)`, `(make, model)`, `year`, `lotNumber UNIQUE`.

## vehicle_images
| id, vehicleId FK CASCADE, url TEXT, sortOrder INT, isCover INT, createdAt |

## vehicle_documents
| id, vehicleId FK CASCADE, title TEXT, url TEXT, kind TEXT (`inspection`/`registration`/`ownership`/`other`), isPublic INT DEFAULT 0 |

## auctions
| col | type | notes |
|---|---|---|
| id | TEXT PK |
| vehicleId | TEXT FK→vehicles UNIQUE NOT NULL | one auction per vehicle |
| status | TEXT NOT NULL DEFAULT 'DRAFT' | lifecycle enum (§6 spec) |
| currency | TEXT NOT NULL | USD/EUR/GBP |
| startingPrice | INTEGER NOT NULL | minor units |
| bidIncrement | INTEGER NOT NULL | minor units |
| currentBid | INTEGER NULL | NULL = no bids |
| highestBidderId | TEXT FK→users NULL | |
| bidCount | INTEGER NOT NULL DEFAULT 0 | accepted bids |
| startsAt, endsAt | INTEGER NOT NULL | |
| extensionWindowSec INT, extensionDurationSec INT | per-auction override, NULL = platform default |
| winnerUserId FK, winningBidId FK | set at finalization |
| finalizedAt INTEGER NULL | |
| cancelReason TEXT NULL | |
| version INTEGER NOT NULL DEFAULT 0 | optimistic counter, ++ per accepted bid |

## bids
| id | TEXT PK |
| auctionId FK, vehicleId FK, userId FK | |
| amount | INTEGER NOT NULL | minor units, auction currency |
| status | TEXT NOT NULL | `ACCEPTED` \| `REJECTED` |
| rejectReason | TEXT NULL | |
| idempotencyKey | TEXT NOT NULL, UNIQUE(auctionId, idempotencyKey) | dedup retries |
| createdAt | INTEGER | |
Indexes: `(auctionId, amount DESC)`, `(userId, createdAt)`.

## orders (purchase requests)
| id | TEXT PK |
| vehicleId FK, auctionId FK NULL, buyerId FK | |
| type | `AUCTION_WIN` \| `BUY_NOW` |
| amount, currency | snapshot |
| status | `PENDING_APPROVAL`/`APPROVED`/`REJECTED`/`COMPLETED`/`CANCELLED` |
| adminNote TEXT, decidedById FK, decidedAt | |
| paymentStatus TEXT DEFAULT 'unpaid' | `unpaid`/`paid`/`refunded` — manual |
| createdAt, updatedAt |
UNIQUE partial: one active (non-terminal) order per vehicle — enforced in txn.

## favorites
| userId FK, vehicleId FK, createdAt | PK(userId, vehicleId) |

## notifications
| id, userId FK, type TEXT, title, body, payloadJson TEXT, readAt INT NULL, createdAt |

## admin_audit_logs
| id, adminId FK, action TEXT, entityType, entityId, beforeJson, afterJson, reason TEXT, createdAt |
**Append-only — never UPDATE/DELETE.**

## platform_settings
| key TEXT PK | e.g. `platform.name`, `auction.extensionWindowSec`, `auction.defaultIncrementMinor.EUR` |
| value TEXT | JSON-encoded |

## auction_events (audit of lifecycle transitions)
| id, auctionId FK, fromStatus, toStatus, actorId NULL, reason TEXT, createdAt |
