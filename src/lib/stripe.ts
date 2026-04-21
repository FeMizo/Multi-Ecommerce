import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
})

export const COMMISSION_RATE = 0.10

export function calculateOrderAmounts(subtotal: number, commissionRate = COMMISSION_RATE) {
  const commission = subtotal * commissionRate
  const total = subtotal
  const sellerPayout = subtotal - commission
  return { subtotal, commission, total, sellerPayout }
}
