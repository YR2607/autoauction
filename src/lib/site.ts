/**
 * Public-facing site configuration. Contact details are intentionally
 * env-driven — nothing here should present placeholder data as real
 * company information.
 */
export const siteConfig = {
  name: "AutoAuction",
  /** Public support email — rendered only when explicitly configured. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || null,
  /** Currencies the marketplace operates in. */
  currencies: ["EUR", "USD", "GBP"],
} as const;
