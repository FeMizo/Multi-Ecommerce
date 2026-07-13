import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { z } from "zod"
import crypto from "crypto"

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 })
  }

  const { token, password } = parsed.data
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
  const verification = await db.verificationToken.findFirst({
    where: {
      token: tokenHash,
      expires: { gt: new Date() },
    },
  })

  if (!verification) {
    return NextResponse.json({ message: "Token inválido o expirado" }, { status: 400 })
  }

  if (!verification.identifier.startsWith("password-reset:")) {
    return NextResponse.json({ message: "Token inválido o expirado" }, { status: 400 })
  }
  const userId = verification.identifier.slice("password-reset:".length)
  const hashed = await bcrypt.hash(password, 12)

  try {
    await db.$transaction(async (tx) => {
      const consumed = await tx.verificationToken.deleteMany({
        where: { identifier: verification.identifier, token: tokenHash, expires: { gt: new Date() } },
      })
      if (consumed.count !== 1) throw new Error("TOKEN_CONSUMED")
      await tx.user.update({ where: { id: userId }, data: { password: hashed } })
      await tx.verificationToken.deleteMany({ where: { identifier: verification.identifier } })
    })
  } catch (error) {
    if (error instanceof Error && error.message === "TOKEN_CONSUMED") {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 400 })
    }
    throw error
  }

  return NextResponse.json({ success: true })
}
