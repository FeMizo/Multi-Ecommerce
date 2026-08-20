import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { ACTIVE_DELIVERY_STATUSES } from "@/lib/delivery"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  await requireAdmin()

  const { orderId } = await params
  const delivery = await db.delivery.findFirst({
    where: { orderId },
    select: {
      id: true,
      driverId: true,
      status: true,
    },
  })

  if (!delivery) {
    return NextResponse.json({ message: "Entrega no encontrada" }, { status: 404 })
  }

  if (!delivery.driverId) {
    return NextResponse.json({ message: "El pedido no tiene repartidor asignado" }, { status: 409 })
  }

  await db.$transaction(async (tx) => {
    await tx.delivery.update({
      where: { id: delivery.id },
      data: {
        driverId: null,
        status: "PENDING",
      },
    })

    const activeCount = await tx.delivery.count({
      where: {
        driverId: delivery.driverId,
        status: { in: ACTIVE_DELIVERY_STATUSES },
      },
    })

    if (activeCount === 0) {
      await tx.driver.update({
        where: { id: delivery.driverId! },
        data: { status: "AVAILABLE" },
      })
    }
  })

  return NextResponse.json({ ok: true })
}
