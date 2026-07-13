import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
})

export async function POST(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  }

  const { productId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 })
  }

  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) {
    return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 })
  }

  const deliveredPurchase = await db.orderItem.findFirst({
    where: {
      productId,
      order: { customerId: session.user.id, status: "DELIVERED", deletedAt: null },
    },
    select: { id: true },
  })
  if (!deliveredPurchase) {
    return NextResponse.json({ message: "Solo puedes reseñar productos de pedidos entregados" }, { status: 403 })
  }

  const existing = await db.review.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  })

  if (existing) {
    const updated = await db.review.update({
      where: { id: existing.id },
      data: { rating: parsed.data.rating, comment: parsed.data.comment ?? null },
    })
    return NextResponse.json({ review: updated })
  }

  const review = await db.review.create({
    data: {
      userId: session.user.id,
      productId,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    },
  })

  return NextResponse.json({ review })
}
