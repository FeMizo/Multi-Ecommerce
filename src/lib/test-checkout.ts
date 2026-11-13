import { createHash } from "node:crypto"
import { Prisma } from "@prisma/client"
import type Stripe from "stripe"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"
import { requireStripeTestMode } from "@/lib/stripe-test-mode"
import { quoteCheckout } from "@/lib/checkout-quote"
import { checkOrderLimit, getEffectivePlan } from "@/lib/plan-limits"
import { toMinorUnits, fromMinorUnits } from "@/lib/money"
import { normalizeCouponCode } from "@/lib/store-coupons"
import { STRIPE_CHECKOUT_TTL_SECONDS } from "@/lib/payment-lifecycle"
import type { ProductVariantSelection } from "@/lib/product-variants"

type Input = {
  checkoutToken: string; storeId: string; expectedTotal?: number; couponCode?: string
  deliveryMethod: "PICKUP" | "LOCAL_DELIVERY"
  deliveryLocation?: { formattedAddress: string; lat: number; lng: number; notes?: string } | null
  customerInfo: { fullName: string; email: string; phone: string; city: string; notes?: string }
  items: { productId: string; quantity: number; variantSelection: ProductVariantSelection[] }[]
}
type DraftPayload = {
  input: Input; customerId: string | null
  quote: ReturnType<typeof quoteCheckout>; platformFee: number; couponId: string | null
  products: { id: string; storeId: string; name: string; price: number; images: string[]; sku: string | null; stock: number; manageStock: boolean; variantOptions: unknown }[]
}

export class TestCheckoutExpiredError extends Error {
  constructor() { super("La sesión TEST expiró. Vuelve a pulsar pagar para iniciar otra.") }
}

// This path creates only an attempt and hosted TEST session, never an Order or stock reservation.
export async function createTestCheckout(input: Input, customerId: string | null, origin: string) {
  requireStripeTestMode()
  const fingerprint = createHash("sha256").update(JSON.stringify({ input, customerId })).digest("hex")
  const previous = await db.testCheckoutDraft.findUnique({ where: { checkoutToken: input.checkoutToken } })
  if (previous && previous.fingerprint !== fingerprint) throw new Error("Este intento cambió. Inicia una nueva compra.")
  if (previous?.status === "REFUNDED") throw new Error("Este intento fue reembolsado. Inicia una nueva compra.")
  if (previous?.stripeSessionId) {
    const session = await stripe.checkout.sessions.retrieve(previous.stripeSessionId)
    if (session.status === "complete") return `${origin}/checkout/success?session_id=${session.id}`
    if (session.url && session.status === "open") return session.url
    throw new TestCheckoutExpiredError()
  }
  const couponCode = normalizeCouponCode(input.couponCode ?? "") || undefined
  const [store, products, coupon, limit, plan] = await Promise.all([
    db.store.findFirst({ where: { id: input.storeId, isActive: true, deletedAt: null } }),
    db.product.findMany({ where: { id: { in: input.items.map(i => i.productId) }, storeId: input.storeId, status: "ACTIVE", deletedAt: null } }),
    couponCode ? db.storeCoupon.findUnique({ where: { storeId_code: { storeId: input.storeId, code: couponCode } } }) : null,
    checkOrderLimit(input.storeId), getEffectivePlan(input.storeId),
  ])
  if (!store || !limit.ok) throw new Error("La tienda no puede recibir este pedido.")
  if (input.deliveryMethod === "LOCAL_DELIVERY" && !input.deliveryLocation) throw new Error("Indica dónde entregar el pedido.")
  const quote = quoteCheckout({ store, products, items: input.items, deliveryMethod: input.deliveryMethod, couponCode, coupon })
  if (input.expectedTotal !== undefined && toMinorUnits(input.expectedTotal) !== toMinorUnits(quote.total)) throw new Error("El total cambió. Revisa tu compra.")
  const payload: DraftPayload = {
    input, customerId, quote, couponId: coupon?.id ?? null,
    platformFee: fromMinorUnits(Math.round(toMinorUnits(quote.subtotal - quote.discountAmount) * (plan?.commissionRate ?? 0.05))),
    products: products.map(({ id, storeId, name, price, images, sku, stock, manageStock, variantOptions }) => ({ id, storeId, name, price, images, sku, stock, manageStock, variantOptions })),
  }
  const draft = await db.testCheckoutDraft.upsert({
    where: { checkoutToken: input.checkoutToken }, update: {},
    create: { checkoutToken: input.checkoutToken, fingerprint, payload: payload as unknown as Prisma.InputJsonValue },
  })
  if (draft.fingerprint !== fingerprint) throw new Error("Token de intento inválido.")
  // Always bill the stored snapshot when retrying the same attempt.
  const saved = draft.payload as unknown as DraftPayload
  const expiresAt = Math.floor(draft.createdAt.getTime() / 1000) + STRIPE_CHECKOUT_TTL_SECONDS + 300
  if (expiresAt <= Math.floor(Date.now() / 1000) + STRIPE_CHECKOUT_TTL_SECONDS) throw new TestCheckoutExpiredError()
  const session = await stripe.checkout.sessions.create({
    mode: "payment", payment_method_types: ["card"], customer_email: saved.input.customerInfo.email,
    line_items: [{ price_data: { currency: "mxn", unit_amount: toMinorUnits(saved.quote.total), product_data: { name: "Compra Shop AionSite (TEST)" } }, quantity: 1 }],
    metadata: { testDraftId: draft.id },
    expires_at: expiresAt,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout?storeId=${input.storeId}`, locale: "es",
  }, { idempotencyKey: `test-draft:${draft.id}` })
  if (session.livemode || !session.url) throw new Error("Stripe no devolvió una sesión TEST válida.")
  await db.testCheckoutDraft.update({ where: { id: draft.id }, data: { stripeSessionId: session.id } })
  return session.url
}

export function isPaidTestDraft(session: Pick<Stripe.Checkout.Session, "livemode" | "mode" | "payment_status" | "metadata">) {
  return !session.livemode && session.mode === "payment" && session.payment_status === "paid" && Boolean(session.metadata?.testDraftId)
}

// Unpaid/declined attempts cannot reach order creation. Duplicate events are serialized by a row lock.
export async function confirmTestCheckout(session: Stripe.Checkout.Session) {
  requireStripeTestMode()
  if (!isPaidTestDraft(session)) return null
  const draftId = session.metadata!.testDraftId
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id
  if (!paymentIntentId) throw new Error("Falta el pago TEST confirmado.")
  try {
    return await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM test_checkout_drafts WHERE id = ${draftId} FOR UPDATE`
      const draft = await tx.testCheckoutDraft.findUniqueOrThrow({ where: { id: draftId } })
      if (draft.orderId) return draft.orderId
      if (draft.status === "REFUNDED") return null
      if (draft.status === "REFUNDING") throw new Error("TEST_CHECKOUT_UNAVAILABLE")
      if (draft.stripeSessionId && draft.stripeSessionId !== session.id) throw new Error("Sesión TEST incompatible.")
      const { input, customerId, quote, products: snapshots, platformFee, couponId } = draft.payload as unknown as DraftPayload
      if (session.currency !== "mxn" || session.amount_total !== toMinorUnits(quote.total)) throw new Error("Importe TEST incompatible.")
      // Serialize purchases per store, protecting shared variant/order/coupon limits.
      await tx.$queryRaw`SELECT id FROM stores WHERE id = ${input.storeId} FOR UPDATE`
      const [store, products, limit] = await Promise.all([
        tx.store.findFirst({ where: { id: input.storeId, isActive: true, deletedAt: null } }),
        tx.product.findMany({ where: { id: { in: input.items.map(i => i.productId) }, storeId: input.storeId, status: "ACTIVE", deletedAt: null } }),
        checkOrderLimit(input.storeId, tx),
      ])
      if (!store || !limit.ok) throw new Error("TEST_CHECKOUT_UNAVAILABLE")
      // Validate current stock/variants with the accepted price snapshot, without repricing the payment.
      try {
        quoteCheckout({ store, products: products.map(p => ({ ...p, price: snapshots.find(s => s.id === p.id)!.price })), items: input.items, deliveryMethod: "PICKUP" })
      } catch { throw new Error("TEST_CHECKOUT_UNAVAILABLE") }
      for (const item of input.items) {
        if (!products.find(p => p.id === item.productId)?.manageStock) continue
        const changed = await tx.product.updateMany({ where: { id: item.productId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } })
        if (changed.count !== 1) throw new Error("TEST_CHECKOUT_UNAVAILABLE")
      }
      if (couponId) {
        const coupon = await tx.storeCoupon.findUniqueOrThrow({ where: { id: couponId } })
        const claimed = await tx.storeCoupon.updateMany({ where: { id: couponId, ...(coupon.maxRedemptions === null ? {} : { redeemedCount: { lt: coupon.maxRedemptions } }) }, data: { redeemedCount: { increment: 1 } } })
        if (!claimed.count) throw new Error("TEST_CHECKOUT_UNAVAILABLE")
      }
      const location = input.deliveryMethod === "LOCAL_DELIVERY" ? input.deliveryLocation : null
      const order = await tx.order.create({ data: {
        checkoutToken: input.checkoutToken, storeId: input.storeId, customerId, customerEmail: input.customerInfo.email.trim().toLowerCase(),
        status: "PAID", paymentMethod: "STRIPE", paidAt: new Date(), stripeSessionId: session.id, stripePaymentIntentId: paymentIntentId,
        subtotal: quote.subtotal, total: quote.total, shippingFee: quote.shippingFee, discountAmount: quote.discountAmount,
        platformFee, couponId, couponCode: quote.couponCode, customerInfo: input.customerInfo, notes: input.customerInfo.notes,
        delivery: { create: { storeId: input.storeId, method: input.deliveryMethod, status: "PENDING", formattedAddress: location?.formattedAddress, lat: location?.lat, lng: location?.lng, notes: location?.notes } },
        items: { create: input.items.map(item => {
          const p = snapshots.find(p => p.id === item.productId)!
          return { productId: p.id, quantity: item.quantity, unitPrice: p.price, total: fromMinorUnits(toMinorUnits(p.price) * item.quantity), productSnapshot: { name: p.name, price: p.price, images: p.images, sku: p.sku, selectedOptions: item.variantSelection } }
        }) },
        payment: { create: { storeId: input.storeId, amount: quote.total, currency: "mxn", platformFee, status: "SUCCEEDED", stripePaymentIntentId: paymentIntentId } },
      } })
      await tx.testCheckoutDraft.update({ where: { id: draft.id }, data: { orderId: order.id, status: "PAID", stripeSessionId: session.id } })
      return order.id
    })
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "TEST_CHECKOUT_UNAVAILABLE") throw error
    const claimed = await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM test_checkout_drafts WHERE id = ${draftId} FOR UPDATE`
      const draft = await tx.testCheckoutDraft.findUniqueOrThrow({ where: { id: draftId } })
      if (draft.orderId || draft.status === "REFUNDED") return draft
      return tx.testCheckoutDraft.update({ where: { id: draftId }, data: { status: "REFUNDING" } })
    })
    if (claimed.orderId || claimed.status === "REFUNDED") return claimed.orderId
    // Stock/limits may change while paying. Refund the TEST payment instead of creating an invalid order.
    await stripe.refunds.create({ payment_intent: paymentIntentId }, { idempotencyKey: `test-draft-refund:${draftId}` })
    await db.testCheckoutDraft.update({ where: { id: draftId }, data: { status: "REFUNDED" } })
    return null
  }
}
