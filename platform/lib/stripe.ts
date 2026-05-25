import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

export const PLANS = {
  basic: process.env.STRIPE_PRICE_BASIC!,
  featured: process.env.STRIPE_PRICE_FEATURED!,
} as const;

export type Plan = keyof typeof PLANS;

export function planFromPriceId(priceId: string): Plan | null {
  if (priceId === PLANS.basic) return "basic";
  if (priceId === PLANS.featured) return "featured";
  return null;
}
