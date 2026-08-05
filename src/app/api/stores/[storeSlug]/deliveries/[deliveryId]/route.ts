import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ACTIVE_DELIVERY_STATUSES } from "@/lib/delivery"
import { deliveryAssignmentSchema } from "@/lib/delivery-schemas"
import { getStoreAccess } from "@/lib/store-access"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; deliveryId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug, deliveryId } = await params
  const membership = await getStoreAccess(session.user.id, storeSlug, ["OWNER", "STAFF"])
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const parsed = deliveryAssignmentSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 })
  }

  const updated = await db.$transaction(async (tx) => {
    const current = await tx.delivery.findFirst({
      where: { id: deliveryId, storeId: membership.store.id },
      include: {
        driver: { select: { id: true, status: true } },
        order: { select: { id: true, status: true } },
      },
    })
    if (!current) return null
    if (current.method !== "LOCAL_DELIVERY") {
      throw new Error("DELIVERY_METHOD_INVALID")
    }
    if (current.status === "DELIVERED" || current.status === "CANCELLED") {
      throw new Error("DELIVERY_LOCKED")
    }

    const nextDriverId = parsed.data.driverId
    if ((current.driverId ?? null) === (nextDriverId ?? null)) {
      return current
    }

    let nextDriver: { id: string; status: "AVAILABLE" | "OFFLINE" } | null = null
    if (nextDriverId) {
      nextDriver = await tx.driver.findFirst({
        where: {
          id: nextDriverId,
          storeId: membership.store.id,
        },
        select: {
          id: true,
          status: true,
        },
      })
      if (!nextDriver) throw new Error("DRIVER_NOT_FOUND")
      if (nextDriver.status !== "AVAILABLE") throw new Error("DRIVER_UNAVAILABLE")
      const activeCount = await tx.delivery.count({
        where: {
          driverId: nextDriver.id,
          status: { in: ACTIVE_DELIVERY_STATUSES },
        },
      })
      if (activeCount > 0) throw new Error("DRIVER_BUSY")
    }

    if (current.driverId && current.driverId !== nextDriverId) {
      const oldDriverActiveCount = await tx.delivery.count({
        where: {
          driverId: current.driverId,
          status: { in: ACTIVE_DELIVERY_STATUSES },
          id: { not: deliveryId },
        },
      })
      if (oldDriverActiveCount === 0) {
        await tx.driver.update({
          where: { id: current.driverId },
          data: { status: "AVAILABLE" },
        })
      }
    }

    if (nextDriverId) {
      await tx.driver.update({
        where: { id: nextDriverId },
        data: { status: "OFFLINE" },
      })
    }

    const nextStatus = nextDriverId ? "ASSIGNED" : "PENDING"

    const delivery = await tx.delivery.update({
      where: { id: current.id },
      data: {
        driverId: nextDriverId,
        status: nextStatus,
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
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            plate: true,
            licenseNumber: true,
            status: true,
          },
        },
      },
    })

    return delivery
  })

  if (!updated) return NextResponse.json({ message: "Entrega no encontrada" }, { status: 404 })

  return NextResponse.json(updated)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; deliveryId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug, deliveryId } = await params
  const membership = await getStoreAccess(session.user.id, storeSlug)
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const delivery = await db.delivery.findFirst({
    where: { id: deliveryId, storeId: membership.store.id },
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
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            plate: true,
            licenseNumber: true,
            status: true,
          },
        },
    },
  })

  if (!delivery) return NextResponse.json({ message: "Entrega no encontrada" }, { status: 404 })

  return NextResponse.json(delivery)
}
