# Client Demonstration Guide — AutoAuction Staging

This guide walks a client through the Simple Car Auction MVP on the staging
environment. All demo data is synthetic — no real vehicles, people, or
transactions are represented.

## Demo environment

| Item | Value |
|---|---|
| Public staging URL | **https://autoauction.claimonetest.online** — live on Tencent VPS (nginx + Let's Encrypt) |
| Local staging fallback | `http://localhost:3300` — `next start` against the production build |
| Staging notice | `DEMO_MODE=1` is set — "STAGING DEMO" banner on every page + `X-Robots-Tag: noindex` |

## Demo accounts

Three synthetic accounts exist on staging:

- **Administrator** — `demo-admin@autoauction.dev`
- **Buyer 1** — `demo-buyer1@autoauction.dev`
- **Buyer 2** — `demo-buyer2@autoauction.dev`

Passwords are deliberately **not** committed to the repository. They are
stored only in the deployment secrets / the local `staging/` workspace
(which is gitignored). Share them with the client out-of-band, and replace
them before inviting anyone else (see `docs/PUBLIC_STAGING_DEPLOYMENT.md`
→ *Before inviting real users*).

## Demo content

The staging database contains synthetic vehicles covering the key states:

- A **live auction** (e.g. the BMW M4) — bids can be placed in real time
- **Published vehicles** not yet in auction — for Buy Now and scheduling demos
- **Sold vehicles** (e.g. Porsche, Toyota) — completed purchase records

## Walkthrough script

### Part 1 — Buyer experience (10 min)

1. **Register** — open the site, click Register, create an account with an
   email + password. No email verification is required in the MVP.
2. **Browse the catalog** — the vehicle grid shows photos, specs, and price
   info. Try the search box and filters (brand, price range, auction status).
3. **Open a vehicle** — gallery, full specifications, mileage, description.
   Note that private documents (title scans etc.) are NOT shown — they are
   admin-only.
4. **Place a bid** — on the live auction card, enter a bid at or above the
   shown minimum. The price updates instantly for all viewers via
   server-sent events — open the same page in a second browser (or
   incognito) as Buyer 2 to show real-time updates and the outbid
   notification.
5. **Anti-sniping** — if a bid lands in the final minutes of an auction, the
   end time extends automatically so last-second sniping can't win.
6. **Buy Now** — on a vehicle with a Buy Now price, click Buy Now to purchase
   instantly at the fixed price instead of bidding.
7. **Favorites** — star a vehicle to save it; view saved vehicles from the
   favorites view.
8. **Password reset** — sign out, use "Forgot password", and follow the
   emailed reset link (requires the real email webhook to be configured;
   on the local demo the link is written to the server outbox log instead).

### Part 2 — Administrator experience (10 min)

1. **Sign in** as the admin account — the admin nav item appears.
2. **Create a vehicle** — Admin → Vehicles → New. Fill in make, model, year,
   specs, description, pricing (auction start price and/or Buy Now).
3. **Upload photos** — add gallery images; they appear publicly under
   `/public/uploads`.
4. **Upload private documents** — attach title/inspection docs; these are
   served only to the admin (private endpoint), never listed publicly.
5. **Create an auction** — schedule start/end on the vehicle. The vehicle
   goes live automatically when the window opens.
6. **Watch bids arrive** — as buyers bid, the admin sees current highest
   bid and bidder.
7. **Close & approve** — when the auction ends, admin picks the outcome:
   - **Approve winner** — sale recorded to the highest bidder
   - **Next bidder** — offer passes to the runner-up if the winner defaults
   - **Reopen** — restart the auction
   - **Unsold** — mark unsold, vehicle returns to inventory
8. **Buy Now approvals** — Buy Now purchases also land in the admin queue
   for approval/rejection.

### Part 3 — Things to point out

- **Real-time updates** — no page refresh needed; bids, outbid notices,
  and auction-end updates stream over SSE.
- **Mobile layout** — resize the browser or open on a phone; the layout is
  responsive with a bottom-sheet-style drawer on small screens.
- **Draft legal pages** — Terms of Use / Privacy are marked "Draft —
  pending legal review"; final text depends on the client's answers in
  `docs/CLIENT_OPEN_DECISIONS.md`.
- **Not yet in scope** — no payment processing, no KYC, no dealer accounts,
  no proxy bidding. Those are business decisions documented in
  `docs/CLIENT_OPEN_DECISIONS.md`.

## Suggested demo flow

| Step | Actor | Action |
|---|---|---|
| 1 | Presenter | Register as a fresh buyer, browse catalog |
| 2 | Presenter | Open live auction, place a bid |
| 3 | Helper | As Buyer 2, outbid — show live update + notification |
| 4 | Presenter | Buy Now on a listed vehicle |
| 5 | Presenter | Switch to admin, create a vehicle with photos + docs |
| 6 | Presenter | Schedule/close an auction, approve a winner |
| 7 | Presenter | Show password reset email flow |
