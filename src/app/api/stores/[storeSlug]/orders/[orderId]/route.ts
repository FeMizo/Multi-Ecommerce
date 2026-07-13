import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { OrderStatus } from "@prisma/client"

const schema = z.object({
  status: z.enum(["PROCESSING", "SHIPPED", "DELIVERED"] as [OrderStatus, ...OrderStatus[]]),
})

const allowedTransitions: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
}

async function getMembership(userId: string, storeSlug: string) {
  return db.storeMember.findFirst({
    where: {
      userId,
      store: { slug: storeSlug },
      role: { in: ["OWNER", "STAFF"] },
    },
    include: { store: { select: { id: true } } },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; orderId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug, orderId } = await params
  const membership = await getMembership(session.user.id, storeSlug)
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const storeId = membership.store.id
  const order = await db.order.findFirst({ where: { id: orderId, storeId, deletedAt: null } })
  if (!order) return NextResponse.json({ message: "Pedido no encontrado" }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 })
  }
  if (allowedTransitions[order.status] !== parsed.data.status) {
    return NextResponse.json({ message: "Transición de estado no permitida" }, { status: 409 })
  }

  const updated = await db.order.update({
    where: { id: orderId },
    data: { status: parsed.data.status },
    select: { id: true, status: true },
  })

  return NextResponse.json(updated)
}
