import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const storeId = url.searchParams.get("storeId")
  const token = url.searchParams.get("token")

  if (!storeId || !token) {
    return NextResponse.json({ message: "Token inválido" }, { status: 400 })
  }

  const identifier = `store-verification:${storeId}`
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

  const verification = await db.verificationToken.findFirst({
    where: {
      identifier,
      token: tokenHash,
      expires: { gt: new Date() },
    },
  })

  if (!verification) {
    return NextResponse.json({ message: "El enlace de verificación no es válido o expiró" }, { status: 400 })
  }

  const store = await db.store.findFirst({
    where: { id: storeId, deletedAt: null },
    select: { id: true, slug: true, name: true, members: { where: { role: "OWNER" }, select: { userId: true }, take: 1 } },
  })

  if (!store) {
    return NextResponse.json({ message: "Tienda no encontrada" }, { status: 404 })
  }

  await db.$transaction([
    db.store.update({ where: { id: store.id }, data: { isVerified: true } }),
    db.user.updateMany({
      where: { id: { in: store.members.map((member) => member.userId) } },
      data: { emailVerified: new Date() },
    }),
    db.verificationToken.deleteMany({ where: { identifier } }),
  ])

  return NextResponse.redirect(new URL(`/verification/success?store=${encodeURIComponent(store.slug)}`, req.url))
}
