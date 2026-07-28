import { stripe } from "@/lib/stripe"
import { toMinorUnits, fromMinorUnits } from "@/lib/money"

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "-")
}

export function calculateCouponDiscount(
  coupon: { type: "PERCENTAGE" | "FIXED"; value: number; minOrderAmount: number | null; maxRedemptions: number | null; redeemedCount: number; startsAt: Date | null; endsAt: Date | null; isActive: boolean },
  subtotal: number,
  now = new Date()
) {
  if (!coupon.isActive) return null
  if (coupon.startsAt && coupon.startsAt > now) return null
  if (coupon.endsAt && coupon.endsAt < now) return null
  if (coupon.minOrderAmount !== null && subtotal < coupon.minOrderAmount) return null
  if (coupon.maxRedemptions !== null && coupon.redeemedCount >= coupon.maxRedemptions) return null

  const discount = coupon.type === "PERCENTAGE"
    ? Math.min(subtotal, Math.round(subtotal * (coupon.value / 100)))
    : Math.min(subtotal, coupon.value)

  return discount > 0 ? discount : null
}

export async function ensureStripeCoupon(coupon: {
  id: string
  code: string
  type: "PERCENTAGE" | "FIXED"
  value: number
  maxRedemptions: number | null
  endsAt: Date | null
  stripeCouponId: string | null
}) {
  if (coupon.stripeCouponId) return coupon.stripeCouponId

  const created = await stripe.coupons.create({
    duration: "once",
    name: coupon.code,
    metadata: { storeCouponId: coupon.id, couponCode: coupon.code },
    ...(coupon.type === "PERCENTAGE"
      ? { percent_off: coupon.value }
      : { amount_off: toMinorUnits(coupon.value), currency: "mxn" }),
    ...(coupon.maxRedemptions !== null ? { max_redemptions: coupon.maxRedemptions } : {}),
    ...(coupon.endsAt ? { redeem_by: Math.floor(coupon.endsAt.getTime() / 1000) } : {}),
  })

  return created.id
}

export function applyDiscountToSubtotal(subtotal: number, discountAmount: number) {
  return fromMinorUnits(toMinorUnits(subtotal) - toMinorUnits(discountAmount))
}
