import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  state: z.string().min(2),
  country: z.string().default("PE"),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Inválido" }, { status: 400 })

  try {
    const city = await db.city.create({ data: parsed.data })
    return NextResponse.json(city, { status: 201 })
  } catch {
    return NextResponse.json({ message: "El slug ya existe" }, { status: 409 })
  }
}
