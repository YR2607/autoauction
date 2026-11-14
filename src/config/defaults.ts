// Platform defaults — overridable via platform_settings table (admin UI).
export const DEFAULT_SETTINGS: Record<string, unknown> = {
  "platform.name": "AutoAuction",
  "platform.defaultCurrency": "EUR",
  "platform.supportedCurrencies": ["USD", "EUR", "GBP"],
  "platform.timeZone": "Europe/Berlin",
  "auction.extensionWindowSec": 120,
  "auction.extensionDurationSec": 120,
  "auction.defaultDurationSec": 259200,
  "auction.defaultIncrementMinor.EUR": 25000,
  "auction.defaultIncrementMinor.USD": 25000,
  "auction.defaultIncrementMinor.GBP": 20000,
  "auth.sessionTtlSec": 2592000,
  "media.maxImages": 30,
  "media.maxUploadBytes": 10485760,
  "rate.bidsPerMin": 30,
  "rate.authPerMin": 10,
};
