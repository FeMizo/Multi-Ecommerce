import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"

const schema = z.object({ action: z.enum(["checkout", "portal"]), planId: z.string().optional() })

export async function POST(req: NextRequest, { params }: RouteContext<"/api/stores/[storeSlug]/subscription">) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  const { storeSlug } = await params
  const input = schema.safeParse(await req.json())
  if (!input.success) return NextResponse.json({ message: "Solicitud inválida" }, { status: 422 })
  const membership = await db.storeMember.findFirst({ where: { userId: session.user.id, role: "OWNER", store: { slug: storeSlug } }, include: { store: true } })
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin

  let customerId = membership.store.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({ email: session.user.email ?? undefined, name: membership.store.name, metadata: { storeId: membership.store.id } })
    customerId = customer.id
    await db.store.update({ where: { id: membership.store.id }, data: { stripeCustomerId: customerId } })
  }
  if (input.data.action === "portal") {
    const portal = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/dashboard/${storeSlug}/settings` })
    return NextResponse.json({ url: portal.url })
  }

  const existingSubscription = await db.storeSubscription.findUnique({ where: { storeId: membership.store.id } })
  if (existingSubscription?.stripeSubscriptionId && ["ACTIVE", "TRIALING", "PAST_DUE"].includes(existingSubscription.status)) {
    return NextResponse.json({ message: "Administra el cambio de plan desde el portal de facturación" }, { status: 409 })
  }

  const plan = input.data.planId ? await db.plan.findFirst({ where: { id: input.data.planId, isActive: true } }) : null
  if (!plan?.stripePriceId) return NextResponse.json({ message: "El plan no está disponible para suscripción" }, { status: 409 })
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription", customer: customerId, line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${origin}/dashboard/${storeSlug}/settings?subscription=success`, cancel_url: `${origin}/dashboard/${storeSlug}/settings?subscription=cancelled`,
    metadata: { storeId: membership.store.id, planId: plan.id }, subscription_data: { metadata: { storeId: membership.store.id, planId: plan.id } },
  })
  return NextResponse.json({ url: checkout.url })
}
