import { db } from "@/lib/db"
import { isFullRefund } from "@/lib/billing-rules"
import { stripe } from "@/lib/stripe"
import { checkoutRecoveryAction } from "@/lib/checkout-recovery"

export const STRIPE_CHECKOUT_TTL_SECONDS = 30 * 60
export const RESERVATION_TTL_MS = 35 * 60 * 1_000

export async function releaseOrderReservation(orderId: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } })
    if (!order) return false

    const cancelled = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "CANCELLED", reservationExpiresAt: null },
    })
    if (cancelled.count !== 1) return false

    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
    }
    await tx.payment.updateMany({ where: { orderId, status: "PENDING" }, data: { status: "FAILED" } })
    return true
  })
}

export async function releaseExpiredOrderReservations(limit = 10) {
  const expired = await db.order.findMany({
    where: {
      status: "PENDING",
      reservationExpiresAt: { lte: new Date() },
    },
    select: { id: true, stripeSessionId: true },
    orderBy: { reservationExpiresAt: "asc" },
    take: limit,
  })

  let released = 0
  for (const order of expired) {
    if (order.stripeSessionId) {
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId)
      const action = checkoutRecoveryAction(session.status)
      if (action === "preserve") continue
      if (action === "expire_then_release") {
        try {
          await stripe.checkout.sessions.expire(session.id)
        } catch {
          const latest = await stripe.checkout.sessions.retrieve(session.id)
          if (latest.status === "complete") continue
          if (latest.status === "open") throw new Error(`No se pudo cerrar Checkout ${session.id}`)
        }
      }
    }

    if (await releaseOrderReservation(order.id)) released += 1
  }

  return released
}

export async function completeFullRefund({
  paymentIntentId,
  refundId,
  amountCents,
}: {
  paymentIntentId: string
  refundId?: string
  amountCents?: number
}) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { order: { include: { items: true } } },
    })
    if (!payment) return false
    if (amountCents !== undefined && !isFullRefund(payment.amount, amountCents)) return false

    const refunded = await tx.payment.updateMany({
      where: { id: payment.id, status: "SUCCEEDED" },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
        ...(refundId ? { stripeRefundId: refundId } : {}),
      },
    })
    if (refunded.count !== 1) return payment.status === "REFUNDED"

    await tx.order.update({ where: { id: payment.orderId }, data: { status: "REFUNDED", reservationExpiresAt: null } })
    for (const item of payment.order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
    }
    return true
  })
}
