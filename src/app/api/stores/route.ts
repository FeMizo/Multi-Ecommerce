import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { RESERVED_STORE_SLUGS, storeCreateSchema } from "@/lib/schemas"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const storeId = url.searchParams.get("storeId")
  if (!storeId) {
    return NextResponse.json({ message: "Falta storeId" }, { status: 400 })
  }

  const store = await db.store.findUnique({
    where: { id: storeId },
    select: {
      id: true,
      name: true,
      isActive: true,
      deletedAt: true,
      stripeOnboarded: true,
      cashOnDeliveryEnabled: true,
      transferEnabled: true,
    },
  })

  if (!store) {
    return NextResponse.json({ message: "Tienda no encontrada" }, { status: 404 })
  }

  return NextResponse.json(store)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = storeCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, slug, description, cityId } = parsed.data

  if (RESERVED_STORE_SLUGS.has(slug)) {
    return NextResponse.json({ message: "Ese slug esta reservado por el sistema" }, { status: 409 })
  }

  const existing = await db.store.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ message: "Ese nombre de tienda ya esta en uso" }, { status: 409 })
  }

  const store = await db.$transaction(async (tx) => {
    const newStore = await tx.store.create({
      data: {
        name,
        slug,
        description,
        cityId: cityId || null,
        isActive: true,
        cashOnDeliveryEnabled: true,
        transferEnabled: true,
      },
    })

    await tx.storeMember.create({
      data: {
        storeId: newStore.id,
        userId: session.user.id,
        role: "OWNER",
      },
    })

    return newStore
  })

  return NextResponse.json({ slug: store.slug }, { status: 201 })
}
