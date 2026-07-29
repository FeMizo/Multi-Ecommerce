import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2).max(60),
  phone: z.string().max(20).optional().or(z.literal("")),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autenticado" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Datos inválidos" }, { status: 400 })

  const { name, phone } = parsed.data

  await db.user.update({
    where: { id: session.user.id },
    data: { name, phone: phone || null },
  })

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autenticado" }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, image: true },
  })

  if (!user) return NextResponse.json({ message: "No autenticado" }, { status: 401 })

  return NextResponse.json(user)
}
