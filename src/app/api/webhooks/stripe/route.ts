import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

type OrderItemInput = { productId: string; quantity: number }

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
    const { userId, storeId, commissionRate, shippingAddress, items } = session.metadata!

    const parsedItems: OrderItemInput[] = JSON.parse(items)
    const products = await db.product.findMany({
      where: { id: { in: parsedItems.map((i) => i.productId) } },
    })

    const subtotal = parsedItems.reduce((acc, item) => {
      const product = products.find((p) => p.id === item.productId)!
      return acc + product.price * item.quantity
    }, 0)

    const platformFee = subtotal * parseFloat(commissionRate ?? "0.05")

    await db.order.create({
      data: {
        storeId,
        customerId: userId,
        status: "PAID",
        subtotal,
        platformFee,
        total: subtotal,
        shippingAddress: JSON.parse(shippingAddress),
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
        paidAt: new Date(),
        items: {
          create: parsedItems.map((item) => {
            const product = products.find((p) => p.id === item.productId)!
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: product.price,
              total: product.price * item.quantity,
              productSnapshot: {
                name: product.name,
                price: product.price,
                images: product.images,
                sku: product.sku,
              },
            }
          }),
        },
      },
    })
  }

  return NextResponse.json({ received: true })
}
