import { stripe } from "@/lib/stripe"
import { toMinorUnits } from "@/lib/money"

export async function isMatchingMonthlyMxnPrice(priceId: string, monthlyAmount: number) {
  const price = await stripe.prices.retrieve(priceId)
  return price.active
    && price.currency === "mxn"
    && price.type === "recurring"
    && price.recurring?.interval === "month"
    && price.recurring.interval_count === 1
    && price.unit_amount === toMinorUnits(monthlyAmount)
}
