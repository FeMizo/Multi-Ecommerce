import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { completeFullRefund } from "@/lib/payment-lifecycle"

export async function POST(_req: NextRequest, { params }: RouteContext<"/api/stores/[storeSlug]/orders/[orderId]/refund">) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug, orderId } = await params
  const membership = await db.storeMember.findFirst({
    where: { userId: session.user.id, role: "OWNER", store: { slug: storeSlug } },
    include: { store: { select: { id: true } } },
  })
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const payment = await db.payment.findFirst({
    where: { orderId, storeId: membership.store.id },
    select: { id: true, stripePaymentIntentId: true, status: true },
  })
  if (!payment) return NextResponse.json({ message: "Pago no encontrado" }, { status: 404 })
  if (payment.status === "REFUNDED") return NextResponse.json({ message: "El pago ya fue reembolsado" }, { status: 409 })
  if (payment.status !== "SUCCEEDED" || !payment.stripePaymentIntentId) {
    return NextResponse.json({ message: "El pago no puede reembolsarse" }, { status: 409 })
  }

  const refund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId,
    reverse_transfer: true,
    refund_application_fee: true,
    metadata: { orderId, paymentId: payment.id },
  }, { idempotencyKey: `order-refund:${payment.id}` })

  if (refund.status === "succeeded") {
    await completeFullRefund({
      paymentIntentId: payment.stripePaymentIntentId,
      refundId: refund.id,
      amountCents: refund.amount,
    })
  } else {
    await db.payment.update({ where: { id: payment.id }, data: { stripeRefundId: refund.id } })
  }

  return NextResponse.json({ id: refund.id, status: refund.status })
}
