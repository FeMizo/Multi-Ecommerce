import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-status"
import { sendOrderDeliveredEmail } from "@/lib/email"
import { sendWhatsAppText } from "@/lib/whatsapp"

const schema = z.object({
  status: z.enum(ORDER_STATUSES),
})

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

  const updated = await db.order.update({
    where: { id: orderId },
    data: { status: parsed.data.status },
    select: {
      id: true,
      status: true,
      customerInfo: true,
      customerEmail: true,
      customer: { select: { email: true, phone: true } },
      store: { select: { name: true, slug: true, logoUrl: true, primaryColor: true } },
    },
  })

  if ((updated.status as OrderStatus) === "DELIVERED" && order.status !== "DELIVERED") {
    const customerInfo = updated.customerInfo as { phone?: string }
    const customerEmail = updated.customer?.email ?? updated.customerEmail
    const whatsappResult = await sendWhatsAppText({
      phone: updated.customer?.phone ?? customerInfo.phone,
      message: `Tu pedido #${updated.id.slice(-8).toUpperCase()} de ${updated.store.name} fue entregado.`,
    }).catch(() => null)
    if (customerEmail) {
      await Promise.allSettled([
        sendOrderDeliveredEmail({ email: customerEmail, orderId: updated.id, store: updated.store }),
      ])
    }
    if (whatsappResult?.ok) {
      await db.order.update({ where: { id: updated.id }, data: { whatsappNotifiedAt: new Date() } })
    }
  }

  return NextResponse.json(updated)
}
