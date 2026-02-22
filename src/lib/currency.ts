export type Currency = "NGN" | "USD";

export const PRICES: Record<Currency, number> = {
  NGN: 2500,
  USD: 4,
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  NGN: "₦",
  USD: "$",
};

export function formatPrice(currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const amount = PRICES[currency];
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
