import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    if (process.env.NODE_ENV === "production" && !process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")) {
      throw new Error("Producción requiere una STRIPE_SECRET_KEY live")
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
      maxNetworkRetries: 2,
    })
  }
  return stripeInstance
}

// For backward compatibility - lazy getter
export const stripe = {
  get checkout() { return getStripe().checkout },
  get customers() { return getStripe().customers },
  get paymentIntents() { return getStripe().paymentIntents },
  get refunds() { return getStripe().refunds },
  get subscriptions() { return getStripe().subscriptions },
  get billingPortal() { return getStripe().billingPortal },
  get accounts() { return getStripe().accounts },
  get accountLinks() { return getStripe().accountLinks },
  get webhooks() { return getStripe().webhooks },
  get prices() { return getStripe().prices },
  get products() { return getStripe().products },
}

export const COMMISSION_RATE = 0.10

export function calculateOrderAmounts(subtotal: number, commissionRate = COMMISSION_RATE) {
  const commission = subtotal * commissionRate
  const total = subtotal
  const sellerPayout = subtotal - commission
  return { subtotal, commission, total, sellerPayout }
}
