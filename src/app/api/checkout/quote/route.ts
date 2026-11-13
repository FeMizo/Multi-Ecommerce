import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { quoteCheckout } from "@/lib/checkout-quote"
import { normalizeCouponCode } from "@/lib/store-coupons"
import { checkRateLimit, getClientAddress } from "@/lib/rate-limit"
const schema = z.object({
  storeId: z.string().min(1).max(100), deliveryMethod: z.enum(["PICKUP", "LOCAL_DELIVERY"]), couponCode: z.string().max(32).optional(),
  items: z.array(z.object({ productId: z.string().min(1).max(100), quantity: z.number().int().min(1).max(99), variantSelection: z.array(z.object({ name: z.string().min(1).max(40), value: z.string().min(1).max(40) })).max(5).default([]) })).min(1).max(50),
})
export async function POST(request: Request) {
  const limit = checkRateLimit(`checkout-quote:${getClientAddress(request)}`, 120, 60_000)
  if (!limit.allowed) return NextResponse.json({ message: "Espera un momento y vuelve a calcular" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } })
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ message: "Revisa los datos del carrito" }, { status: 422 })
  const { storeId, items, deliveryMethod } = parsed.data
  const couponCode = normalizeCouponCode(parsed.data.couponCode ?? "") || undefined
  try {
    const [store, products, coupon] = await Promise.all([
      db.store.findFirst({ where: { id: storeId, isActive: true, deletedAt: null }, select: { id: true, deliveryFee: true, deliveryZone: true, latitude: true, longitude: true } }),
      db.product.findMany({ where: { id: { in: items.map((item) => item.productId) }, storeId, status: "ACTIVE", deletedAt: null }, select: { id: true, storeId: true, price: true, stock: true, manageStock: true, variantOptions: true } }),
      couponCode ? db.storeCoupon.findUnique({ where: { storeId_code: { storeId, code: couponCode } } }) : null,
    ])
    if (!store) return NextResponse.json({ message: "Tienda no disponible" }, { status: 404 })
    try { return NextResponse.json(quoteCheckout({ store, products, items, deliveryMethod, couponCode, coupon }), { headers: { "Cache-Control": "no-store" } }) }
    catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Revisa tu compra" }, { status: 422 }) }
  } catch { return NextResponse.json({ message: "No pudimos calcular el total. Inténtalo de nuevo." }, { status: 503 }) }
}
