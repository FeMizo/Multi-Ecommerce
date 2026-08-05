import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ACTIVE_DELIVERY_STATUSES } from "@/lib/delivery"
import { riderDeliveryUpdateSchema } from "@/lib/delivery-schemas"

async function getRider(storeSlug: string, email: string) {
  return db.driver.findFirst({
    where: {
      store: { slug: storeSlug },
      email,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      plate: true,
      licenseNumber: true,
      status: true,
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; deliveryId: string }> }
) {
  const session = await auth()
  const email = session?.user?.email?.trim().toLowerCase()
  if (!session?.user?.id || !email) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug, deliveryId } = await params
  const rider = await getRider(storeSlug, email)
  if (!rider || !rider.store) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const parsed = riderDeliveryUpdateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 })
  }

  const delivery = await db.delivery.findFirst({
    where: {
      id: deliveryId,
      storeId: rider.store.id,
      driverId: rider.id,
      status: { in: ACTIVE_DELIVERY_STATUSES },
    },
    select: {
      id: true,
      status: true,
      driverId: true,
      orderId: true,
      method: true,
      formattedAddress: true,
      lat: true,
      lng: true,
      notes: true,
      order: { select: { id: true, status: true } },
    },
  })

  if (!delivery) {
    return NextResponse.json({ message: "Entrega no encontrada" }, { status: 404 })
  }

  const nextStatus = parsed.data.status
  const updated = await db.$transaction(async (tx) => {
    const nextDelivery = await tx.delivery.update({
      where: { id: delivery.id },
      data: {
        status: nextStatus,
        notes: parsed.data.notes || undefined,
      },
      select: {
        id: true,
        status: true,
        driverId: true,
        orderId: true,
        method: true,
        formattedAddress: true,
        lat: true,
        lng: true,
        notes: true,
      },
    })

    if (nextStatus === "DELIVERED" || nextStatus === "CANCELLED") {
      const otherActiveDeliveries = await tx.delivery.count({
        where: {
          driverId: rider.id,
          status: { in: ACTIVE_DELIVERY_STATUSES },
          id: { not: delivery.id },
        },
      })
      if (otherActiveDeliveries === 0) {
        await tx.driver.update({
          where: { id: rider.id },
          data: { status: "AVAILABLE" },
        })
      }
    }

    return nextDelivery
  })

  return NextResponse.json(updated)
}
