# Product Specification — AutoAuction MVP

> Status: Phase 0 baseline. Source: master development prompt, amended: **SQLite instead of Supabase**.

## 1. Vision

Premium automotive marketplace combining the browsing simplicity of AutoScout24 with
the essential auction mechanics of Copart. Real, functional web application — not a
static prototype.

Users can:

1. Browse, search and filter vehicles.
2. View detailed vehicle information (specs, condition, photos, documents).
3. Place manual bids in live auctions.
4. Purchase instantly at a fixed **Buy Now** price.
5. Track their bids and auction results.
6. Manage their account, favorites and notifications.

**Only administrators** create vehicle listings and manage auctions.
No self-service seller/dealer accounts in the MVP.

## 2. Actors

| Actor | Capabilities |
|---|---|
| Guest | Browse catalog, auctions, vehicle details. Register/login. |
| Buyer | Everything a guest can + bid, buy now, favorites, dashboard, purchases, notifications. |
| Admin | Everything a buyer can + full vehicle/auction/bid/order/user management, approvals, settings. |

## 3. Selling configurations

Every vehicle has exactly one `saleType`:

| Type | Behavior |
|---|---|
| `BUY_NOW` | Fixed price. Click → purchase request → **atomic reservation** → admin approval. |
| `AUCTION` | Manual bidding. `minNextBid = currentBid + bidIncrement` (or `startingPrice` when no bids). |
| `AUCTION_BUY_NOW` | Active auction + fixed price. Successful Buy Now **atomically closes the auction**, preserves bid history, creates purchase request. |

## 4. Confirmed business rules

- Highest **valid** bid wins; winner requires **admin approval**.
- Each auction has **one fixed currency** (USD / EUR / GBP). No conversion.
- Bid increment configurable per auction; default €250 for EUR, configurable per currency.
- Auctions may extend (default: bid in last 2 min → +2 min), configurable/disableable.
- No automatic bidding, no payment gateway, no seller accounts.

## 5. Page inventory

**Public:** Home, Catalog (`/vehicles`), Auctions (`/auctions`), Buy Now (`/buy-now`),
Vehicle Details (`/vehicles/[slug]`), How It Works (homepage section), auth pages.

**Account:** Dashboard, Profile, My Bids, My Purchases, Favorites, Notifications.

**Admin:** Dashboard, Vehicles (CRUD + wizard + media), Auctions, Bids, Approvals,
Users, Orders, Settings.

## 6. Auction lifecycle

`DRAFT → SCHEDULED → LIVE → ENDED → AWAITING_ADMIN_APPROVAL → APPROVED | REJECTED → SOLD | UNSOLD`
`CANCELLED` reachable from `DRAFT/SCHEDULED/LIVE` (reason required).
Server-side transitions only; no arbitrary status changes from the client.

## 7. Design direction

Premium automotive marketplace: clean composition, large imagery, strong typography
(Manrope headings / Inter body), generous spacing, minimal noise.

Palette: Graphite `#111827`, White, Light BG `#F3F5F8`, Primary `#2563EB`,
Secondary text `#6B7280`, Success `#16A34A`, Warning `#F59E0B`, Error `#DC2626`.

Every page: loading, error, empty, success states; mobile-first; keyboard accessible;
confirmation dialogs for bids/purchases/admin actions (no `alert()`).

## 8. Out of scope (MVP)

- Payment gateway, card storage, checkout screens.
- Automatic/proxy bidding.
- Currency conversion.
- Seller/dealer self-service.
- Multi-language UI (English only; copy centralized for future i18n).
