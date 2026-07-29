import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendStoreVerificationEmail } from "@/lib/email"

function buildVerificationUrl(storeId: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "http://localhost:1500"
  return `${appUrl}/api/verification/store?storeId=${encodeURIComponent(storeId)}&token=${encodeURIComponent(token)}`
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { storeId } = await params
  const store = await db.store.findFirst({
    where: { id: storeId, deletedAt: null },
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
  })

  if (!store) return NextResponse.json({ message: "Tienda no encontrada" }, { status: 404 })
  const owner = store.members[0]?.user
  if (!owner?.email) return NextResponse.json({ message: "La tienda no tiene un correo de contacto" }, { status: 400 })
  if (store.isVerified) return NextResponse.json({ message: "La tienda ya está verificada" }, { status: 409 })

  const identifier = `store-verification:${store.id}`
  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)

  await db.verificationToken.deleteMany({ where: { identifier } })
  await db.verificationToken.create({
    data: {
      identifier,
      token: tokenHash,
      expires: expiresAt,
    },
  })

  try {
    await sendStoreVerificationEmail({
      email: owner.email,
      name: owner.name ?? store.name,
      storeName: store.name,
      verificationUrl: buildVerificationUrl(store.id, token),
    })
  } catch {
    await db.verificationToken.deleteMany({ where: { identifier, token: tokenHash } })
    return NextResponse.json({ message: "No se pudo enviar el correo de verificación" }, { status: 503 })
  }

  return NextResponse.json({ success: true })
}
