import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

type OrderItem = { productId: string; quantity: number }
type Product = { id: string; sellerId: string; price: number; seller: { commissionRate: number } }

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Webhook inválido" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    const { userId, shippingAddress, items } = session.metadata!

    const parsedItems: OrderItem[] = JSON.parse(items)
    const products = await db.product.findMany({
      where: { id: { in: parsedItems.map((i) => i.productId) } },
      include: { seller: true },
    }) as unknown as Product[]

    const sellerGroups = parsedItems.reduce<Record<string, OrderItem[]>>((acc, item) => {
      const product = products.find((p) => p.id === item.productId)!
      if (!acc[product.sellerId]) acc[product.sellerId] = []
      acc[product.sellerId].push(item)
      return acc
    }, {})

    for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
      const seller = products.find((p) => p.sellerId === sellerId)!.seller
      const subtotal = sellerItems.reduce((acc, item) => {
        const product = products.find((p) => p.id === item.productId)!
        return acc + product.price * item.quantity
      }, 0)
      const commission = subtotal * seller.commissionRate

      await db.order.create({
        data: {
          buyerId: userId,
          sellerId,
          status: "PAID",
          subtotal,
          commission,
          total: subtotal,
          shippingAddress: JSON.parse(shippingAddress),
          stripeSessionId: session.id,
          stripePaymentId: session.payment_intent as string,
          paidAt: new Date(),
          items: {
            create: sellerItems.map((item) => {
              const product = products.find((p) => p.id === item.productId)!
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price,
                total: product.price * item.quantity,
              }
            }),
          },
        },
      })

      await db.seller.update({
        where: { id: sellerId },
        data: { totalSales: { increment: sellerItems.reduce((acc, i) => acc + i.quantity, 0) } },
      })
    }
  }

  return NextResponse.json({ received: true })
}
