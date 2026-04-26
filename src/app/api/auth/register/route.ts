import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Datos inválidos" }, { status: 400 })

  const { name, email, password } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ message: "El email ya está registrado" }, { status: 409 })

  const hashed = await bcrypt.hash(password, 12)
  await db.user.create({ data: { name, email, password: hashed, globalRole: "USER" } })

  return NextResponse.json({ success: true }, { status: 201 })
}
