import { isStripeTestMode } from "./stripe-test-mode"
import { toMinorUnits } from "./money"
type Env = Record<string, string | undefined>
export function stripeTestMisconfigured(env: Env = process.env) {
  return env.STRIPE_MODE === "test" && !isStripeTestMode(env)
}
export function stripePaymentAvailability(stripeOnboarded: boolean, env: Env = process.env) {
  const stripeTestMode = env.STRIPE_MODE === "test"
  return { stripeOnboarded: stripeTestMode ? isStripeTestMode(env) : stripeOnboarded, stripeTestMode }
}
export function subscriptionLineItem(plan: { stripePriceId: string | null; priceMonthly: number; name: string }, testMode: boolean) {
  if (!testMode) {
    if (!plan.stripePriceId) throw new Error("El plan no tiene un precio de Stripe configurado")
    return { price: plan.stripePriceId, quantity: 1 }
  }
  return { price_data: { currency: "mxn" as const, unit_amount: toMinorUnits(plan.priceMonthly), recurring: { interval: "month" as const }, product_data: { name: plan.name } }, quantity: 1 }
}
