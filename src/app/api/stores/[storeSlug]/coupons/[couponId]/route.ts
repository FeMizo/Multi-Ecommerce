import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

async function getOwnedStore(userId: string, storeSlug: string) {
  return db.storeMember.findFirst({
    where: { userId, role: "OWNER", store: { slug: storeSlug } },
    include: { store: { select: { id: true } } },
  })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext<"/api/stores/[storeSlug]/coupons/[couponId]">) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug, couponId } = await params
  const membership = await getOwnedStore(userId, storeSlug)
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const coupon = await db.storeCoupon.findFirst({
    where: { id: couponId, storeId: membership.store.id },
    select: { id: true },
  })
  if (!coupon) return NextResponse.json({ message: "Cupón no encontrado" }, { status: 404 })

  await db.storeCoupon.delete({ where: { id: coupon.id } })
  return NextResponse.json({ ok: true })
}
