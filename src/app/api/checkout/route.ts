import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { checkOrderLimit, getEffectivePlan } from "@/lib/plan-limits"
import { releaseOrderReservation } from "@/lib/payment-lifecycle"

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

  const parsed = checkoutSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ message: "Carrito o dirección inválidos" }, { status: 422 })
  const { checkoutToken, items, storeId, shippingAddress } = parsed.data
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

        const subtotal = items.reduce((sum, item) => {
          const product = products.find((candidate) => candidate.id === item.productId)!
          return sum + product.price * item.quantity
        }, 0)
        const commissionRate = plan?.commissionRate ?? 0.05
        const platformFee = Math.round(subtotal * commissionRate * 100) / 100

        return tx.order.create({
          data: {
            checkoutToken,
            storeId,
            customerId: session.user.id,
            status: "PENDING",
            subtotal,
            platformFee,
            total: subtotal,
            shippingAddress: shippingAddress as Prisma.InputJsonValue,
            notes: shippingAddress.notes || null,
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
        unit_amount: Math.round(item.unitPrice * 100),
      },
      quantity: item.quantity,
    }
  })

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: order.id,
      line_items: lineItems,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      payment_intent_data: {
        application_fee_amount: Math.round(order.platformFee * 100),
        transfer_data: { destination: store.stripeAccountId },
        metadata: { orderId: order.id, storeId },
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      metadata: { orderId: order.id, storeId },
    }, { idempotencyKey: `checkout:${session.user.id}:${checkoutToken}` })

    await db.order.update({ where: { id: order.id }, data: { stripeSessionId: checkoutSession.id } })
    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    await releaseOrderReservation(order.id)
    throw error
  }
}
