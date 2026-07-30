import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendStoreVerificationEmail } from "@/lib/email"
import { buildStoreVerificationUrl, createStoreVerificationToken } from "@/lib/store-verification"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug } = await params
  const membership = await db.storeMember.findFirst({
    where: {
      userId: session.user.id,
      store: { slug: storeSlug },
      role: "OWNER",
    },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          isVerified: true,
          members: {
            where: { role: "OWNER" },
            select: { user: { select: { name: true, email: true } } },
            take: 1,
          },
        },
      },
    },
  })

  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })
  if (membership.store.isVerified) return NextResponse.json({ message: "La tienda ya esta verificada" }, { status: 409 })

  const owner = membership.store.members[0]?.user
  if (!owner?.email) return NextResponse.json({ message: "La tienda no tiene un correo de contacto" }, { status: 400 })

  const { identifier, token, tokenHash, expiresAt } = createStoreVerificationToken(membership.store.id)
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? req.nextUrl.origin

  await db.verificationToken.deleteMany({ where: { identifier } })
  await db.verificationToken.create({
    data: { identifier, token: tokenHash, expires: expiresAt },
  })

  try {
    await sendStoreVerificationEmail({
      email: owner.email,
      name: owner.name ?? membership.store.name,
      storeName: membership.store.name,
      verificationUrl: buildStoreVerificationUrl(origin, membership.store.id, token),
    })
  } catch {
    await db.verificationToken.deleteMany({ where: { identifier, token: tokenHash } })
    return NextResponse.json({ message: "No se pudo enviar el correo de verificacion" }, { status: 503 })
  }

  return NextResponse.json({ success: true })
}
