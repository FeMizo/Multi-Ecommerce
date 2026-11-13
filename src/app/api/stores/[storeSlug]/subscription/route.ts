import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { isStripeTestMode } from "@/lib/stripe-test-mode"
import { isLaunchOpen, LAUNCH_CODE, LAUNCH_END, launchBaseSlug, launchPrice } from "@/lib/launch-promo"
import { stripeTestMisconfigured, subscriptionLineItem } from "@/lib/stripe-payment-policy"
import { stripe } from "@/lib/stripe"
import { isMatchingMonthlyMxnPrice } from "@/lib/stripe-billing"

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("checkout"), planId: z.string().min(1), checkoutToken: z.string().uuid() }),
  z.object({ action: z.literal("portal") }),
])

async function getOrCreateCustomer({
  storeId,
  currentCustomerId,
  email,
  name,
}: {
  storeId: string
  currentCustomerId: string | null
  email?: string
  name: string
}) {
  if (currentCustomerId) return currentCustomerId

  const customer = await stripe.customers.create(
    { email, name, metadata: { storeId } },
    { idempotencyKey: `billing-customer:${storeId}` },
  )
  const claimed = await db.store.updateMany({
    where: { id: storeId, stripeCustomerId: null },
    data: { stripeCustomerId: customer.id },
  })
  if (claimed.count === 1) return customer.id

  const store = await db.store.findUniqueOrThrow({ where: { id: storeId }, select: { stripeCustomerId: true } })
  return store.stripeCustomerId ?? customer.id
}

export async function POST(req: NextRequest, { params }: RouteContext<"/api/stores/[storeSlug]/subscription">) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  const { storeSlug } = await params
  const input = schema.safeParse(await req.json())
  if (!input.success) return NextResponse.json({ message: "Solicitud inválida" }, { status: 422 })
  const membership = await db.storeMember.findFirst({ where: { userId, role: "OWNER", store: { slug: storeSlug } }, include: { store: true } })
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })
  const origin = isStripeTestMode() ? req.nextUrl.origin : process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin

  if (stripeTestMisconfigured()) return NextResponse.json({ message: "Configura claves Stripe TEST válidas para usar el modo de prueba" }, { status: 409 })

  const customerId = await getOrCreateCustomer({
    storeId: membership.store.id,
    currentCustomerId: membership.store.stripeCustomerId,
    email: session.user.email ?? undefined,
    name: membership.store.name,
  })
  if (input.data.action === "portal") {
    const portal = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/dashboard/${storeSlug}/planes` })
    return NextResponse.json({ url: portal.url })
  }

  const existingSubscription = await db.storeSubscription.findUnique({ where: { storeId: membership.store.id } })
  if (existingSubscription?.stripeSubscriptionId && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(existingSubscription.status)) {
    return NextResponse.json({ message: "Administra el cambio de plan desde el portal de facturación" }, { status: 409 })
  }

  const plan = await db.plan.findFirst({ where: { id: input.data.planId, isActive: true } })
  if (!plan) return NextResponse.json({ message: "El plan no está disponible para suscripción" }, { status: 409 })
  const baseSlug = launchBaseSlug(plan.slug)
  const base = baseSlug ? await db.plan.findFirst({ where: { slug: baseSlug, isActive: true } }) : plan
  if (!base || (baseSlug && (!isLaunchOpen() || plan.priceMonthly !== launchPrice(base.priceMonthly)))) {
    return NextResponse.json({ message: "Promoción disponible del 13 al 30 de noviembre de 2026" }, { status: 409 })
  }
  if (!isStripeTestMode() && (!plan.stripePriceId || !await isMatchingMonthlyMxnPrice(plan.stripePriceId, plan.priceMonthly))) {
    return NextResponse.json({ message: "El precio de Stripe no coincide con el plan MXN mensual" }, { status: 409 })
  }

  let couponId: string | undefined
  if (baseSlug) {
    const coupon = await stripe.coupons.retrieve(LAUNCH_CODE).catch(async (error: unknown) => {
      if (!error || typeof error !== "object" || !("code" in error) || error.code !== "resource_missing") throw error
      return stripe.coupons.create({
        id: LAUNCH_CODE, name: LAUNCH_CODE, percent_off: 20, duration: "repeating", duration_in_months: 3,
        redeem_by: Math.floor(LAUNCH_END.getTime() / 1000),
      }, { idempotencyKey: "launch2026:coupon:v1" })
    })
    if (coupon.livemode || coupon.percent_off !== 20 || coupon.duration !== "repeating" || coupon.duration_in_months !== 3 || !coupon.valid || coupon.redeem_by !== Math.floor(LAUNCH_END.getTime() / 1000)) {
      return NextResponse.json({ message: "Cupón TEST incompatible" }, { status: 409 })
    }
    couponId = coupon.id
  }
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription", customer: customerId, client_reference_id: membership.store.id,
    // Charge the normal recurring price with a three-month discount; Stripe restores it automatically.
    line_items: [subscriptionLineItem(isStripeTestMode() ? { ...base, name: plan.name } : plan, isStripeTestMode())], locale: "es",
    payment_method_types: ["card"],
    ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
    success_url: `${origin}/dashboard/${storeSlug}/planes?subscription=success`, cancel_url: `${origin}/dashboard/${storeSlug}/planes?subscription=cancelled`,
    metadata: { storeId: membership.store.id, requestedPlanId: plan.id },
    subscription_data: { metadata: { storeId: membership.store.id, ...(isStripeTestMode() ? { testPlanId: base.id, launchCode: couponId ?? "" } : {}) } },
  }, { idempotencyKey: `subscription-checkout:${membership.store.id}:${plan.id}:${input.data.checkoutToken}` })
  return NextResponse.json({ url: checkout.url })
}
