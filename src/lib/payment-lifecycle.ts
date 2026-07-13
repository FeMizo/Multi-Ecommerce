import { db } from "@/lib/db"
import { isFullRefund } from "@/lib/billing-rules"

export async function releaseOrderReservation(orderId: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } })
    if (!order) return false

    const cancelled = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "CANCELLED" },
    })
    if (cancelled.count !== 1) return false

    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
    }
    await tx.payment.updateMany({ where: { orderId, status: "PENDING" }, data: { status: "FAILED" } })
    return true
  })
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

    await tx.order.update({ where: { id: payment.orderId }, data: { status: "REFUNDED" } })
    for (const item of payment.order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
    }
    return true
  })
}
