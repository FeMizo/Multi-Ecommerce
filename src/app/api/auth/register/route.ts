import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email"
import { buildDriverEmail, normalizeDriverPhone } from "@/lib/delivery"

const accountTypes = ["SELLER", "RIDER", "BUYER"] as const

const sellerBuyerSchema = z.object({
  accountType: z.enum(["SELLER", "BUYER"]),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
  password: z.string().min(8),
  planId: z.string().optional().nullable(),
})

const riderSchema = z.object({
  accountType: z.literal("RIDER"),
  name: z.string().min(2),
  phone: z.string().min(7).max(30),
  password: z.string().min(8),
  plate: z.string().min(2),
  licenseNumber: z.string().min(3),
  planId: z.string().optional().nullable(),
})

const schema = z.discriminatedUnion("accountType", [sellerBuyerSchema, riderSchema])

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Datos invalidos" }, { status: 400 })

  if (parsed.data.accountType === "RIDER") {
    const phone = normalizeDriverPhone(parsed.data.phone)
    const email = buildDriverEmail(phone)
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ message: "El repartidor ya esta registrado" }, { status: 409 })
    }

    const existingDriver = await db.driver.findUnique({ where: { email } })
    const hashed = await bcrypt.hash(parsed.data.password, 12)

    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email,
        phone: parsed.data.phone,
        password: hashed,
        globalRole: "USER",
      },
    })

    if (existingDriver) {
      if (existingDriver.storeId) {
        return NextResponse.json({ message: "Ese repartidor ya esta asignado a una tienda" }, { status: 409 })
      }

      await db.driver.update({
        where: { email },
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone,
          plate: parsed.data.plate,
          licenseNumber: parsed.data.licenseNumber,
          status: "AVAILABLE",
        },
      })
    } else {
      await db.driver.create({
        data: {
          storeId: null,
          name: parsed.data.name,
          email,
          phone: parsed.data.phone,
          plate: parsed.data.plate,
          licenseNumber: parsed.data.licenseNumber,
          status: "AVAILABLE",
        },
      })
    }

    void sendWelcomeEmail({ email: user.email, name: user.name ?? parsed.data.name }).catch(() => {})
    return NextResponse.json({ success: true }, { status: 201 })
  }

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
