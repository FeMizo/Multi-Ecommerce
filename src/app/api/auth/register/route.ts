import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email"
const schema = z.object({
  accountType: z.enum(["SELLER", "BUYER"]),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
  password: z.string().min(8),
  planId: z.string().optional().nullable(),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Datos invalidos" }, { status: 400 })

  const { name, email, phone, password } = parsed.data
  const normalizedEmail = email.trim().toLowerCase()

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) return NextResponse.json({ message: "El email ya esta registrado" }, { status: 409 })

  const hashed = await bcrypt.hash(password, 12)
  const user = await db.user.create({ data: { name, email: normalizedEmail, phone, password: hashed, globalRole: "USER" } })

  await db.order.updateMany({
    where: { customerEmail: normalizedEmail, customerId: null },
    data: { customerId: user.id },
  })

  void sendWelcomeEmail({ email: normalizedEmail, name }).catch(() => {})
  return NextResponse.json({ success: true }, { status: 201 })
}
