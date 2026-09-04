import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { buildDriverEmail, normalizeDriverPhone } from "@/lib/delivery"
import { driverCreateSchema } from "@/lib/delivery-schemas"
import { getStoreAccess } from "@/lib/store-access"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug } = await params
  const membership = await getStoreAccess(session.user.id, storeSlug)
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const drivers = await db.driver.findMany({
    where: { storeId: membership.store.id },
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
      deliveries: {
        where: { status: { in: ["PENDING", "ASSIGNED", "IN_TRANSIT"] } },
        select: { id: true, status: true },
        take: 1,
      },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  })

  return NextResponse.json({
    drivers: drivers.map((driver) => {
      const { deliveries, ...rest } = driver
      return {
        ...rest,
        activeDelivery: deliveries[0] ?? null,
      }
    }),
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug } = await params
  const membership = await getStoreAccess(session.user.id, storeSlug, ["OWNER"])
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const parsed = driverCreateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 })
  }

  const phone = normalizeDriverPhone(parsed.data.phone)
  const email = buildDriverEmail(phone)

  const existing = await db.driver.findUnique({
    where: { email },
    select: { id: true, storeId: true },
  })
  if (existing && existing.storeId && existing.storeId !== membership.store.id) {
    return NextResponse.json({ message: "Ese repartidor ya pertenece a otra tienda" }, { status: 409 })
  }

  const driver = existing
    ? await db.driver.update({
        where: { id: existing.id },
        data: {
          storeId: membership.store.id,
          name: parsed.data.name.trim(),
          phone,
          plate: parsed.data.plate.trim(),
          licenseNumber: parsed.data.licenseNumber.trim(),
          notes: parsed.data.notes || null,
          status: parsed.data.status,
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
    : await db.driver.create({
        data: {
          storeId: membership.store.id,
          name: parsed.data.name.trim(),
          email,
          phone,
          plate: parsed.data.plate.trim(),
          licenseNumber: parsed.data.licenseNumber.trim(),
          notes: parsed.data.notes || null,
          status: parsed.data.status,
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

  return NextResponse.json(driver, { status: existing ? 200 : 201 })
}
