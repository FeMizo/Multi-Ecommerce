import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { checkOrderLimit, getEffectivePlan } from "@/lib/plan-limits"
import {
  releaseExpiredOrderReservations,
  releaseOrderReservation,
  RESERVATION_TTL_MS,
  STRIPE_CHECKOUT_TTL_SECONDS,
} from "@/lib/payment-lifecycle"
import { fromMinorUnits, toMinorUnits } from "@/lib/money"
import { checkoutRecoveryAction } from "@/lib/checkout-recovery"

const checkoutSchema = z.object({
  checkoutToken: z.string().uuid(),
  storeId: z.string().min(1),
  shippingAddress: z.object({
    fullName: z.string().min(3).max(120),
    phone: z.string().min(9).max(30),
    address: z.string().min(5).max(300),
    city: z.string().min(2).max(100),
    notes: z.string().max(500).optional(),
  }),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive().max(99) })).min(1).max(50),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  try {
    await releaseExpiredOrderReservations(5)
  } catch (error) {
    console.error("No se pudieron liberar reservaciones vencidas", error)
  }

  const parsed = checkoutSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ message: "Carrito o dirección inválidos" }, { status: 422 })
  const { checkoutToken, items, storeId, shippingAddress } = parsed.data
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
  if (new Set(items.map((item) => item.productId)).size !== items.length) {
    return NextResponse.json({ message: "No repitas productos en el carrito" }, { status: 422 })
  }

  let order = await db.order.findUnique({
    where: { checkoutToken },
    include: { items: true },
  })
  if (order && (order.customerId !== session.user.id || order.storeId !== storeId)) {
    return NextResponse.json({ message: "Token de checkout inválido" }, { status: 409 })
  }
  if (order && order.status !== "PENDING") {
    return NextResponse.json({ message: "Este checkout ya fue procesado" }, { status: 409 })
  }

  if (!order) {
    try {
      order = await db.$transaction(async (tx) => {
        const [products, orderLimit, plan] = await Promise.all([
          tx.product.findMany({
            where: { id: { in: items.map((item) => item.productId) }, storeId, status: "ACTIVE", deletedAt: null },
          }),
          checkOrderLimit(storeId, tx),
          getEffectivePlan(storeId, tx),
        ])
        if (!orderLimit.ok) throw new Error(`ORDER_LIMIT:${orderLimit.count}:${orderLimit.max}`)
        if (products.length !== items.length) throw new Error("PRODUCTS_UNAVAILABLE")

        for (const item of items) {
          const changed = await tx.product.updateMany({
            where: { id: item.productId, storeId, status: "ACTIVE", deletedAt: null, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          })
          if (changed.count !== 1) throw new Error("STOCK_UNAVAILABLE")
        }

        const subtotalCents = items.reduce((sum, item) => {
          const product = products.find((candidate) => candidate.id === item.productId)!
          return sum + toMinorUnits(product.price) * item.quantity
        }, 0)
        const commissionRate = plan?.commissionRate ?? 0.05
        const platformFeeCents = Math.round(subtotalCents * commissionRate)
        const subtotal = fromMinorUnits(subtotalCents)
        const platformFee = fromMinorUnits(platformFeeCents)

        return tx.order.create({
          data: {
            checkoutToken,
            storeId,
            customerId: session.user.id,
            status: "PENDING",
            reservationExpiresAt: new Date(Date.now() + RESERVATION_TTL_MS),
            subtotal,
            platformFee,
            total: subtotal,
            shippingAddress: shippingAddress as Prisma.InputJsonValue,
            notes: shippingAddress.notes || null,
            items: {
              create: items.map((item) => {
                const product = products.find((candidate) => candidate.id === item.productId)!
                const unitPrice = fromMinorUnits(toMinorUnits(product.price))
                return {
                  productId: product.id,
                  quantity: item.quantity,
                  unitPrice,
                  total: fromMinorUnits(toMinorUnits(unitPrice) * item.quantity),
                  productSnapshot: { name: product.name, price: unitPrice, images: product.images, sku: product.sku },
                }
              }),
            },
            payment: {
              create: { storeId, amount: subtotal, currency: "mxn", platformFee, status: "PENDING" },
            },
          },
          include: { items: true },
        })
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("ORDER_LIMIT:")) {
        const [, count, max] = error.message.split(":")
        return NextResponse.json({ message: `Límite mensual de pedidos alcanzado (${count}/${max})` }, { status: 409 })
      }
      if (error instanceof Error && error.message === "PRODUCTS_UNAVAILABLE") {
        return NextResponse.json({ message: "Algunos productos no están disponibles" }, { status: 400 })
      }
      if (error instanceof Error && error.message === "STOCK_UNAVAILABLE") {
        return NextResponse.json({ message: "Stock insuficiente" }, { status: 409 })
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        return NextResponse.json({ message: "El inventario cambió; revisa tu carrito" }, { status: 409 })
      }
      throw error
    }
  }

  if (order.stripeSessionId) {
    const existingSession = await stripe.checkout.sessions.retrieve(order.stripeSessionId)
    if (existingSession.url && existingSession.status === "open") {
      return NextResponse.json({ url: existingSession.url })
    }
    if (existingSession.status === "complete") {
      return NextResponse.json({ url: `${origin}/checkout/success?session_id=${existingSession.id}` })
    }
    await releaseOrderReservation(order.id)
    return NextResponse.json({ message: "La sesión de pago expiró; inicia un checkout nuevo" }, { status: 409 })
  }

  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { stripeAccountId: true, stripeOnboarded: true },
  })
  if (!store?.stripeAccountId || !store.stripeOnboarded) {
    await releaseOrderReservation(order.id)
    return NextResponse.json({ message: "La tienda aún no puede recibir pagos" }, { status: 409 })
  }

  const lineItems = order.items.map((item) => {
    const snapshot = item.productSnapshot as { name?: unknown; images?: unknown }
    const name = typeof snapshot.name === "string" ? snapshot.name : "Producto"
    const images = Array.isArray(snapshot.images) ? snapshot.images.filter((value): value is string => typeof value === "string") : []
    return {
      price_data: {
        currency: "mxn" as const,
        product_data: { name, images: images.slice(0, 1) },
        unit_amount: toMinorUnits(item.unitPrice),
      },
      quantity: item.quantity,
    }
  })

  const checkoutParams = {
      mode: "payment",
      client_reference_id: order.id,
      line_items: lineItems,
      expires_at: Math.floor(Date.now() / 1000) + STRIPE_CHECKOUT_TTL_SECONDS,
      payment_intent_data: {
        application_fee_amount: toMinorUnits(order.platformFee),
        transfer_data: { destination: store.stripeAccountId },
        metadata: { orderId: order.id, storeId },
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: { orderId: order.id, storeId },
    } as const
  const idempotencyKey = `checkout:${session.user.id}:${checkoutToken}`

  let checkoutSession
  try {
    checkoutSession = await stripe.checkout.sessions.create(checkoutParams, { idempotencyKey })
  } catch (firstError) {
    try {
      checkoutSession = await stripe.checkout.sessions.create(checkoutParams, { idempotencyKey })
    } catch {
      // A network failure can happen after Stripe accepted the request. Keep the
      // reservation until its safety window expires instead of risking oversell.
      throw firstError
    }
  }

  try {
    await db.order.update({ where: { id: order.id }, data: { stripeSessionId: checkoutSession.id } })
  } catch (persistError) {
    const recovered = await stripe.checkout.sessions.retrieve(checkoutSession.id)
    try {
      await db.order.update({ where: { id: order.id }, data: { stripeSessionId: recovered.id } })
    } catch {
      const action = checkoutRecoveryAction(recovered.status)
      if (action === "expire_then_release") {
        await stripe.checkout.sessions.expire(recovered.id)
        await releaseOrderReservation(order.id)
      } else if (action === "release") {
        await releaseOrderReservation(order.id)
      }
      // A completed session is intentionally left reserved for webhook fulfillment.
      throw persistError
    }
    checkoutSession = recovered
  }

  if (!checkoutSession.url) {
    if (checkoutSession.status === "open") {
      await stripe.checkout.sessions.expire(checkoutSession.id)
    }
    await releaseOrderReservation(order.id)
    return NextResponse.json({ message: "Stripe no devolvió una sesión de pago utilizable" }, { status: 502 })
  }

  return NextResponse.json({ url: checkoutSession.url })
}
