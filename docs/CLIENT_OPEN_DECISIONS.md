# Client Open Decisions — AutoAuction

These business decisions block a production launch. The MVP intentionally
makes no assumptions — staging copy is marked as draft where it depends on
these answers. **None of this has been invented; every item needs an explicit
client answer.**

## 1. Legal entity & jurisdiction

- [ ] Country of operation (affects contract law, consumer protection, taxes)
- [ ] Legal company details for footer/legal pages (name, registration number, registered address)
- [ ] Supported jurisdictions (which countries buyers/sellers may come from)
- [ ] Governing law & dispute venue for Terms of Use

## 2. Fees & payments

- [ ] Buyer commission — rate and how it's disclosed at bid time
- [ ] Seller commission (if any) — rate, minimum fee, invoicing
- [ ] Payment method (bank transfer / escrow / in-person) — **the MVP supports
      manual administrative order handling only; online payment requires an
      explicit new requirement and is NOT implemented**
- [ ] Deposit requirement (if any) — amount, when collected, refundability
- [ ] Payment deadline after winning / approved purchase
- [ ] Late-payment consequences (order cancellation, penalties, relisting)

## 3. Order lifecycle rules

- [ ] Refund & cancellation policy (buyer withdrawal, seller withdrawal, failed payment)
- [ ] What happens when a winner defaults — current system supports
      REOPEN / NEXT_BIDDER / UNSOLD; client must choose the default policy
- [ ] Reserve price handling — currently not implemented; is it needed?
- [ ] Auction duration defaults (current: admin sets start/end per auction)

## 4. Vehicle handover

- [ ] Who is responsible for vehicle handover/inspection on pickup
- [ ] Delivery responsibility (buyer pickup / platform-arranged / seller-arranged)
- [ ] Required documents at handover (title transfer, bill of sale)
- [ ] Whether "every vehicle is inspected" is a real operational guarantee —
      current copy deliberately avoids this claim until confirmed

## 5. Contact & legal content

- [ ] Official contact email / phone / address (`NEXT_PUBLIC_CONTACT_EMAIL`
      placeholder in staging until confirmed)
- [ ] Final Terms of Use — drafted by legal counsel; current pages are marked
      "Draft — pending legal review" and must not ship as final
- [ ] Final Privacy Policy + data-retention commitments (GDPR-equivalent
      obligations depend on jurisdiction)
- [ ] Cookie/analytics consent requirements per jurisdiction

## 6. Content & moderation policy

- [ ] Who approves vehicle listings before publication (current: admin
      publishes manually — confirm this matches operations)
- [ ] Buyer registration requirements (KYC? phone verification? deposit to bid?)

## Summary for launch

| Blocker | Needed from client |
|---|---|
| Legal pages are drafts | Final ToU + Privacy Policy |
| Contact email is placeholder | Official contact details |
| Payment flow unspecified | Method, deadlines, refund rules |
| Fees not configured | Commission structure |
| Jurisdiction unknown | Operating country + governing law |
