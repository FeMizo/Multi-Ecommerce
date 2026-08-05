import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { buildDriverEmail, normalizeDriverPhone } from "@/lib/delivery"
import { driverUpdateSchema } from "@/lib/delivery-schemas"
import { ACTIVE_DELIVERY_STATUSES } from "@/lib/delivery"
import { getStoreAccess } from "@/lib/store-access"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; driverId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug, driverId } = await params
  const membership = await getStoreAccess(session.user.id, storeSlug, ["OWNER"])
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const parsed = driverUpdateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 })
  }

  const current = await db.driver.findFirst({
    where: { id: driverId, storeId: membership.store.id },
    select: {
      id: true,
      phone: true,
      plate: true,
      licenseNumber: true,
      status: true,
    },
  })
  if (!current) return NextResponse.json({ message: "Repartidor no encontrado" }, { status: 404 })

  const phone = normalizeDriverPhone(parsed.data.phone)
  const email = buildDriverEmail(phone)
  const duplicate = await db.driver.findFirst({
    where: {
      email,
      id: { not: current.id },
    },
    select: {
      id: true,
      storeId: true,
    },
  })
  if (duplicate) {
    return NextResponse.json({ message: "Ya existe un repartidor con ese telefono" }, { status: 409 })
  }

  const activeDeliveryCount = await db.delivery.count({
    where: {
      driverId: current.id,
      status: { in: ACTIVE_DELIVERY_STATUSES },
    },
  })

  if (parsed.data.status === "OFFLINE" && activeDeliveryCount > 0) {
    return NextResponse.json({ message: "No puedes desconectar a un repartidor con pedidos activos" }, { status: 409 })
  }

  const updated = await db.driver.update({
    where: { id: current.id },
    data: {
      name: parsed.data.name.trim(),
      email,
      phone,
      plate: parsed.data.plate.trim(),
      licenseNumber: parsed.data.licenseNumber.trim(),
      notes: parsed.data.notes || null,
      status: parsed.data.status,
      storeId: membership.store.id,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      plate: true,
      licenseNumber: true,
      notes: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; driverId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug, driverId } = await params
  const membership = await getStoreAccess(session.user.id, storeSlug, ["OWNER"])
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const driver = await db.driver.findFirst({
    where: { id: driverId, storeId: membership.store.id },
    select: {
      id: true,
    },
  })
  if (!driver) return NextResponse.json({ message: "Repartidor no encontrado" }, { status: 404 })

  const activeDeliveryCount = await db.delivery.count({
    where: {
      driverId: driver.id,
      status: { in: ACTIVE_DELIVERY_STATUSES },
    },
  })
  if (activeDeliveryCount > 0) {
    return NextResponse.json({ message: "No puedes eliminar a un repartidor con pedidos activos" }, { status: 409 })
  }

  await db.driver.delete({ where: { id: driver.id } })
  return NextResponse.json({ ok: true })
}
