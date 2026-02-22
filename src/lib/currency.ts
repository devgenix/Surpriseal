export type Currency = "NGN" | "USD";

export const BASE_PRICES: Record<Currency, number> = {
  NGN: 2500,
  USD: 4,
};

export const PRICES = BASE_PRICES;

export const PREMIUM_PRICES: Record<Currency, number> = {
  NGN: 5000,
  USD: 8,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
};

export function formatPrice(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  return `${symbol}${amount.toLocaleString()}`;
}

// Add-on prices
export const ADDON_PRICES: Record<string, Record<Currency, string>> = {
  extendedHosting: { NGN: "₦2,000", USD: "$2" },
  extraMedia: { NGN: "₦2,000", USD: "$2" },
  customUrl: { NGN: "₦1,000", USD: "$1" },
  removeBranding: { NGN: "₦1,000", USD: "$1" },
  scheduledReveal: { NGN: "₦1,000", USD: "$1" },
};
