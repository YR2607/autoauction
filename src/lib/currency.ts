// Money is stored as integer minor units (cents). Never float math.
export type Currency = "USD" | "EUR" | "GBP";
export const CURRENCIES: Currency[] = ["USD", "EUR", "GBP"];

const SYMBOLS: Record<Currency, string> = { USD: "$", EUR: "€", GBP: "£" };

const formatters = new Map<string, Intl.NumberFormat>();
function fmt(currency: Currency, locale = "en-GB") {
  const key = `${locale}-${currency}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });
    formatters.set(key, f);
  }
  return f;
}

/** minor units → "€25,000" */
export function formatMoney(minor: number | null | undefined, currency: Currency) {
  if (minor == null) return "N/A";
  return fmt(currency).format(minor / 100);
}

export function currencySymbol(currency: Currency) {
  return SYMBOLS[currency];
}
