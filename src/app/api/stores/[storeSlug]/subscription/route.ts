import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
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
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  const { storeSlug } = await params
  const input = schema.safeParse(await req.json())
  if (!input.success) return NextResponse.json({ message: "Solicitud inválida" }, { status: 422 })
  const membership = await db.storeMember.findFirst({ where: { userId: session.user.id, role: "OWNER", store: { slug: storeSlug } }, include: { store: true } })
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin

  const customerId = await getOrCreateCustomer({
    storeId: membership.store.id,
    currentCustomerId: membership.store.stripeCustomerId,
    email: session.user.email ?? undefined,
    name: membership.store.name,
  })
  if (input.data.action === "portal") {
    const portal = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/dashboard/${storeSlug}/settings` })
    return NextResponse.json({ url: portal.url })
  }

  const existingSubscription = await db.storeSubscription.findUnique({ where: { storeId: membership.store.id } })
  if (existingSubscription?.stripeSubscriptionId && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(existingSubscription.status)) {
    return NextResponse.json({ message: "Administra el cambio de plan desde el portal de facturación" }, { status: 409 })
  }

  const plan = await db.plan.findFirst({ where: { id: input.data.planId, isActive: true } })
  if (!plan?.stripePriceId) return NextResponse.json({ message: "El plan no está disponible para suscripción" }, { status: 409 })
  if (!await isMatchingMonthlyMxnPrice(plan.stripePriceId, plan.priceMonthly)) {
    return NextResponse.json({ message: "El precio de Stripe no coincide con el plan MXN mensual" }, { status: 409 })
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription", customer: customerId, client_reference_id: membership.store.id,
    line_items: [{ price: plan.stripePriceId, quantity: 1 }], locale: "es",
    success_url: `${origin}/dashboard/${storeSlug}/settings?subscription=success`, cancel_url: `${origin}/dashboard/${storeSlug}/settings?subscription=cancelled`,
    metadata: { storeId: membership.store.id, requestedPlanId: plan.id },
    subscription_data: { metadata: { storeId: membership.store.id } },
  }, { idempotencyKey: `subscription-checkout:${membership.store.id}:${plan.id}:${input.data.checkoutToken}` })
  return NextResponse.json({ url: checkout.url })
}
