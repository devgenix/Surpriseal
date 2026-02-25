import { Currency } from "./currency";
import { PLANS, ADDONS } from "./constants/pricing";

/**
 * Calculates the total price of a moment based on the plan and selected addons.
 */
export function calculateMomentPrice(
  planId: "base" | "premium" | string,
  addonIds: string[],
  currency: Currency
): number {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return 0;

  let total = plan.price[currency] || 0;

  // If it's a premium plan, all addons are included (base price covers it)
  if (planId === "premium") {
    return total;
  }

  // Otherwise, add up the prices of selected addons
  if (addonIds && addonIds.length > 0) {
    addonIds.forEach((id) => {
      const addon = ADDONS.find((a) => a.id === id);
      if (addon) {
        total += addon.price[currency] || 0;
      }
    });
  }

  return total;
}

/**
 * Calculates the balance due by subtracting the paid amount from the total price.
 */
export function calculateBalanceDue(totalPrice: number, paidAmount: number): number {
  return Math.max(0, totalPrice - paidAmount);
}

/**
 * Calculates the media upload limit for a moment.
 */
export function getMediaLimit(momentData: any): number {
  const planLimit = momentData?.plan === "premium" ? 25 : 10;
  const extraSlots = momentData?.selectedAddons?.includes("extraMedia") ? 25 : 0;
  return planLimit + extraSlots;
}
