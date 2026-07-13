import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import Stripe from "stripe"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { completeFullRefund, releaseOrderReservation } from "@/lib/payment-lifecycle"
import { sendOrderConfirmationEmail } from "@/lib/email"
import { getCurrentPeriodEnd } from "@/lib/billing-rules"
import { toMinorUnits } from "@/lib/money"

type OrderItemInput = { productId: string; quantity: number }

function webhookError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 1_000) : "Error desconocido"
}

async function recordReservedCheckout(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id
  if (!orderId) return false
  if (session.payment_status !== "paid") return true

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id
  if (!paymentIntentId) throw new Error("Checkout sin PaymentIntent")

  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { payment: true } })
    if (!order) throw new Error("Orden reservada no encontrada")
    if (order.status === "PAID") return
    if (order.status !== "PENDING" || !order.payment) throw new Error("La reserva de checkout ya no está disponible")
    if (toMinorUnits(order.total) !== session.amount_total) throw new Error("El total cobrado no coincide con la orden")

    const paid = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: {
        status: "PAID",
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        paidAt: new Date(),
        reservationExpiresAt: null,
      },
    })
    if (paid.count !== 1) return
    await tx.payment.update({
      where: { id: order.payment.id },
      data: { stripePaymentIntentId: paymentIntentId, status: "SUCCEEDED" },
    })
  })
  return true
}

async function recordLegacyPaidCheckout(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return
  const metadata = session.metadata
  if (!metadata?.userId || !metadata.storeId || !metadata.items || !metadata.shippingAddress) {
    throw new Error("Checkout sin metadatos requeridos")
  }

  let items: OrderItemInput[]
  let shippingAddress: unknown
  try {
    items = JSON.parse(metadata.items) as OrderItemInput[]
    shippingAddress = JSON.parse(metadata.shippingAddress)
  } catch {
    throw new Error("Metadatos de checkout inválidos")
  }
  if (!items.length || items.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
    throw new Error("Artículos de checkout inválidos")
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id
  if (!paymentIntentId) throw new Error("Checkout sin PaymentIntent")

  const products = await db.product.findMany({
    where: { id: { in: items.map((item) => item.productId) }, storeId: metadata.storeId, deletedAt: null },
  })
  if (products.length !== items.length) throw new Error("Productos de checkout no encontrados")

  const total = (session.amount_total ?? 0) / 100
  const subtotal = items.reduce((sum, item) => sum + products.find((product) => product.id === item.productId)!.price * item.quantity, 0)
  const commissionRate = Number(metadata.commissionRate ?? "0.05")
  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1) throw new Error("Comisión inválida")

  try {
    await db.$transaction(async (tx) => {
      for (const item of items) {
        const changed = await tx.product.updateMany({
          where: { id: item.productId, storeId: metadata.storeId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
        if (changed.count !== 1) throw new Error("Stock insuficiente al confirmar el pago")
      }

      await tx.order.create({
        data: {
          storeId: metadata.storeId,
          customerId: metadata.userId,
          status: "PAID",
          subtotal,
          platformFee: Math.round(total * commissionRate * 100) / 100,
          total,
          shippingAddress: shippingAddress as Prisma.InputJsonValue,
          stripeSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          paidAt: new Date(),
          items: {
            create: items.map((item) => {
              const product = products.find((candidate) => candidate.id === item.productId)!
              return {
                productId: product.id,
                quantity: item.quantity,
                unitPrice: product.price,
                total: product.price * item.quantity,
                productSnapshot: { name: product.name, price: product.price, images: product.images, sku: product.sku },
              }
            }),
          },
          payment: { create: { storeId: metadata.storeId, stripePaymentIntentId: paymentIntentId, amount: total, currency: "mxn", platformFee: Math.round(total * commissionRate * 100) / 100, status: "SUCCEEDED" } },
        },
      })
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return
    throw error
  }
}

async function recordPaidCheckout(session: Stripe.Checkout.Session) {
  if (!await recordReservedCheckout(session)) await recordLegacyPaidCheckout(session)
  if (session.payment_status !== "paid") return

  const orderId = session.metadata?.orderId ?? session.client_reference_id
  const order = await db.order.findFirst({
    where: orderId ? { id: orderId } : { stripeSessionId: session.id },
    select: { id: true, total: true, customer: { select: { email: true } }, store: { select: { name: true } } },
  })
  if (order) {
    try {
      await sendOrderConfirmationEmail({ email: order.customer.email, orderId: order.id, storeName: order.store.name, total: order.total })
    } catch (error) {
      console.error("No se pudo enviar la confirmación del pedido", webhookError(error))
    }
  }
}

async function releaseCheckout(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId ?? session.client_reference_id
  if (orderId) await releaseOrderReservation(orderId)
}

async function recordExternalRefund(charge: Stripe.Charge) {
  if (!charge.refunded) return
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id
  if (!paymentIntentId) return
  await completeFullRefund({ paymentIntentId, amountCents: charge.amount_refunded })
}

async function recordRefund(refund: Stripe.Refund) {
  if (refund.status !== "succeeded") return
  const paymentIntentId = typeof refund.payment_intent === "string" ? refund.payment_intent : refund.payment_intent?.id
  if (!paymentIntentId) return
  await completeFullRefund({ paymentIntentId, refundId: refund.id, amountCents: refund.amount })
}

function toSubscriptionStatus(status: Stripe.Subscription.Status) {
  if (status === "active") return "ACTIVE" as const
  if (status === "trialing") return "TRIALING" as const
  if (status === "unpaid") return "UNPAID" as const
  if (status === "canceled") return "CANCELLED" as const
  return "PAST_DUE" as const
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const { storeId } = subscription.metadata
  if (!storeId) throw new Error("Suscripción sin metadatos requeridos")
  const stripePriceIds = [...new Set(subscription.items.data.map((item) => item.price.id))]
  const plans = await db.plan.findMany({
    where: { stripePriceId: { in: stripePriceIds }, isActive: true },
    select: { id: true },
  })
  if (plans.length !== 1) {
    await db.storeSubscription.updateMany({
      where: { storeId },
      data: { status: "PAST_DUE", stripeSubscriptionId: subscription.id },
    })
    throw new Error("La suscripción no contiene exactamente un Price reconocido")
  }
  const [plan] = plans
  const currentPeriodEnd = getCurrentPeriodEnd(subscription.items.data.map((item) => item.current_period_end))
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id
  await db.$transaction([
    db.store.update({ where: { id: storeId }, data: { stripeCustomerId: customerId } }),
    db.storeSubscription.upsert({
      where: { storeId },
      update: { planId: plan.id, stripeSubscriptionId: subscription.id, status: toSubscriptionStatus(subscription.status), currentPeriodEnd, cancelAtPeriodEnd: subscription.cancel_at_period_end },
      create: { storeId, planId: plan.id, stripeSubscriptionId: subscription.id, status: toSubscriptionStatus(subscription.status), currentPeriodEnd, cancelAtPeriodEnd: subscription.cancel_at_period_end },
    }),
  ])
}

async function syncSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id
  if (!subscriptionId) throw new Error("Checkout de Billing sin suscripción")
  await syncSubscription(await stripe.subscriptions.retrieve(subscriptionId))
}

async function claimWebhookEvent(event: Stripe.Event) {
  const now = new Date()
  try {
    await db.stripeWebhookEvent.create({
      data: { stripeEventId: event.id, type: event.type, processingStartedAt: now },
    })
    return "claimed" as const
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error

    const claimed = await db.stripeWebhookEvent.updateMany({
      where: {
        stripeEventId: event.id,
        processedAt: null,
        OR: [
          { processingStartedAt: null },
          { processingStartedAt: { lt: new Date(now.getTime() - 5 * 60 * 1_000) } },
        ],
      },
      data: { processingStartedAt: now, error: null },
    })
    if (claimed.count === 1) return "claimed" as const

    const stored = await db.stripeWebhookEvent.findUnique({
      where: { stripeEventId: event.id },
      select: { processedAt: true },
    })
    return stored?.processedAt ? "processed" as const : "processing" as const
  }
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature")
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !secret) return NextResponse.json({ error: "Webhook no configurado" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret)
  } catch {
    return NextResponse.json({ error: "Webhook inválido" }, { status: 400 })
  }

  const claim = await claimWebhookEvent(event)
  if (claim !== "claimed") return NextResponse.json({ received: true, state: claim })

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        if ((event.data.object as Stripe.Checkout.Session).mode === "payment") {
          await recordPaidCheckout(event.data.object as Stripe.Checkout.Session)
        } else if ((event.data.object as Stripe.Checkout.Session).mode === "subscription") {
          await syncSubscriptionCheckout(event.data.object as Stripe.Checkout.Session)
        }
        break
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        if ((event.data.object as Stripe.Checkout.Session).mode === "payment") await releaseCheckout(event.data.object as Stripe.Checkout.Session)
        break
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription)
        break
      case "charge.refunded":
        await recordExternalRefund(event.data.object as Stripe.Charge)
        break
      case "refund.updated":
        await recordRefund(event.data.object as Stripe.Refund)
        break
      case "account.updated": {
        const account = event.data.object as Stripe.Account
        await db.store.updateMany({
          where: { stripeAccountId: account.id },
          data: { stripeOnboarded: account.details_submitted && account.charges_enabled && account.payouts_enabled },
        })
        break
      }
    }
    await db.stripeWebhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processedAt: new Date(), processingStartedAt: null, error: null },
    })
    return NextResponse.json({ received: true })
  } catch (error) {
    await db.stripeWebhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processingStartedAt: null, error: webhookError(error) },
    })
    return NextResponse.json({ error: "No se pudo procesar el evento" }, { status: 500 })
  }
}
