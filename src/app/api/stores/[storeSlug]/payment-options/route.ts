import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  cashOnDeliveryEnabled: z.boolean(),
})

async function getOwnedStore(userId: string, storeSlug: string) {
  return db.storeMember.findFirst({
    where: {
      userId,
      role: "OWNER",
      store: { slug: storeSlug },
    },
    include: { store: { select: { id: true } } },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug } = await params
  const membership = await getOwnedStore(session.user.id, storeSlug)
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const store = await db.store.findUnique({
    where: { id: membership.store.id },
    select: {
      cashOnDeliveryEnabled: true,
      stripeOnboarded: true,
    },
  })

  return NextResponse.json(store)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug } = await params
  const membership = await getOwnedStore(session.user.id, storeSlug)
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Datos inválidos" }, { status: 400 })

  const store = await db.store.update({
    where: { id: membership.store.id },
    data: { cashOnDeliveryEnabled: parsed.data.cashOnDeliveryEnabled },
    select: { cashOnDeliveryEnabled: true },
  })

  return NextResponse.json(store)
}
