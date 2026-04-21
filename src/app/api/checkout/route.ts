import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 })

  const { items, shippingAddress } = await req.json()
  if (!items?.length) return NextResponse.json({ message: "Carrito vacío" }, { status: 400 })

  const productIds = items.map((i: { productId: string }) => i.productId)
  const products = await db.product.findMany({
    where: { id: { in: productIds }, status: "ACTIVE" },
    include: { seller: true },
  })

  if (products.length !== items.length) {
    return NextResponse.json({ message: "Algunos productos no están disponibles" }, { status: 400 })
  }

  const lineItems = items.map((item: { productId: string; name: string; quantity: number }) => {
    const product = products.find((p: { id: string }) => p.id === item.productId)!
    return {
      price_data: {
        currency: "pen",
        product_data: {
          name: item.name,
          images: product.images.slice(0, 1),
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: item.quantity,
    }
  })

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
    metadata: {
      userId: session.user?.id ?? "",
      shippingAddress: JSON.stringify(shippingAddress),
      items: JSON.stringify(items.map((i: { productId: string; quantity: number }) => ({ productId: i.productId, quantity: i.quantity }))),
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
