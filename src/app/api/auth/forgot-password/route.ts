import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import crypto from "crypto"
import { sendPasswordResetEmail } from "@/lib/email"

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "Email inválido" }, { status: 400 })
  }

  const { email } = parsed.data
  const user = await db.user.findUnique({ where: { email } })

  if (!user) {
    return NextResponse.json({ success: true })
  }

  const identifier = `password-reset:${user.id}`
  const recentToken = await db.verificationToken.findFirst({
    where: { identifier, expires: { gt: new Date(Date.now() + 29 * 60 * 1000) } },
  })
  if (recentToken) return NextResponse.json({ success: true })

  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30)

  await db.verificationToken.deleteMany({ where: { identifier } })
  await db.verificationToken.create({
    data: {
      identifier,
      token: tokenHash,
      expires: expiresAt,
    },
  })

  try {
    await sendPasswordResetEmail(email, token)
  } catch {
    await db.verificationToken.deleteMany({ where: { identifier, token: tokenHash } })
    return NextResponse.json({ message: "El servicio de correo no está disponible" }, { status: 503 })
  }

  return NextResponse.json({ success: true })
}
