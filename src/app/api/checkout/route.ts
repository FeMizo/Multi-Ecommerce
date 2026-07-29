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
import { generateTransferCode, PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from "@/lib/payment-methods"
import { sendOrderReceivedEmail } from "@/lib/email"
import { calculateCouponDiscount, ensureStripeCoupon, normalizeCouponCode } from "@/lib/store-coupons"

const checkoutSchema = z.object({
  checkoutToken: z.string().uuid(),
  storeId: z.string().min(1),
  paymentMethod: z.enum(PAYMENT_METHODS).default("STRIPE"),
  couponCode: z.string().max(32).optional(),
  shippingAddress: z.object({
    fullName: z.string().min(3).max(120),
    phone: z.string().min(9).max(30),
    address: z.string().min(5).max(300),
    city: z.string().min(2).max(100),
    notes: z.string().max(500).optional(),
  }),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive().max(99) })).min(1).max(50),
})

type CouponData = {
  id: string
  code: string
  type: "PERCENTAGE" | "FIXED"
  value: number
  minOrderAmount: number | null
  maxRedemptions: number | null
  redeemedCount: number
  startsAt: Date | null
  endsAt: Date | null
  isActive: boolean
  stripeCouponId: string | null
}

async function loadCoupon(storeId: string, code: string) {
  return db.storeCoupon.findFirst({
    where: { storeId, code },
    select: {
      id: true,
      code: true,
      type: true,
      value: true,
      minOrderAmount: true,
      maxRedemptions: true,
      redeemedCount: true,
      startsAt: true,
      endsAt: true,
      isActive: true,
      stripeCouponId: true,
    },
  }) as Promise<CouponData | null>
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  try {
    await releaseExpiredOrderReservations(5)
  } catch (error) {
    console.error("No se pudieron liberar reservaciones vencidas", error)
  }

  const parsed = checkoutSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ message: "Carrito o direccion invalidos" }, { status: 422 })

  const { checkoutToken, items, storeId, shippingAddress, paymentMethod, couponCode: rawCouponCode } = parsed.data
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
  let requestedCouponCode = rawCouponCode ? normalizeCouponCode(rawCouponCode) : null

  if (new Set(items.map((item) => item.productId)).size !== items.length) {
    return NextResponse.json({ message: "No repitas productos en el carrito" }, { status: 422 })
  }

  let order = await db.order.findUnique({
    where: { checkoutToken },
    include: {
      items: true,
      coupon: {
        select: {
          id: true,
          code: true,
          type: true,
          value: true,
          minOrderAmount: true,
          maxRedemptions: true,
          redeemedCount: true,
          startsAt: true,
          endsAt: true,
          isActive: true,
          stripeCouponId: true,
        },
      },
    },
  })

  if (order && (order.customerId !== session.user.id || order.storeId !== storeId)) {
    return NextResponse.json({ message: "Token de checkout invalido" }, { status: 409 })
  }

  if (order && order.paymentMethod !== paymentMethod) {
    return NextResponse.json({ message: "El metodo de pago del checkout ya no coincide" }, { status: 409 })
  }

  if (order) {
    const existingCouponCode = order.couponCode ?? order.coupon?.code ?? null
    if (!requestedCouponCode && existingCouponCode) {
      requestedCouponCode = existingCouponCode
    } else if (requestedCouponCode && existingCouponCode !== requestedCouponCode) {
      return NextResponse.json({ message: "El cupon del checkout ya no coincide" }, { status: 409 })
    }
  }

  if (order && order.status !== "PENDING") {
    return NextResponse.json({ message: "Este checkout ya fue procesado" }, { status: 409 })
  }

  let coupon: CouponData | null = order?.coupon ?? null

  if (!order && requestedCouponCode) {
    coupon = await loadCoupon(storeId, requestedCouponCode)
    if (!coupon) {
      return NextResponse.json({ message: "El cupon no existe para esta tienda" }, { status: 409 })
    }
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

        const subtotalCents = items.reduce((sum, item) => {
          const product = products.find((candidate) => candidate.id === item.productId)!
          return sum + toMinorUnits(product.price) * item.quantity
        }, 0)
        const subtotal = fromMinorUnits(subtotalCents)
        const discountAmount = coupon ? calculateCouponDiscount(coupon, subtotal) ?? 0 : 0
        const discountCents = toMinorUnits(discountAmount)
        const finalSubtotalCents = Math.max(0, subtotalCents - discountCents)
        const finalSubtotal = fromMinorUnits(finalSubtotalCents)

        if (requestedCouponCode && !coupon) throw new Error("COUPON_NOT_FOUND")
        if (requestedCouponCode && discountAmount === 0) throw new Error("COUPON_INVALID")

        for (const item of items) {
          const changed = await tx.product.updateMany({
            where: { id: item.productId, storeId, status: "ACTIVE", deletedAt: null, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          })
          if (changed.count !== 1) throw new Error("STOCK_UNAVAILABLE")
        }

        const commissionRate = plan?.commissionRate ?? 0.05
        const platformFeeCents = Math.round(finalSubtotalCents * commissionRate)
        const platformFee = fromMinorUnits(platformFeeCents)

        if (coupon) {
          if (coupon.maxRedemptions === null) {
            await tx.storeCoupon.update({
              where: { id: coupon.id },
              data: { redeemedCount: { increment: 1 } },
            })
          } else {
            const claimed = await tx.storeCoupon.updateMany({
              where: { id: coupon.id, redeemedCount: { lt: coupon.maxRedemptions } },
              data: { redeemedCount: { increment: 1 } },
            })
            if (claimed.count !== 1) throw new Error("COUPON_LIMIT")
          }
        }

        return tx.order.create({
          data: {
            checkoutToken,
            storeId,
            customerId: session.user.id,
            status: paymentMethod === "CASH_ON_DELIVERY"
              ? "PENDING_PAYMENT"
              : paymentMethod === "TRANSFER"
                ? "AWAITING_CONFIRMATION"
                : "PENDING",
            reservationExpiresAt: paymentMethod === "STRIPE"
              ? new Date(Date.now() + RESERVATION_TTL_MS)
              : null,
            subtotal,
            platformFee,
            total: finalSubtotal,
            couponId: coupon?.id ?? null,
            couponCode: coupon?.code ?? null,
            discountAmount,
            paymentMethod,
            transferCode: paymentMethod === "TRANSFER" ? generateTransferCode() : null,
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
              create: {
                storeId,
                amount: finalSubtotal,
                currency: "mxn",
                platformFee,
                status: "PENDING",
              },
            },
          },
          include: {
            items: true,
            coupon: {
              select: {
                id: true,
                code: true,
                type: true,
                value: true,
                minOrderAmount: true,
                maxRedemptions: true,
                redeemedCount: true,
                startsAt: true,
                endsAt: true,
                isActive: true,
                stripeCouponId: true,
              },
            },
          },
        })
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("ORDER_LIMIT:")) {
        const [, count, max] = error.message.split(":")
        return NextResponse.json({ message: `Limite mensual de pedidos alcanzado (${count}/${max})` }, { status: 409 })
      }
      if (error instanceof Error && error.message === "PRODUCTS_UNAVAILABLE") {
        return NextResponse.json({ message: "Algunos productos no estan disponibles" }, { status: 400 })
      }
      if (error instanceof Error && error.message === "STOCK_UNAVAILABLE") {
        return NextResponse.json({ message: "Stock insuficiente" }, { status: 409 })
      }
      if (error instanceof Error && error.message === "COUPON_NOT_FOUND") {
        return NextResponse.json({ message: "El cupon no existe para esta tienda" }, { status: 409 })
      }
      if (error instanceof Error && error.message === "COUPON_INVALID") {
        return NextResponse.json({ message: "El cupon no es valido para este pedido" }, { status: 409 })
      }
      if (error instanceof Error && error.message === "COUPON_LIMIT") {
        return NextResponse.json({ message: "El cupon ya alcanzo su limite de usos" }, { status: 409 })
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        return NextResponse.json({ message: "El inventario cambio; revisa tu carrito" }, { status: 409 })
      }
      throw error
    }
  }

  if (paymentMethod === "CASH_ON_DELIVERY") {
    const store = await db.store.findUnique({
      where: { id: storeId },
      select: { cashOnDeliveryEnabled: true },
    })

    if (!store?.cashOnDeliveryEnabled) {
      await releaseOrderReservation(order.id)
      return NextResponse.json({ message: "La tienda aun no acepta pago al entregar" }, { status: 409 })
    }

    const orderForEmail = await db.order.findUnique({
      where: { id: order.id },
      select: {
        id: true,
        total: true,
        transferCode: true,
        customer: { select: { email: true } },
        store: {
          select: {
            name: true,
            transferAccountName: true,
            transferAccountNumber: true,
            transferBank: true,
            transferReferencePrefix: true,
            transferReferenceExtra: true,
          },
        },
      },
    })

    if (orderForEmail?.customer.email) {
      await Promise.allSettled([
        sendOrderReceivedEmail({
          email: orderForEmail.customer.email,
          orderId: orderForEmail.id,
          storeName: orderForEmail.store.name,
          total: orderForEmail.total,
          paymentMethodLabel: PAYMENT_METHOD_LABELS.CASH_ON_DELIVERY,
        }),
      ])
    }

    return NextResponse.json({
      url: `${origin}/checkout/success?order_id=${order.id}&payment_method=cash_on_delivery`,
    })
  }

  if (paymentMethod === "TRANSFER") {
    const store = await db.store.findUnique({
      where: { id: storeId },
      select: { transferEnabled: true },
    })

    if (!store?.transferEnabled) {
      await releaseOrderReservation(order.id)
      return NextResponse.json({ message: "La tienda aun no acepta pago por transferencia" }, { status: 409 })
    }

    const orderForEmail = await db.order.findUnique({
      where: { id: order.id },
      select: {
        id: true,
        total: true,
        transferCode: true,
        customer: { select: { email: true } },
        store: {
          select: {
            name: true,
            transferAccountName: true,
            transferAccountNumber: true,
            transferBank: true,
            transferReferencePrefix: true,
            transferReferenceExtra: true,
          },
        },
      },
    })

    if (orderForEmail?.customer.email) {
      await Promise.allSettled([
        sendOrderReceivedEmail({
          email: orderForEmail.customer.email,
          orderId: orderForEmail.id,
          storeName: orderForEmail.store.name,
          total: orderForEmail.total,
          paymentMethodLabel: PAYMENT_METHOD_LABELS.TRANSFER,
          transferCode: orderForEmail.transferCode,
          transferDetails: {
            transferAccountName: orderForEmail.store.transferAccountName,
            transferAccountNumber: orderForEmail.store.transferAccountNumber,
            transferBank: orderForEmail.store.transferBank,
            transferReferencePrefix: orderForEmail.store.transferReferencePrefix,
            transferReferenceExtra: orderForEmail.store.transferReferenceExtra,
          },
        }),
      ])
    }

    return NextResponse.json({
      url: `${origin}/checkout/success?order_id=${order.id}&payment_method=transfer`,
    })
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
    return NextResponse.json({ message: "La sesion de pago expiro; inicia un checkout nuevo" }, { status: 409 })
  }

  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { stripeAccountId: true, stripeOnboarded: true },
  })
  if (!store?.stripeAccountId || !store.stripeOnboarded) {
    await releaseOrderReservation(order.id)
    return NextResponse.json({ message: "La tienda aun no puede recibir pagos" }, { status: 409 })
  }

  if (coupon && !coupon.stripeCouponId) {
    const stripeCouponId = await ensureStripeCoupon(coupon)
    await db.storeCoupon.update({ where: { id: coupon.id }, data: { stripeCouponId } })
    coupon = { ...coupon, stripeCouponId }
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
    ...(coupon?.stripeCouponId ? { discounts: [{ coupon: coupon.stripeCouponId }] } : {}),
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
      throw persistError
    }
    checkoutSession = recovered
  }

  if (!checkoutSession.url) {
    if (checkoutSession.status === "open") {
      await stripe.checkout.sessions.expire(checkoutSession.id)
    }
    await releaseOrderReservation(order.id)
    return NextResponse.json({ message: "Stripe no devolvio una sesion de pago utilizable" }, { status: 502 })
  }

  return NextResponse.json({ url: checkoutSession.url })
}
